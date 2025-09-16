import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
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

// GET /api/debug/credentials - Check what WhatsApp Business Accounts are accessible
export async function GET(request) {
  try {
    await dbConnect();
    
    const decoded = await verifyToken(request);
    const user = await User.findById(decoded.userId);
    
    if (!user?.whatsappConfig?.accessToken) {
      return NextResponse.json({ error: 'No access token configured' }, { status: 400 });
    }

    const results = {
      accessToken: {
        provided: !!user.whatsappConfig.accessToken,
        preview: user.whatsappConfig.accessToken ? 
          `${user.whatsappConfig.accessToken.substring(0, 20)}...` : null
      },
      tests: {}
    };

    // Test 1: Get user's Business Accounts
    try {
      const response = await fetch(`https://graph.facebook.com/v19.0/me/businesses?access_token=${user.whatsappConfig.accessToken}`);
      const data = await response.json();
      
      results.tests.businessAccounts = {
        status: response.ok ? 'success' : 'error',
        statusCode: response.status,
        data: data
      };
    } catch (error) {
      results.tests.businessAccounts = {
        status: 'error',
        error: error.message
      };
    }

    // Test 2: Get WhatsApp Business Accounts (if we have a business account ID)
    if (user.whatsappConfig.businessAccountId) {
      try {
        const response = await fetch(`https://graph.facebook.com/v19.0/${user.whatsappConfig.businessAccountId}?access_token=${user.whatsappConfig.accessToken}`);
        const data = await response.json();
        
        results.tests.currentBusinessAccount = {
          status: response.ok ? 'success' : 'error',
          statusCode: response.status,
          providedId: user.whatsappConfig.businessAccountId,
          data: data
        };
      } catch (error) {
        results.tests.currentBusinessAccount = {
          status: 'error',
          error: error.message
        };
      }

      // Test 3: Get WhatsApp Business Account phone numbers
      try {
        const response = await fetch(`https://graph.facebook.com/v19.0/${user.whatsappConfig.businessAccountId}/phone_numbers?access_token=${user.whatsappConfig.accessToken}`);
        const data = await response.json();
        
        results.tests.phoneNumbers = {
          status: response.ok ? 'success' : 'error',
          statusCode: response.status,
          data: data
        };
      } catch (error) {
        results.tests.phoneNumbers = {
          status: 'error',
          error: error.message
        };
      }
    }

    // Test 4: Check if current phone number ID is valid
    if (user.whatsappConfig.phoneNumberId) {
      try {
        const response = await fetch(`https://graph.facebook.com/v19.0/${user.whatsappConfig.phoneNumberId}?access_token=${user.whatsappConfig.accessToken}`);
        const data = await response.json();
        
        results.tests.currentPhoneNumber = {
          status: response.ok ? 'success' : 'error',
          statusCode: response.status,
          providedId: user.whatsappConfig.phoneNumberId,
          data: data
        };
      } catch (error) {
        results.tests.currentPhoneNumber = {
          status: 'error',
          error: error.message
        };
      }
    }

    // Test 5: Get available WhatsApp Business Accounts from all businesses
    try {
      const response = await fetch(`https://graph.facebook.com/v19.0/me?fields=businesses{whatsapp_business_accounts{id,name,business_verification_status,phone_numbers{id,display_phone_number,verified_name,quality_rating}}}&access_token=${user.whatsappConfig.accessToken}`);
      const data = await response.json();
      
      results.tests.allWhatsAppAccounts = {
        status: response.ok ? 'success' : 'error',
        statusCode: response.status,
        data: data
      };
    } catch (error) {
      results.tests.allWhatsAppAccounts = {
        status: 'error',
        error: error.message
      };
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Credentials debug error:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
