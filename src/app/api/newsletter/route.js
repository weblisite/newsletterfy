import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import { generateNewsletterSender, getNewsletterSenderByType } from '@/lib/email-sender';

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Save newsletter draft
export async function POST(request) {
  try {
    const data = await request.json();
    
    // This is where you would save the newsletter draft to your database
    // Example database save logic:
    // const newsletter = await prisma.newsletter.create({
    //   data: {
    //     subject: data.subject,
    //     preheader: data.preheader,
    //     content: data.content,
    //     segment: data.segment,
    //     userId: data.userId,
    //     status: 'draft',
    //   },
    // });

    return NextResponse.json({ 
      success: true, 
      message: 'Draft saved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving newsletter:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save draft' },
      { status: 500 }
    );
  }
}

// Send test email
export async function PUT(request) {
  try {
    const data = await request.json();
    const { testEmail, newsletter, user } = data;

    if (!testEmail || !newsletter) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate newsletter-specific sender for test emails
    const sender = getNewsletterSenderByType(newsletter, user, 'test');

    const msg = {
      to: testEmail,
      from: {
        email: sender.email,
        name: sender.name,
      },
      replyTo: sender.replyTo,
      subject: `[TEST] ${newsletter.subject}`,
      html: newsletter.content,
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true },
        subscriptionTracking: { enable: true },
      },
      asm: {
        groupId: parseInt(process.env.SENDGRID_UNSUBSCRIBE_GROUP_ID || '1'),
        groupsToDisplay: [parseInt(process.env.SENDGRID_UNSUBSCRIBE_GROUP_ID || '1')],
      },
      customArgs: {
        email_type: 'test',
        newsletter_id: newsletter.id || 'draft',
        newsletter_name: newsletter.name || newsletter.title || 'Newsletter',
        sender_email: sender.email
      },
    };

    await sgMail.send(msg);

    return NextResponse.json({ 
      success: true, 
      message: 'Test email sent successfully',
      senderEmail: sender.email 
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send test email', error: error.message },
      { status: 500 }
    );
  }
}

// Schedule newsletter
export async function PATCH(request) {
  try {
    const data = await request.json();
    
    if (!data.subject || !data.content) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Example of scheduling with SendGrid:
    const scheduledTime = new Date(`${data.scheduledDate}T${data.scheduledTime}`);
    
    // Get subscriber emails based on segment (this would come from your database)
    const subscribers = await getSubscribersBySegment(data.segment);
    
    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No subscribers found for the selected segment' },
        { status: 400 }
      );
    }

    // Generate newsletter-specific sender
    const sender = generateNewsletterSender(data, data.user);
    
    // Create personalized emails for each subscriber
    const personalizations = subscribers.map(subscriber => ({
      to: subscriber.email,
      subject: data.subject,
      customArgs: {
        subscriber_id: subscriber.id,
        newsletter_id: data.id || 'new',
        segment: data.segment,
        newsletter_name: data.name || data.title || 'Newsletter',
        sender_email: sender.email
      },
    }));

    const msg = {
      personalizations,
      from: {
        email: sender.email,
        name: sender.name,
      },
      replyTo: sender.replyTo,
      html: data.content,
      send_at: Math.floor(scheduledTime.getTime() / 1000),
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true },
        subscriptionTracking: { enable: true },
      },
      asm: {
        groupId: parseInt(process.env.SENDGRID_UNSUBSCRIBE_GROUP_ID || '1'),
        groupsToDisplay: [parseInt(process.env.SENDGRID_UNSUBSCRIBE_GROUP_ID || '1')],
      },
    };

    // Save to database first
    // const newsletter = await prisma.newsletter.create({
    //   data: {
    //     subject: data.subject,
    //     preheader: data.preheader,
    //     content: data.content,
    //     segment: data.segment,
    //     scheduledDate: data.scheduledDate,
    //     scheduledTime: data.scheduledTime,
    //     userId: data.userId,
    //     status: 'scheduled',
    //   },
    // });

    // Schedule the email
    await sgMail.send(msg);

    return NextResponse.json({ 
      success: true, 
      message: 'Newsletter scheduled successfully',
      senderEmail: sender.email
    });
  } catch (error) {
    console.error('Error scheduling newsletter:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to schedule newsletter', error: error.message },
      { status: 500 }
    );
  }
}

// Helper function to get subscribers by segment
async function getSubscribersBySegment(segment) {
  // This is a placeholder - replace with your actual database query
  // Example implementation:
  try {
    // const subscribers = await prisma.subscriber.findMany({
    //   where: {
    //     status: 'active',
    //     ...(segment !== 'all' && { segment: segment })
    //   },
    //   select: {
    //     id: true,
    //     email: true,
    //     name: true,
    //   }
    // });
    // return subscribers;

    // For now, return mock data
    return [
      { id: 1, email: 'test@example.com', name: 'Test User' }
    ];
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    return [];
  }
} 