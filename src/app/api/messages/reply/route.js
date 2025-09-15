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

// POST /api/messages/reply - Reply to a received message
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

    const { messageId, replyText, templateName, templateLanguage, headerValue, bodyParameters } = await request.json();
    
    // Validate required fields
    if (!messageId || (!replyText && !templateName)) {
      return NextResponse.json({ error: 'Message ID and reply content are required' }, { status: 400 });
    }

    // Find the original message
    const originalMessage = await Message.findOne({ 
      _id: messageId, 
      userId: decoded.userId,
      direction: 'inbound' // Can only reply to inbound messages
    }).populate('contactId');
    
    if (!originalMessage) {
      return NextResponse.json({ error: 'Original message not found or not eligible for reply' }, { status: 404 });
    }

    const contact = originalMessage.contactId;
    
    // Check if contact is unsubscribed
    if (contact.isUnsubscribed) {
      return NextResponse.json({ error: 'Contact has unsubscribed' }, { status: 400 });
    }

    // Create WhatsApp API instance
    const whatsappAPI = createWhatsAppAPI(user.whatsappConfig);

    // Create reply message record
    const replyMessage = new Message({
      userId: decoded.userId,
      contactId: contact._id,
      phoneNumber: contact.phoneNumber,
      normalizedPhoneNumber: contact.normalizedPhoneNumber,
      direction: 'outbound',
      type: templateName ? 'template' : 'text',
      status: 'SENDING',
      content: {
        text: replyText,
        templateName: templateName,
        templateLanguage: templateLanguage || 'en_US',
        headerValue: headerValue,
        bodyParameters: bodyParameters || [],
      },
      // Link to original message
      replyToMessageId: originalMessage._id,
    });

    await replyMessage.save();

    try {
      let response;
      
      if (templateName) {
        // Send template message
        response = await whatsappAPI.sendTemplateMessage({
          phoneNumber: contact.normalizedPhoneNumber,
          templateName: templateName,
          languageCode: templateLanguage || 'en_US',
          headerValue: headerValue,
          bodyParameters: bodyParameters || [],
        });
      } else {
        // Send text message
        response = await whatsappAPI.sendTextMessage(contact.normalizedPhoneNumber, replyText);
      }

      // Update message with WhatsApp response
      if (response.messages && response.messages[0] && response.messages[0].id) {
        replyMessage.whatsappMessageId = response.messages[0].id;
        replyMessage.status = 'SENT';
        replyMessage.sentDate = new Date();
        
        // Update user's message usage
        user.subscription.messagesUsed += 1;
        await user.save();
        
        // Update contact statistics
        contact.lastMessageDate = new Date();
        contact.messageCount += 1;
        await contact.save();
      } else {
        replyMessage.status = 'FAILED';
        replyMessage.errorMessage = 'No message ID received from WhatsApp API';
      }

      await replyMessage.save();
      await replyMessage.populate('contactId', 'firstName lastName phoneNumber');
      
      return NextResponse.json({ 
        message: replyMessage,
        originalMessage: originalMessage 
      });
      
    } catch (sendError) {
      console.error('Error sending reply:', sendError);
      replyMessage.status = 'FAILED';
      replyMessage.errorMessage = sendError.message;
      await replyMessage.save();
      
      return NextResponse.json({ error: sendError.message }, { status: 500 });
    }

  } catch (error) {
    console.error('Error creating reply:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
