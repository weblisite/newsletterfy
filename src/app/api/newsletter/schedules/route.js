import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET all schedules
export async function GET(request) {
  try {
    // Get user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new Error('Authentication required');

    const userId = session?.user?.id;
    if (!userId) throw new Error('User ID not found');

    // Fetch schedules
    const schedules = await prisma.newsletterSchedule.findMany({
      where: {
        userId,
      },
      orderBy: {
        sendDate: 'asc',
      },
      include: {
        newsletter: true,
      },
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error('Schedule API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch schedules' },
      { status: error.message === 'Authentication required' ? 401 : 500 }
    );
  }
}

// POST new schedule
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      newsletterId,
      sendDate,
      sendTime,
      timezone,
      segment,
      frequency,
      repeatInterval,
      repeatUnit,
    } = body;

    // Get user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new Error('Authentication required');

    const userId = session?.user?.id;
    if (!userId) throw new Error('User ID not found');

    // Verify newsletter ownership
    const newsletter = await prisma.newsletter.findUnique({
      where: { id: newsletterId },
    });

    if (!newsletter || newsletter.userId !== userId) {
      throw new Error('Newsletter not found or access denied');
    }

    // Create schedule
    const schedule = await prisma.newsletterSchedule.create({
      data: {
        userId,
        newsletterId,
        sendDate,
        sendTime,
        timezone,
        segment,
        frequency,
        repeatInterval: frequency === 'recurring' ? repeatInterval : null,
        repeatUnit: frequency === 'recurring' ? repeatUnit : null,
      },
    });

    return NextResponse.json(schedule);
  } catch (error) {
    console.error('Schedule API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create schedule' },
      { status: error.message === 'Authentication required' ? 401 : 500 }
    );
  }
}

// PUT update schedule
export async function PUT(request) {
  try {
    const body = await request.json();
    const {
      id,
      newsletterId,
      sendDate,
      sendTime,
      timezone,
      segment,
      frequency,
      repeatInterval,
      repeatUnit,
    } = body;

    // Get user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new Error('Authentication required');

    const userId = session?.user?.id;
    if (!userId) throw new Error('User ID not found');

    // Verify schedule ownership
    const existingSchedule = await prisma.newsletterSchedule.findUnique({
      where: { id },
    });

    if (!existingSchedule || existingSchedule.userId !== userId) {
      throw new Error('Schedule not found or access denied');
    }

    // Verify newsletter ownership
    const newsletter = await prisma.newsletter.findUnique({
      where: { id: newsletterId },
    });

    if (!newsletter || newsletter.userId !== userId) {
      throw new Error('Newsletter not found or access denied');
    }

    // Update schedule
    const schedule = await prisma.newsletterSchedule.update({
      where: { id },
      data: {
        newsletterId,
        sendDate,
        sendTime,
        timezone,
        segment,
        frequency,
        repeatInterval: frequency === 'recurring' ? repeatInterval : null,
        repeatUnit: frequency === 'recurring' ? repeatUnit : null,
      },
    });

    return NextResponse.json(schedule);
  } catch (error) {
    console.error('Schedule API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update schedule' },
      { status: error.message === 'Authentication required' ? 401 : 500 }
    );
  }
}

// DELETE schedule
export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    // Get user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new Error('Authentication required');

    const userId = session?.user?.id;
    if (!userId) throw new Error('User ID not found');

    // Verify schedule ownership
    const existingSchedule = await prisma.newsletterSchedule.findUnique({
      where: { id },
    });

    if (!existingSchedule || existingSchedule.userId !== userId) {
      throw new Error('Schedule not found or access denied');
    }

    // Delete schedule
    await prisma.newsletterSchedule.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Schedule API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete schedule' },
      { status: error.message === 'Authentication required' ? 401 : 500 }
    );
  }
} 