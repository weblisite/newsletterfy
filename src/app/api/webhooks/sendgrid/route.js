import { NextResponse } from 'next/server';
import { handleEmailWebhook } from '@/lib/email';
import crypto from 'crypto';

export async function POST(req) {
  try {
    // Verify SendGrid webhook signature
    const signature = req.headers.get('x-twilio-email-event-webhook-signature');
    const timestamp = req.headers.get('x-twilio-email-event-webhook-timestamp');
    const payload = await req.text();

    const verifySignature = () => {
      const timestampPayload = timestamp + payload;
      const hmac = crypto
        .createHmac('sha256', process.env.SENDGRID_WEBHOOK_SIGNING_KEY)
        .update(timestampPayload)
        .digest('base64');
      return hmac === signature;
    };

    if (!verifySignature()) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Process each event in the webhook payload
    const events = JSON.parse(payload);
    await Promise.all(
      events.map(event => handleEmailWebhook(event))
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing SendGrid webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

async function handleBounce(event) {
  // Update subscriber status and record bounce
  // await prisma.subscriber.update({
  //   where: { email: event.email },
  //   data: {
  //     status: 'bounced',
  //     lastBounceDate: new Date(),
  //     bounceReason: event.reason,
  //   },
  // });
  
  // Log bounce event
  // await prisma.emailEvent.create({
  //   data: {
  //     type: 'bounce',
  //     email: event.email,
  //     details: event,
  //     timestamp: new Date(event.timestamp * 1000),
  //   },
  // });
}

async function handleSpamReport(event) {
  // Update subscriber status and record spam report
  // await prisma.subscriber.update({
  //   where: { email: event.email },
  //   data: {
  //     status: 'spam_reported',
  //     lastSpamReportDate: new Date(),
  //   },
  // });
  
  // Log spam report event
  // await prisma.emailEvent.create({
  //   data: {
  //     type: 'spam_report',
  //     email: event.email,
  //     details: event,
  //     timestamp: new Date(event.timestamp * 1000),
  //   },
  // });
}

async function handleUnsubscribe(event) {
  // Update subscriber status
  // await prisma.subscriber.update({
  //   where: { email: event.email },
  //   data: {
  //     status: 'unsubscribed',
  //     unsubscribeDate: new Date(),
  //   },
  // });
  
  // Log unsubscribe event
  // await prisma.emailEvent.create({
  //   data: {
  //     type: 'unsubscribe',
  //     email: event.email,
  //     details: event,
  //     timestamp: new Date(event.timestamp * 1000),
  //   },
  // });
}

async function handleClick(event) {
  // Record click event
  // await prisma.emailEvent.create({
  //   data: {
  //     type: 'click',
  //     email: event.email,
  //     details: {
  //       url: event.url,
  //       ...event,
  //     },
  //     timestamp: new Date(event.timestamp * 1000),
  //   },
  // });
}

async function handleOpen(event) {
  // Record open event
  // await prisma.emailEvent.create({
  //   data: {
  //     type: 'open',
  //     email: event.email,
  //     details: event,
  //     timestamp: new Date(event.timestamp * 1000),
  //   },
  // });
} 