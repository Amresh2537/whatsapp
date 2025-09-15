import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Message from '@/models/Message';
import Contact from '@/models/Contact';
import User from '@/models/User';

// GET /api/webhook - Webhook verification
export async function GET(request) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
      // Respond with 200 OK and challenge token from the request
      console.log('Webhook verified successfully!');
      return new NextResponse(challenge, { status: 200 });
    } else {
      // Respond with '403 Forbidden' if verify tokens do not match
      console.log('Webhook verification failed!');
      return new NextResponse('Verification failed', { status: 403 });
    }
  }

  return new NextResponse('Bad request', { status: 400 });
}

// POST /api/webhook - Handle incoming webhook events
export async function POST(request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    
    // Check if this is a WhatsApp Business API webhook event
    if (body.object !== 'whatsapp_business_account') {
      return new NextResponse('OK', { status: 200 });
    }

    // Process each entry in the webhook
    for (const entry of body.entry || []) {
      // Process webhook changes
      for (const change of entry.changes || []) {
        if (change.field === 'messages') {
          await processMessageWebhook(change.value);
        }
      }
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

async function processMessageWebhook(webhookData) {
  try {
    // Process message statuses (delivery, read, failed, etc.)
    if (webhookData.statuses) {
      await processMessageStatuses(webhookData.statuses);
    }

    // Process incoming messages
    if (webhookData.messages) {
      await processIncomingMessages(webhookData.messages, webhookData.contacts);
    }
  } catch (error) {
    console.error('Error processing message webhook:', error);
  }
}

async function processMessageStatuses(statuses) {
  for (const status of statuses) {
    try {
      const { id: messageId, status: messageStatus, timestamp, recipient_id, errors } = status;
      
      // Find the message in our database
      const message = await Message.findOne({ whatsappMessageId: messageId });
      
      if (message) {
        // Update message status
        const statusUpper = messageStatus.toUpperCase();
        message.status = statusUpper;
        
        // Update timestamp based on status
        const statusDate = new Date(parseInt(timestamp) * 1000);
        switch (statusUpper) {
          case 'SENT':
            message.sentDate = statusDate;
            break;
          case 'DELIVERED':
            message.deliveredDate = statusDate;
            break;
          case 'READ':
            message.readDate = statusDate;
            break;
          case 'FAILED':
            message.status = 'FAILED';
            if (errors && errors.length > 0) {
              message.failureReason = errors[0].title || 'Unknown error';
              message.errorMessage = errors[0].message || 'No error message provided';
            }
            break;
        }
        
        // Add webhook event to history
        message.webhookEvents.push({
          status: messageStatus,
          timestamp: statusDate,
          errorCode: errors?.[0]?.code,
          errorMessage: errors?.[0]?.message,
        });
        
        await message.save();
        console.log(`Updated message ${messageId} status to ${messageStatus}`);
      } else {
        console.log(`Message ${messageId} not found in database`);
      }
    } catch (error) {
      console.error('Error processing message status:', error);
    }
  }
}

async function processIncomingMessages(messages, contacts) {
  for (const messageData of messages) {
    try {
      const { id: messageId, from, timestamp, type, text, image, video, document, audio } = messageData;
      
      // Normalize phone number
      const normalizedPhone = from.replace(/\D/g, '');
      
      // Find the user this message belongs to (using phone number mapping)
      // Note: You might need to adjust this logic based on how you map phone numbers to users
      const user = await findUserByPhoneNumber(normalizedPhone);
      if (!user) {
        console.log(`No user found for phone number ${from}`);
        continue;
      }
      
      // Find or create contact
      let contact = await Contact.findOne({ 
        userId: user._id, 
        normalizedPhoneNumber: normalizedPhone 
      });
      
      if (!contact) {
        // Get contact info from webhook if available
        const contactInfo = contacts?.find(c => c.wa_id === from);
        
        contact = new Contact({
          userId: user._id,
          phoneNumber: from,
          normalizedPhoneNumber: normalizedPhone,
          firstName: contactInfo?.profile?.name || '',
        });
        await contact.save();
      }
      
      // Check for unsubscribe message
      if (type === 'text' && text?.body?.toLowerCase().trim() === 'unsubscribe') {
        contact.isUnsubscribed = true;
        contact.unsubscribeDate = new Date();
        await contact.save();
        console.log(`Contact ${from} unsubscribed`);
      }
      
      // Create incoming message record
      const message = new Message({
        userId: user._id,
        contactId: contact._id,
        whatsappMessageId: messageId,
        phoneNumber: from,
        normalizedPhoneNumber: normalizedPhone,
        direction: 'inbound',
        type: type,
        status: 'DELIVERED',
        content: {
          text: text?.body,
          mediaUrl: getMediaUrl(image || video || document || audio),
        },
        sentDate: new Date(parseInt(timestamp) * 1000),
        deliveredDate: new Date(parseInt(timestamp) * 1000),
      });
      
      await message.save();
      
      // Update contact statistics
      contact.lastMessageDate = new Date();
      contact.messageCount += 1;
      await contact.save();
      
      console.log(`Processed incoming message from ${from}`);
      
    } catch (error) {
      console.error('Error processing incoming message:', error);
    }
  }
}

function getMediaUrl(media) {
  if (!media) return null;
  return media.link || media.url || null;
}

async function findUserByPhoneNumber(phoneNumber) {
  // This is a simplified approach - you might need more sophisticated mapping
  // based on your specific implementation
  try {
    const user = await User.findOne({
      'whatsappConfig.phoneNumberId': { $exists: true }
    });
    return user;
  } catch (error) {
    console.error('Error finding user by phone number:', error);
    return null;
  }
}
