import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Campaign from '@/models/Campaign';
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

// GET /api/campaigns/[id] - Get specific campaign
export async function GET(request, { params }) {
  try {
    await dbConnect();
    
    const decoded = await verifyToken(request);
    const resolvedParams = await params;
    const campaignId = resolvedParams.id;
    
    // Find the campaign and ensure it belongs to the user
    const campaign = await Campaign.findOne({
      _id: campaignId,
      userId: decoded.userId
    })
      .populate('templateId', 'name status description')
      .populate('contactIds', 'firstName lastName phoneNumber');
    
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    
    return NextResponse.json({ campaign });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/campaigns/[id] - Update campaign
export async function PUT(request, { params }) {
  try {
    await dbConnect();
    
    const decoded = await verifyToken(request);
    const resolvedParams = await params;
    const campaignId = resolvedParams.id;
    const updateData = await request.json();
    
    // Find the campaign and ensure it belongs to the user
    const campaign = await Campaign.findOne({
      _id: campaignId,
      userId: decoded.userId
    });
    
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    
    // Update allowed fields
    const allowedUpdates = ['name', 'description', 'status', 'scheduledDate', 'headerValue', 'bodyParameters', 'settings'];
    const updates = {};
    
    for (const field of allowedUpdates) {
      if (updateData[field] !== undefined) {
        updates[field] = updateData[field];
      }
    }
    
    const updatedCampaign = await Campaign.findByIdAndUpdate(
      campaignId,
      { $set: updates },
      { new: true }
    )
      .populate('templateId', 'name status description')
      .populate('contactIds', 'firstName lastName phoneNumber');
    
    return NextResponse.json({ campaign: updatedCampaign });
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/campaigns/[id] - Delete campaign
export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    
    const decoded = await verifyToken(request);
    const resolvedParams = await params;
    const campaignId = resolvedParams.id;
    
    // Find and delete the campaign, ensuring it belongs to the user
    const campaign = await Campaign.findOneAndDelete({
      _id: campaignId,
      userId: decoded.userId
    });
    
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    
    // Optionally, you might want to update related messages to mark the campaign as deleted
    
    return NextResponse.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
