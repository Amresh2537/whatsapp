import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Message from '@/models/Message';
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

// GET /api/debug/whatsapp - Debug WhatsApp API configuration and recent messages
export async function GET(request) {
  try {
    await dbConnect();
    
    const decoded = await verifyToken(request);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const debugInfo = {
      user: {
        id: user._id,
        email: user.email,
        hasWhatsAppConfig: !!user.whatsappConfig,
      },
      whatsappConfig: {
        hasBusinessAccountId: !!user.whatsappConfig?.businessAccountId,
        hasAccessToken: !!user.whatsappConfig?.accessToken,
        hasPhoneNumberId: !!user.whatsappConfig?.phoneNumberId,
        businessAccountId: user.whatsappConfig?.businessAccountId ? 
          `${user.whatsappConfig.businessAccountId.substring(0, 5)}...` : null,
        phoneNumberId: user.whatsappConfig?.phoneNumberId ? 
          `${user.whatsappConfig.phoneNumberId.substring(0, 5)}...` : null,
      },
      recentMessages: [],
      apiTest: null,
      error: null
    };

    // Get recent messages
    try {
      const messages = await Message.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('phoneNumber status errorMessage whatsappMessageId sentDate createdAt type content');
      
      debugInfo.recentMessages = messages;
    } catch (msgError) {
      debugInfo.error = `Error fetching messages: ${msgError.message}`;
    }

    // Test WhatsApp API connection
    if (user.whatsappConfig?.businessAccountId && user.whatsappConfig?.accessToken) {
      try {
        const whatsappAPI = createWhatsAppAPI(user.whatsappConfig);
        
        // Test by fetching business profile
        const response = await fetch(`https://graph.facebook.com/v19.0/${user.whatsappConfig.businessAccountId}?access_token=${user.whatsappConfig.accessToken}`);
        const profileData = await response.json();
        
        if (response.ok) {
          debugInfo.apiTest = {
            status: 'success',
            businessProfile: {
              id: profileData.id,
              name: profileData.name || 'N/A'
            }
          };
        } else {
          debugInfo.apiTest = {
            status: 'error',
            error: profileData.error || 'Unknown API error',
            response: profileData
          };
        }
      } catch (apiError) {
        debugInfo.apiTest = {
          status: 'error',
          error: apiError.message
        };
      }
    }

    return NextResponse.json(debugInfo);
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// POST /api/debug/whatsapp - Test sending a message with detailed logging
export async function POST(request) {
  try {
    await dbConnect();
    
    const decoded = await verifyToken(request);
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.whatsappConfig) {
      return NextResponse.json({ error: 'WhatsApp configuration not found' }, { status: 400 });
    }

    const { phoneNumber, testMessage } = await request.json();
    
    if (!phoneNumber || !testMessage) {
      return NextResponse.json({ error: 'Phone number and test message are required' }, { status: 400 });
    }

    const debugLog = {
      step: 'initialization',
      phoneNumber: phoneNumber,
      normalizedPhone: null,
      apiCall: null,
      response: null,
      error: null,
      whatsappError: null
    };

    try {
      // Create WhatsApp API instance
      const whatsappAPI = createWhatsAppAPI(user.whatsappConfig);
      
      // Normalize phone number
      debugLog.normalizedPhone = whatsappAPI.normalizePhoneNumber(phoneNumber);
      debugLog.step = 'phone_normalized';
      
      // Prepare API call details
      const apiUrl = `https://graph.facebook.com/v19.0/${user.whatsappConfig.phoneNumberId}/messages`;
      const payload = {
        messaging_product: "whatsapp",
        to: debugLog.normalizedPhone,
        type: "text",
        text: { body: testMessage }
      };
      
      debugLog.apiCall = {
        url: apiUrl,
        payload: payload,
        headers: {
          'Authorization': `Bearer ${user.whatsappConfig.accessToken.substring(0, 10)}...`,
          'Content-Type': 'application/json'
        }
      };
      debugLog.step = 'api_call_prepared';
      
      // Make the actual API call
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.whatsappConfig.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const responseData = await response.json();
      debugLog.response = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: responseData
      };
      
      if (response.ok) {
        debugLog.step = 'api_call_success';
        
        // Find or create contact for this phone number
        const Contact = (await import('@/models/Contact')).default;
        let contact = await Contact.findOne({ 
          userId: user._id, 
          normalizedPhoneNumber: debugLog.normalizedPhone 
        });
        
        if (!contact) {
          contact = new Contact({
            userId: user._id,
            phoneNumber: phoneNumber,
            normalizedPhoneNumber: debugLog.normalizedPhone,
            firstName: 'Test Contact',
          });
          await contact.save();
          debugLog.contactCreated = contact._id;
        } else {
          debugLog.contactFound = contact._id;
        }
        
        // Create message record
        const message = new Message({
          userId: user._id,
          contactId: contact._id, // Now we have a valid contactId
          phoneNumber: phoneNumber,
          normalizedPhoneNumber: debugLog.normalizedPhone,
          direction: 'outbound',
          type: 'text',
          status: 'SENT',
          content: { text: testMessage },
          whatsappMessageId: responseData.messages?.[0]?.id,
          sentDate: new Date()
        });
        
        await message.save();
        debugLog.messageCreated = message._id;
        
      } else {
        debugLog.step = 'api_call_failed';
        debugLog.whatsappError = responseData;
      }
      
    } catch (error) {
      debugLog.error = error.message;
      debugLog.step = 'error_occurred';
    }

    return NextResponse.json({
      success: !debugLog.error && !debugLog.whatsappError,
      debug: debugLog
    });
    
  } catch (error) {
    console.error('Debug send API error:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
