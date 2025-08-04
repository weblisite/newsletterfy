import { NextResponse } from 'next/server';
// import { PrismaClient } from '@prisma/client'; // DISABLED - Using Supabase

// DISABLED - Prisma client disabled in favor of Supabase
// const prisma = new PrismaClient();
const prisma = null;

// Track opens
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const newsletterId = url.searchParams.get('id');
    const subscriberId = url.searchParams.get('sid');

    if (!newsletterId) {
      throw new Error('Newsletter ID is required');
    }

    // Update newsletter stats
    await prisma.newsletterStats.update({
      where: { newsletterId },
      data: {
        openCount: {
          increment: 1,
        },
      },
    });

    // Record subscriber engagement if subscriber ID is provided
    if (subscriberId) {
      await prisma.subscriberEngagement.create({
        data: {
          subscriberId,
          newsletterId,
          type: 'open',
          timestamp: new Date(),
        },
      });

      // Update subscriber's last engagement
      await prisma.subscriber.update({
        where: { id: subscriberId },
        data: {
          lastEngagement: new Date(),
        },
      });
    }

    // Return a transparent 1x1 pixel GIF
    return new NextResponse(
      Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
      {
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('Tracking Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to track open' },
      { status: 500 }
    );
  }
}

// Track clicks
export async function POST(request) {
  try {
    const body = await request.json();
    const { newsletterId, subscriberId, link } = body;

    if (!newsletterId || !link) {
      throw new Error('Newsletter ID and link are required');
    }

    // Update newsletter stats
    await prisma.newsletterStats.update({
      where: { newsletterId },
      data: {
        clickCount: {
          increment: 1,
        },
      },
    });

    // Record link click
    await prisma.linkClick.create({
      data: {
        newsletterId,
        link,
        subscriberId,
        timestamp: new Date(),
      },
    });

    // Record subscriber engagement if subscriber ID is provided
    if (subscriberId) {
      await prisma.subscriberEngagement.create({
        data: {
          subscriberId,
          newsletterId,
          type: 'click',
          timestamp: new Date(),
        },
      });

      // Update subscriber's last engagement
      await prisma.subscriber.update({
        where: { id: subscriberId },
        data: {
          lastEngagement: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Tracking Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to track click' },
      { status: 500 }
    );
  }
} 