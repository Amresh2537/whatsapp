import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Message from '@/models/Message';
import Contact from '@/models/Contact';
import User from '@/models/User';
import { createWhatsAppAPI } from '@/lib/whatsapp';
import jwt from 'jsonwebtoken';

async function verifyToken(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new Error('No token provided');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// GET /api/messages - List messages for user
export async function GET(request) {
  try {
    await dbConnect();
    
    const decoded = await verifyToken(request);
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const direction = searchParams.get('direction'); // 'inbound' or 'outbound'
    const status = searchParams.get('status');
    const contactId = searchParams.get('contactId');
    
    // Build query
    const query = { userId: decoded.userId };
    
    if (direction) {
      query.direction = direction;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (contactId) {
      query.contactId = contactId;
    }
    
    // Get messages with pagination and populate contact info
    const messages = await Message.find(query)
      .populate('contactId', 'firstName lastName phoneNumber')
      .populate('templateId', 'name')
      .populate('campaignId', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    
    const total = await Message.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    
    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/messages - Send a single message
export async function POST(request) {
  try {
    await dbConnect();
    
    const decoded = await verifyToken(request);
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.whatsappConfig) {
      return NextResponse.json({ error: 'WhatsApp configuration not found' }, { status: 400 });
    }

    // Check user's message limit
    if (user.subscription.messagesUsed >= user.subscription.messageLimit) {
      return NextResponse.json({ error: 'Message limit exceeded' }, { status: 403 });
    }

    const messageData = await request.json();
    
    // Validate required fields
    if (!messageData.phoneNumber || (!messageData.text && !messageData.templateName)) {
      return NextResponse.json({ error: 'Phone number and message content are required' }, { status: 400 });
    }

    // Find or create contact
    const normalizedPhone = messageData.phoneNumber.replace(/\D/g, '');
    let contact = await Contact.findOne({ 
      userId: decoded.userId, 
      normalizedPhoneNumber: normalizedPhone 
    });
    
    if (!contact) {
      contact = new Contact({
        userId: decoded.userId,
        phoneNumber: messageData.phoneNumber,
        normalizedPhoneNumber: normalizedPhone,
      });
      await contact.save();
    }

    // Check if contact is unsubscribed
    if (contact.isUnsubscribed) {
      return NextResponse.json({ error: 'Contact has unsubscribed' }, { status: 400 });
    }

    // Create WhatsApp API instance
    const whatsappAPI = createWhatsAppAPI(user.whatsappConfig);

    // Create message record
    const message = new Message({
      userId: decoded.userId,
      contactId: contact._id,
      phoneNumber: messageData.phoneNumber,
      normalizedPhoneNumber: normalizedPhone,
      direction: 'outbound',
      type: messageData.templateName ? 'template' : 'text',
      status: 'SENDING',
      content: {
        text: messageData.text,
        templateName: messageData.templateName,
        templateLanguage: messageData.templateLanguage || 'en_US',
        headerValue: messageData.headerValue,
        bodyParameters: messageData.bodyParameters || [],
      },
    });

    await message.save();

    try {
      let response;
      
      if (messageData.templateName) {
        // Send template message
        response = await whatsappAPI.sendTemplateMessage({
          phoneNumber: normalizedPhone,
          templateName: messageData.templateName,
          languageCode: messageData.templateLanguage || 'en_US',
          headerValue: messageData.headerValue,
          bodyParameters: messageData.bodyParameters || [],
        });
      } else {
        // Send text message
        response = await whatsappAPI.sendTextMessage(normalizedPhone, messageData.text);
      }

      // Update message with WhatsApp response
      if (response.messages && response.messages[0] && response.messages[0].id) {
        message.whatsappMessageId = response.messages[0].id;
        message.status = 'SENT';
        message.sentDate = new Date();
        
        // Update user's message usage
        user.subscription.messagesUsed += 1;
        await user.save();
        
        // Update contact statistics
        contact.lastMessageDate = new Date();
        contact.messageCount += 1;
        await contact.save();
      } else {
        message.status = 'FAILED';
        message.errorMessage = 'No message ID received from WhatsApp API';
      }

      await message.save();
      await message.populate('contactId', 'firstName lastName phoneNumber');
      
      return NextResponse.json({ message });
      
    } catch (sendError) {
      console.error('Error sending message:', sendError);
      message.status = 'FAILED';
      message.errorMessage = sendError.message;
      await message.save();
      
      return NextResponse.json({ error: sendError.message }, { status: 500 });
    }

  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
