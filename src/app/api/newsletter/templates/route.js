import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET all templates
export async function GET(request) {
  try {
    // Get user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new Error('Authentication required');

    const userId = session?.user?.id;
    if (!userId) throw new Error('User ID not found');

    // Fetch templates
    const templates = await prisma.newsletterTemplate.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Template API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch templates' },
      { status: error.message === 'Authentication required' ? 401 : 500 }
    );
  }
}

// POST new template
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, description, content, category, isDefault } = body;

    // Get user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new Error('Authentication required');

    const userId = session?.user?.id;
    if (!userId) throw new Error('User ID not found');

    // If this template is set as default, unset any existing default
    if (isDefault) {
      await prisma.newsletterTemplate.updateMany({
        where: {
          userId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Create template
    const template = await prisma.newsletterTemplate.create({
      data: {
        userId,
        name,
        description,
        content,
        category,
        isDefault,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('Template API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create template' },
      { status: error.message === 'Authentication required' ? 401 : 500 }
    );
  }
}

// PUT update template
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, name, description, content, category, isDefault } = body;

    // Get user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new Error('Authentication required');

    const userId = session?.user?.id;
    if (!userId) throw new Error('User ID not found');

    // Verify template ownership
    const existingTemplate = await prisma.newsletterTemplate.findUnique({
      where: { id },
    });

    if (!existingTemplate || existingTemplate.userId !== userId) {
      throw new Error('Template not found or access denied');
    }

    // If this template is set as default, unset any existing default
    if (isDefault) {
      await prisma.newsletterTemplate.updateMany({
        where: {
          userId,
          isDefault: true,
          NOT: {
            id,
          },
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Update template
    const template = await prisma.newsletterTemplate.update({
      where: { id },
      data: {
        name,
        description,
        content,
        category,
        isDefault,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('Template API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update template' },
      { status: error.message === 'Authentication required' ? 401 : 500 }
    );
  }
}

// DELETE template
export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    // Get user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new Error('Authentication required');

    const userId = session?.user?.id;
    if (!userId) throw new Error('User ID not found');

    // Verify template ownership
    const existingTemplate = await prisma.newsletterTemplate.findUnique({
      where: { id },
    });

    if (!existingTemplate || existingTemplate.userId !== userId) {
      throw new Error('Template not found or access denied');
    }

    // Delete template
    await prisma.newsletterTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Template API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete template' },
      { status: error.message === 'Authentication required' ? 401 : 500 }
    );
  }
} 