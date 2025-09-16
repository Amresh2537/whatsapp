import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Message from '@/models/Message';
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

// GET /api/messages/[id] - Get specific message
export async function GET(request, { params }) {
  try {
    await dbConnect();
    
    const decoded = await verifyToken(request);
    const resolvedParams = await params;
    const messageId = resolvedParams.id;
    
    // Find the message and ensure it belongs to the user
    const message = await Message.findOne({
      _id: messageId,
      userId: decoded.userId
    })
      .populate('contactId', 'firstName lastName phoneNumber fullName')
      .populate('templateId', 'name')
      .populate('campaignId', 'name');
    
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error fetching message:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/messages/[id] - Update message (for status updates)
export async function PUT(request, { params }) {
  try {
    await dbConnect();
    
    const decoded = await verifyToken(request);
    const resolvedParams = await params;
    const messageId = resolvedParams.id;
    const updateData = await request.json();
    
    // Find the message and ensure it belongs to the user
    const message = await Message.findOne({
      _id: messageId,
      userId: decoded.userId
    });
    
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }
    
    // Update allowed fields
    const allowedUpdates = ['status', 'errorMessage', 'failureReason'];
    const updates = {};
    
    for (const field of allowedUpdates) {
      if (updateData[field] !== undefined) {
        updates[field] = updateData[field];
      }
    }
    
    // Update timestamp based on status
    if (updateData.status) {
      const now = new Date();
      switch (updateData.status.toUpperCase()) {
        case 'SENT':
          updates.sentDate = now;
          break;
        case 'DELIVERED':
          updates.deliveredDate = now;
          break;
        case 'READ':
          updates.readDate = now;
          break;
      }
    }
    
    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      { $set: updates },
      { new: true }
    )
      .populate('contactId', 'firstName lastName phoneNumber fullName')
      .populate('templateId', 'name')
      .populate('campaignId', 'name');
    
    return NextResponse.json({ message: updatedMessage });
  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/messages/[id] - Delete message
export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    
    const decoded = await verifyToken(request);
    const resolvedParams = await params;
    const messageId = resolvedParams.id;
    
    // Find and delete the message, ensuring it belongs to the user
    const message = await Message.findOneAndDelete({
      _id: messageId,
      userId: decoded.userId
    });
    
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
