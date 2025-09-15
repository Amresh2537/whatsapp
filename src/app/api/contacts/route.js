import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Contact from '@/models/Contact';
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

// GET /api/contacts - List contacts for user
export async function GET(request) {
  try {
    await dbConnect();
    
    const decoded = await verifyToken(request);
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const tags = searchParams.get('tags') ? searchParams.get('tags').split(',') : [];
    
    // Build query
    const query = { userId: decoded.userId };
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    
    if (tags.length > 0) {
      query.tags = { $in: tags };
    }
    
    // Get contacts with pagination
    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    
    const total = await Contact.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    
    return NextResponse.json({
      contacts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/contacts - Create a new contact
export async function POST(request) {
  try {
    await dbConnect();
    
    const decoded = await verifyToken(request);
    const contactData = await request.json();
    
    // Validate required fields
    if (!contactData.phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Check if contact already exists
    const normalizedPhone = contactData.phoneNumber.replace(/\D/g, '');
    const existingContact = await Contact.findOne({ 
      userId: decoded.userId, 
      normalizedPhoneNumber: normalizedPhone 
    });
    
    if (existingContact) {
      return NextResponse.json({ error: 'Contact with this phone number already exists' }, { status: 400 });
    }

    // Create contact
    const contact = new Contact({
      userId: decoded.userId,
      phoneNumber: contactData.phoneNumber,
      normalizedPhoneNumber: normalizedPhone,
      firstName: contactData.firstName || '',
      lastName: contactData.lastName || '',
      email: contactData.email || '',
      tags: contactData.tags || [],
      customFields: contactData.customFields || [],
    });

    await contact.save();
    
    return NextResponse.json({ contact }, { status: 201 });
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
