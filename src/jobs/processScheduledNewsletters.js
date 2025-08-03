import { PrismaClient } from '@prisma/client';
import { format, parseISO, addDays, addWeeks, addMonths, isAfter, isBefore } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';
import sgMail from '@sendgrid/mail';
import { generateNewsletterSender } from '../lib/email-sender.js';

const prisma = new PrismaClient();

// Configure SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function processScheduledNewsletters() {
  try {
    console.log('Processing scheduled newsletters...');

    // Get all schedules that are due
    const schedules = await prisma.newsletterSchedule.findMany({
      include: {
        newsletter: true,
        user: true,
      },
    });

    for (const schedule of schedules) {
      try {
        const { sendDate, sendTime, timezone } = schedule;
        const scheduledDateTime = zonedTimeToUtc(
          `${format(sendDate, 'yyyy-MM-dd')}T${sendTime}`,
          timezone
        );

        const now = new Date();
        const isTimeToSend = isAfter(now, scheduledDateTime) && isBefore(now, addMinutes(scheduledDateTime, 5));

        if (isTimeToSend) {
          await sendNewsletter(schedule);

          if (schedule.frequency === 'recurring') {
            await updateRecurringSchedule(schedule);
          } else {
            await prisma.newsletterSchedule.delete({
              where: { id: schedule.id },
            });
          }
        }
      } catch (error) {
        console.error(`Error processing schedule ${schedule.id}:`, error);
        continue;
      }
    }

    console.log('Finished processing scheduled newsletters');
  } catch (error) {
    console.error('Error in processScheduledNewsletters:', error);
  }
}

async function sendNewsletter(schedule) {
  const { newsletter, user } = schedule;

  // Get subscribers based on segment
  const subscribers = await getSubscribers(schedule.segment, user.id);

  // Prepare email content
  const emailContent = await prepareEmailContent(newsletter, user);

  // Send emails in batches
  const batchSize = 100;
  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize);
    await sendEmailBatch(batch, emailContent, schedule);
  }

  // Update newsletter stats
  await updateNewsletterStats(newsletter.id, subscribers.length);
}

async function getSubscribers(segment, userId) {
  const where = { userId };

  switch (segment) {
    case 'active':
      where.lastEngagement = {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      };
      break;
    case 'inactive':
      where.lastEngagement = {
        lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      };
      break;
    // Add more segment conditions as needed
  }

  const subscribers = await prisma.subscriber.findMany({
    where,
    select: {
      email: true,
      name: true,
    },
  });

  return subscribers;
}

async function prepareEmailContent(newsletter, user) {
  // Generate newsletter-specific sender using the dynamic sender utility
  const sender = generateNewsletterSender(newsletter, user);

  return {
    from: sender,
    subject: newsletter.subject,
    preheader: newsletter.preheader,
    content: newsletter.content,
    replyTo: sender.replyTo
  };
}

async function sendEmailBatch(subscribers, emailContent, schedule) {
  const { from, subject, preheader, content, replyTo } = emailContent;

  try {
    // Send via SendGrid with dynamic newsletter sender
    const messages = subscribers.map((subscriber) => ({
      to: subscriber.email,
      from: {
        email: from.email,
        name: from.name,
      },
      replyTo: replyTo,
      subject,
      html: content,
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
        newsletter_id: schedule.newsletterId,
        schedule_id: schedule.id,
        newsletter_name: schedule.newsletter?.name || 'Newsletter',
        sender_email: from.email
      },
    }));

    await sgMail.send(messages);
    
    console.log(`Successfully sent ${messages.length} emails via SendGrid from ${from.email}`);
    return { success: true, count: messages.length };
  } catch (error) {
    console.error('Error sending email batch via SendGrid:', error);
    throw error;
  }
}

async function updateNewsletterStats(newsletterId, sentCount) {
  await prisma.newsletterStats.upsert({
    where: { newsletterId },
    update: {
      sentCount: {
        increment: sentCount,
      },
      lastSentAt: new Date(),
    },
    create: {
      newsletterId,
      sentCount,
      lastSentAt: new Date(),
    },
  });
}

async function updateRecurringSchedule(schedule) {
  const { sendDate, repeatInterval, repeatUnit } = schedule;
  let nextDate;

  switch (repeatUnit) {
    case 'days':
      nextDate = addDays(sendDate, repeatInterval);
      break;
    case 'weeks':
      nextDate = addWeeks(sendDate, repeatInterval);
      break;
    case 'months':
      nextDate = addMonths(sendDate, repeatInterval);
      break;
    default:
      throw new Error(`Invalid repeat unit: ${repeatUnit}`);
  }

  await prisma.newsletterSchedule.update({
    where: { id: schedule.id },
    data: { sendDate: nextDate },
  });
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
} 