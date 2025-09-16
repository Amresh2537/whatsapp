import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Template from '@/models/Template';
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

// GET /api/templates/[name] - Get specific template details
export async function GET(request, { params }) {
  try {
    await dbConnect();
    
    const decoded = await verifyToken(request);
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.whatsappConfig) {
      return NextResponse.json({ error: 'WhatsApp configuration not found' }, { status: 400 });
    }

    const resolvedParams = await params;
    const templateName = resolvedParams.name;
    
    // Try to get template from database first
    let template = await Template.findOne({ userId: user._id, name: templateName });
    
    // If not in database or needs refresh, fetch from WhatsApp API
    if (!template) {
      const whatsappAPI = createWhatsAppAPI(user.whatsappConfig);
      const whatsappTemplate = await whatsappAPI.fetchTemplateDetails(templateName);
      
      if (!whatsappTemplate) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
      
      // Analyze and save template
      const analysis = whatsappAPI.analyzeTemplateParameters(whatsappTemplate);
      
      template = new Template({
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
      });
      
      await template.save();
    }
    
    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/templates/[name] - Delete a template
export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    
    const decoded = await verifyToken(request);
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.whatsappConfig) {
      return NextResponse.json({ error: 'WhatsApp configuration not found' }, { status: 400 });
    }

    const resolvedParams = await params;
    const templateName = resolvedParams.name;
    
    // Delete from WhatsApp API
    const whatsappAPI = createWhatsAppAPI(user.whatsappConfig);
    await whatsappAPI.deleteTemplate(templateName);
    
    // Delete from database
    await Template.deleteOne({ userId: user._id, name: templateName });
    
    return NextResponse.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
