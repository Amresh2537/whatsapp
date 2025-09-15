import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
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

// GET /api/config/whatsapp - Get current WhatsApp configuration
export async function GET(request) {
  try {
    await dbConnect();
    
    const decoded = await verifyToken(request);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return configuration without sensitive tokens
    const config = user.whatsappConfig ? {
      businessAccountId: user.whatsappConfig.businessAccountId,
      phoneNumberId: user.whatsappConfig.phoneNumberId,
      isConfigured: !!(user.whatsappConfig.accessToken),
    } : {
      isConfigured: false,
    };

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error fetching WhatsApp config:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/config/whatsapp - Set WhatsApp configuration
export async function POST(request) {
  try {
    await dbConnect();
    
    const decoded = await verifyToken(request);
    const { businessAccountId, accessToken, phoneNumberId, webhookVerifyToken } = await request.json();
    
    // Validate required fields
    if (!businessAccountId || !accessToken || !phoneNumberId) {
      return NextResponse.json({ 
        error: 'Business Account ID, Access Token, and Phone Number ID are required' 
      }, { status: 400 });
    }

    // Test the configuration by making a test API call
    try {
      const whatsappAPI = createWhatsAppAPI({
        businessAccountId,
        accessToken,
        phoneNumberId,
      });
      
      // Test by fetching templates (this validates the credentials)
      await whatsappAPI.fetchAllTemplates();
      
    } catch (testError) {
      console.error('WhatsApp API test failed:', testError);
      return NextResponse.json({ 
        error: 'Invalid WhatsApp API credentials. Please check your configuration.' 
      }, { status: 400 });
    }

    // Update user configuration
    const user = await User.findByIdAndUpdate(
      decoded.userId,
      {
        whatsappConfig: {
          businessAccountId,
          accessToken,
          phoneNumberId,
          webhookVerifyToken: webhookVerifyToken || '',
        }
      },
      { new: true }
    );

    return NextResponse.json({ 
      message: 'WhatsApp configuration saved successfully',
      config: {
        businessAccountId: user.whatsappConfig.businessAccountId,
        phoneNumberId: user.whatsappConfig.phoneNumberId,
        isConfigured: true,
      }
    });
  } catch (error) {
    console.error('Error saving WhatsApp config:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/config/whatsapp - Update WhatsApp configuration
export async function PUT(request) {
  try {
    await dbConnect();
    
    const decoded = await verifyToken(request);
    const updateData = await request.json();
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update only provided fields
    const updatedConfig = { ...user.whatsappConfig };
    
    if (updateData.businessAccountId !== undefined) {
      updatedConfig.businessAccountId = updateData.businessAccountId;
    }
    if (updateData.accessToken !== undefined) {
      updatedConfig.accessToken = updateData.accessToken;
    }
    if (updateData.phoneNumberId !== undefined) {
      updatedConfig.phoneNumberId = updateData.phoneNumberId;
    }
    if (updateData.webhookVerifyToken !== undefined) {
      updatedConfig.webhookVerifyToken = updateData.webhookVerifyToken;
    }

    // Test the configuration if critical fields were updated
    if (updateData.businessAccountId || updateData.accessToken || updateData.phoneNumberId) {
      try {
        const whatsappAPI = createWhatsAppAPI(updatedConfig);
        await whatsappAPI.fetchAllTemplates();
      } catch (testError) {
        console.error('WhatsApp API test failed:', testError);
        return NextResponse.json({ 
          error: 'Invalid WhatsApp API credentials. Please check your configuration.' 
        }, { status: 400 });
      }
    }

    // Save updated configuration
    user.whatsappConfig = updatedConfig;
    await user.save();

    return NextResponse.json({ 
      message: 'WhatsApp configuration updated successfully',
      config: {
        businessAccountId: user.whatsappConfig.businessAccountId,
        phoneNumberId: user.whatsappConfig.phoneNumberId,
        isConfigured: true,
      }
    });
  } catch (error) {
    console.error('Error updating WhatsApp config:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/config/whatsapp - Remove WhatsApp configuration
export async function DELETE(request) {
  try {
    await dbConnect();
    
    const decoded = await verifyToken(request);
    
    await User.findByIdAndUpdate(
      decoded.userId,
      { $unset: { whatsappConfig: 1 } }
    );

    return NextResponse.json({ message: 'WhatsApp configuration removed successfully' });
  } catch (error) {
    console.error('Error removing WhatsApp config:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
