import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Template from '@/models/Template';
import User from '@/models/User';
import { createWhatsAppAPI } from '@/lib/whatsapp';
import jwt from 'jsonwebtoken';

// Helper function to verify JWT token
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

// GET /api/templates - Fetch templates from WhatsApp API and sync with database
export async function GET(request) {
  try {
    await dbConnect();
    
    const decoded = await verifyToken(request);
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.whatsappConfig) {
      return NextResponse.json({ error: 'WhatsApp configuration not found' }, { status: 400 });
    }

    // Create WhatsApp API instance
    const whatsappAPI = createWhatsAppAPI(user.whatsappConfig);
    
    // Fetch templates from WhatsApp API
    const whatsappTemplates = await whatsappAPI.fetchAllTemplates();
    
    // Sync with database
    const syncedTemplates = [];
    
    for (const whatsappTemplate of whatsappTemplates) {
      try {
        // Analyze template parameters
        const analysis = whatsappAPI.analyzeTemplateParameters(whatsappTemplate);
        
        // Update or create template in database
        const template = await Template.findOneAndUpdate(
          { userId: user._id, name: whatsappTemplate.name },
          {
            userId: user._id,
            name: whatsappTemplate.name,
            status: whatsappTemplate.status,
            language: whatsappTemplate.language || 'en_US',
            components: whatsappTemplate.components,
            headerType: analysis.headerType,
            headerRequiresParam: analysis.headerRequiresParam,
            bodyParameters: analysis.bodyParameters,
            buttonParameters: analysis.buttonParameters,
            description: analysis.description,
          },
          { upsert: true, new: true }
        );
        
        syncedTemplates.push(template);
      } catch (syncError) {
        console.error(`Error syncing template ${whatsappTemplate.name}:`, syncError);
      }
    }
    
    return NextResponse.json({ templates: syncedTemplates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/templates - Create a new template
export async function POST(request) {
  try {
    await dbConnect();
    
    const decoded = await verifyToken(request);
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.whatsappConfig) {
      return NextResponse.json({ error: 'WhatsApp configuration not found' }, { status: 400 });
    }

    const templateData = await request.json();
    
    // Validate required fields
    if (!templateData.name || !templateData.category || !templateData.components) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create WhatsApp API instance
    const whatsappAPI = createWhatsAppAPI(user.whatsappConfig);
    
    // Create template via WhatsApp API
    const whatsappResponse = await whatsappAPI.createTemplate({
      name: templateData.name,
      category: templateData.category,
      language: templateData.language || 'en_US',
      components: templateData.components
    });
    
    // Save template in database
    const template = new Template({
      userId: user._id,
      name: templateData.name,
      status: 'PENDING',
      language: templateData.language || 'en_US',
      category: templateData.category,
      components: templateData.components,
      whatsappTemplateId: whatsappResponse.id,
    });
    
    await template.save();
    
    return NextResponse.json({ template, whatsappResponse });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
