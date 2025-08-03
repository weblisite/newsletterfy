import sgMail from '@sendgrid/mail';
import sgClient from '@sendgrid/client';
import { generateNewsletterSender, getNewsletterSenderByType } from './email-sender.js';

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
sgClient.setApiKey(process.env.SENDGRID_API_KEY);

// Email templates for different types of notifications
const EMAIL_TEMPLATES = {
  // Payout Templates
  payout: {
    approved: {
      templateId: process.env.SENDGRID_PAYOUT_APPROVED_TEMPLATE_ID || 'd-default',
      subject: 'Your Payout Request Has Been Approved'
    },
    processing: {
      templateId: process.env.SENDGRID_PAYOUT_PROCESSING_TEMPLATE_ID || 'd-default',
      subject: 'Your Payout is Being Processed'
    },
    completed: {
      templateId: process.env.SENDGRID_PAYOUT_COMPLETED_TEMPLATE_ID || 'd-default',
      subject: 'Your Payout Has Been Sent'
    },
    rejected: {
      templateId: process.env.SENDGRID_PAYOUT_REJECTED_TEMPLATE_ID || 'd-default',
      subject: 'Your Payout Request Has Been Rejected'
    },
    failed: {
      templateId: process.env.SENDGRID_PAYOUT_FAILED_TEMPLATE_ID || 'd-default',
      subject: 'Payout Failed'
    }
  },
  // Authentication Templates
  auth: {
    welcome: {
      templateId: process.env.SENDGRID_WELCOME_TEMPLATE_ID || 'd-default',
      subject: 'Welcome to Newsletterfy'
    },
    passwordReset: {
      templateId: process.env.SENDGRID_PASSWORD_RESET_TEMPLATE_ID || 'd-default',
      subject: 'Reset Your Password'
    },
    emailVerification: {
      templateId: process.env.SENDGRID_EMAIL_VERIFICATION_TEMPLATE_ID || 'd-default',
      subject: 'Verify Your Email'
    }
  },
  // Newsletter Templates
  newsletter: {
    published: {
      templateId: process.env.SENDGRID_NEWSLETTER_PUBLISHED_TEMPLATE_ID || 'd-default',
      subject: 'New Newsletter Published'
    },
    draft: {
      templateId: process.env.SENDGRID_NEWSLETTER_DRAFT_TEMPLATE_ID || 'd-default',
      subject: 'Newsletter Draft Saved'
    }
  },
  // Subscription Templates
  subscription: {
    welcome: {
      templateId: process.env.SENDGRID_SUBSCRIPTION_WELCOME_TEMPLATE_ID || 'd-default',
      subject: 'Welcome to {newsletter_name}'
    },
    cancelled: {
      templateId: process.env.SENDGRID_SUBSCRIPTION_CANCELLED_TEMPLATE_ID || 'd-default',
      subject: 'Subscription Cancelled'
    },
    renewal: {
      templateId: process.env.SENDGRID_SUBSCRIPTION_RENEWAL_TEMPLATE_ID || 'd-default',
      subject: 'Subscription Renewal'
    }
  }
};

/**
 * Send a transactional email using SendGrid with dynamic newsletter sender
 */
export async function sendTransactionalEmail({
  to,
  templateCategory,
  templateName,
  dynamicTemplateData,
  attachments = [],
  from = null,
  newsletter = null,
  user = null
}) {
  try {
    const template = EMAIL_TEMPLATES[templateCategory]?.[templateName];
    if (!template) {
      throw new Error(`No email template found for category: ${templateCategory}, name: ${templateName}`);
    }

    // Use newsletter-specific sender if newsletter is provided
    let sender = from;
    if (newsletter && !from) {
      const emailType = templateCategory === 'newsletter' ? templateName : templateCategory;
      sender = getNewsletterSenderByType(newsletter, user, emailType);
    }

    // Fallback to default sender
    if (!sender) {
      sender = {
        email: process.env.EMAIL_FROM || 'noreply@newsletterfy.com',
        name: process.env.EMAIL_FROM_NAME || 'Newsletterfy'
      };
    }

    const msg = {
      to,
      from: sender,
      templateId: template.templateId,
      dynamicTemplateData: {
        subject: template.subject,
        newsletter_name: newsletter?.name || newsletter?.title,
        sender_name: sender.name,
        ...dynamicTemplateData
      },
      attachments,
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

    // Add reply-to if specified
    if (sender.replyTo) {
      msg.replyTo = sender.replyTo;
    }

    const response = await sgMail.send(msg);
    return { success: true, messageId: response[0]?.headers['x-message-id'] };
  } catch (error) {
    console.error('Failed to send transactional email:', error);
    return { success: false, error };
  }
}

/**
 * Send a simple HTML email with dynamic newsletter sender
 */
export async function sendSimpleEmail({
  to,
  subject,
  html,
  text = null,
  from = null,
  attachments = [],
  newsletter = null,
  user = null
}) {
  try {
    // Use newsletter-specific sender if newsletter is provided
    let sender = from;
    if (newsletter && !from) {
      sender = generateNewsletterSender(newsletter, user);
    }

    // Fallback to default sender
    if (!sender) {
      sender = {
        email: process.env.EMAIL_FROM || 'noreply@newsletterfy.com',
        name: process.env.EMAIL_FROM_NAME || 'Newsletterfy'
      };
    }

    const msg = {
      to,
      from: sender,
      subject,
      html,
      text,
      attachments,
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

    // Add reply-to if specified
    if (sender.replyTo) {
      msg.replyTo = sender.replyTo;
    }

    const response = await sgMail.send(msg);
    return { success: true, messageId: response[0]?.headers['x-message-id'] };
  } catch (error) {
    console.error('Failed to send simple email:', error);
    return { success: false, error };
  }
}

/**
 * Send a payout status email notification
 */
export async function sendPayoutStatusEmail({ email, status, amount, payoutId }) {
  return sendTransactionalEmail({
    to: email,
    templateCategory: 'payout',
    templateName: status,
    dynamicTemplateData: {
      amount: amount.toFixed(2),
      payoutId,
      date: new Date().toISOString()
    }
  });
}

/**
 * Send a bulk marketing email campaign with dynamic newsletter sender
 */
export async function sendMarketingCampaign({
  listIds,
  subject,
  content,
  sender = null,
  newsletter = null,
  user = null
}) {
  try {
    // Use newsletter-specific sender if newsletter is provided
    let campaignSender = sender;
    if (newsletter && !sender) {
      campaignSender = generateNewsletterSender(newsletter, user);
    }

    // Fallback to default sender
    if (!campaignSender) {
      campaignSender = {
        email: process.env.EMAIL_FROM || 'marketing@newsletterfy.com',
        name: process.env.EMAIL_FROM_NAME || 'Newsletterfy Marketing'
      };
    }

    // Create campaign
    const [campaignResponse] = await sgClient.request({
      method: 'POST',
      url: '/v3/marketing/campaigns',
      body: {
        name: newsletter?.name ? `${newsletter.name} - ${subject}` : subject,
        subject,
        sender_id: sender?.id || null,
        list_ids: listIds,
        email_config: {
          html_content: content,
          sender: campaignSender
        }
      }
    });

    if (!campaignResponse.id) {
      throw new Error('Failed to create campaign');
    }

    // Schedule campaign to send immediately
    await sgClient.request({
      method: 'POST',
      url: `/v3/marketing/campaigns/${campaignResponse.id}/schedule`,
      body: {
        send_at: 'now'
      }
    });

    return { success: true, campaignId: campaignResponse.id };
  } catch (error) {
    console.error('Failed to send marketing campaign:', error);
    return { success: false, error };
  }
}

/**
 * Add or update marketing contacts in SendGrid
 */
export async function updateMarketingContacts({ contacts, listIds = [] }) {
  try {
    const formattedContacts = contacts.map(contact => ({
      email: contact.email,
      first_name: contact.firstName || contact.name?.split(' ')[0] || '',
      last_name: contact.lastName || contact.name?.split(' ').slice(1).join(' ') || '',
      custom_fields: contact.customFields || {}
    }));

    const [response] = await sgClient.request({
      method: 'PUT',
      url: '/v3/marketing/contacts',
      body: {
        contacts: formattedContacts,
        list_ids: listIds
      }
    });

    return { success: true, jobId: response.job_id };
  } catch (error) {
    console.error('Failed to update marketing contacts:', error);
    return { success: false, error };
  }
}

/**
 * Send a newsletter to subscribers with dynamic sender email
 */
export async function sendNewsletter({
  newsletter,
  subscribers,
  isDraft = false,
  user = null
}) {
  try {
    // Generate newsletter-specific sender
    const sender = generateNewsletterSender(newsletter, user);
    
    // First, ensure all subscribers are in the correct list
    const listName = `Newsletter-${newsletter.id}-${isDraft ? 'Draft' : 'Published'}`;
    
    // Create or get list
    const [listResponse] = await sgClient.request({
      method: 'POST',
      url: '/v3/marketing/lists',
      body: {
        name: listName
      }
    });

    const listId = listResponse.id;

    // Update contacts
    await updateMarketingContacts({
      contacts: subscribers,
      listIds: [listId]
    });

    // Send the newsletter with dynamic sender
    return sendMarketingCampaign({
      listIds: [listId],
      subject: newsletter.subject,
      content: newsletter.content,
      sender,
      newsletter,
      user
    });
  } catch (error) {
    console.error('Failed to send newsletter:', error);
    return { success: false, error };
  }
}

/**
 * Track email events from SendGrid webhooks
 */
export async function handleEmailWebhook(event) {
  try {
    // Validate webhook signature if needed
    // Implementation depends on your webhook security setup

    const eventType = event.event;
    const timestamp = event.timestamp;
    const email = event.email;
    const messageId = event.sg_message_id;

    // Store event in database for tracking
    // This would typically use your database client (Prisma, etc.)
    console.log('Email event received:', {
      eventType,
      timestamp,
      email,
      messageId,
      metadata: event
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to handle email webhook:', error);
    return { success: false, error };
  }
}

/**
 * Get SendGrid account information and verify connection
 */
export async function verifyEmailConnection() {
  try {
    const [response] = await sgClient.request({
      method: 'GET',
      url: '/v3/user/profile'
    });

    return {
      success: true,
      data: {
        username: response.username,
        email: response.email,
        first_name: response.first_name,
        last_name: response.last_name
      }
    };
  } catch (error) {
    console.error('Failed to verify SendGrid connection:', error);
    return { success: false, error };
  }
}

/**
 * Get email sending statistics
 */
export async function getEmailStats(startDate, endDate) {
  try {
    const [response] = await sgClient.request({
      method: 'GET',
      url: '/v3/stats',
      qs: {
        start_date: startDate,
        end_date: endDate,
        aggregated_by: 'day'
      }
    });

    return { success: true, stats: response };
  } catch (error) {
    console.error('Failed to get email stats:', error);
    return { success: false, error };
  }
} 