import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET user settings
export async function GET(request) {
  try {
    // Get user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new Error('Authentication required');

    const userId = session?.user?.id;
    if (!userId) throw new Error('User ID not found');

    // Fetch user settings from database
    const userSettings = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        emailPreferences: true,
        newsletterSettings: true,
        notificationSettings: true,
        securitySettings: true,
      },
    });

    if (!userSettings) throw new Error('User settings not found');

    return NextResponse.json(userSettings);
  } catch (error) {
    console.error('Settings API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch settings' },
      { status: error.message === 'Authentication required' ? 401 : 500 }
    );
  }
}

// PUT user settings
export async function PUT(request) {
  try {
    const body = await request.json();
    const { emailPreferences, newsletterSettings, notificationSettings, securitySettings } = body;

    // Get user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new Error('Authentication required');

    const userId = session?.user?.id;
    if (!userId) throw new Error('User ID not found');

    // Update user settings
    const updatedSettings = await prisma.user.update({
      where: { id: userId },
      data: {
        emailPreferences: {
          upsert: {
            create: emailPreferences,
            update: emailPreferences,
          },
        },
        newsletterSettings: {
          upsert: {
            create: newsletterSettings,
            update: newsletterSettings,
          },
        },
        notificationSettings: {
          upsert: {
            create: notificationSettings,
            update: notificationSettings,
          },
        },
        securitySettings: {
          upsert: {
            create: securitySettings,
            update: securitySettings,
          },
        },
      },
      include: {
        emailPreferences: true,
        newsletterSettings: true,
        notificationSettings: true,
        securitySettings: true,
      },
    });

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Settings API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update settings' },
      { status: error.message === 'Authentication required' ? 401 : 500 }
    );
  }
} 