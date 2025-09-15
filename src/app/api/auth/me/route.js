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

// GET /api/auth/me - Get current user info
export async function GET(request) {
  try {
    await dbConnect();
    
    const decoded = await verifyToken(request);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      role: user.role,
      subscription: user.subscription,
      whatsappConfigured: !!(user.whatsappConfig && user.whatsappConfig.accessToken),
      isEmailVerified: user.isEmailVerified,
      lastLogin: user.lastLogin,
    };

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

// PUT /api/auth/me - Update user profile
export async function PUT(request) {
  try {
    await dbConnect();
    
    const decoded = await verifyToken(request);
    const updateData = await request.json();
    
    // Remove fields that shouldn't be updated through this endpoint
    const allowedFields = ['firstName', 'lastName', 'email'];
    const filteredData = {};
    
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });
    
    if (filteredData.email) {
      filteredData.email = filteredData.email.toLowerCase();
    }

    const user = await User.findByIdAndUpdate(
      decoded.userId,
      filteredData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      role: user.role,
      subscription: user.subscription,
      whatsappConfigured: !!(user.whatsappConfig && user.whatsappConfig.accessToken),
      isEmailVerified: user.isEmailVerified,
      lastLogin: user.lastLogin,
    };

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error('Update user error:', error);
    
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
