import sgMail from '@sendgrid/mail';
import sgClient from '@sendgrid/client';
import { generateNewsletterSender, getNewsletterSenderByType } from './email-sender.js';
import emailProviderManager from './email-provider-manager.js';

// Initialize SendGrid with API key (kept for backward compatibility)
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

    // Generate HTML content from template data for providers that don't support SendGrid templates
    const templateData = {
      subject: template.subject,
      newsletter_name: newsletter?.name || newsletter?.title,
      sender_name: from?.name || newsletter?.senderName || 'Newsletterfy',
      ...dynamicTemplateData
    };

    const html = generateTemplateHTML(template, templateData, templateCategory, templateName);

    // Send using provider manager
    const result = await emailProviderManager.sendEmail({
      to,
      subject: template.subject,
      html,
      from,
      newsletter,
      user,
      attachments,
      emailType: 'transactional',
      templateId: template.templateId, // For SendGrid compatibility
      dynamicTemplateData: templateData // For SendGrid compatibility
    });

    return result;
  } catch (error) {
    console.error('Failed to send transactional email:', error);
    return { success: false, error: error.message || error };
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
    // Send using provider manager
    const result = await emailProviderManager.sendEmail({
      to,
      subject,
      html,
      text,
      from,
      newsletter,
      user,
      attachments,
      emailType: 'simple'
    });

    return result;
  } catch (error) {
    console.error('Failed to send simple email:', error);
    return { success: false, error: error.message || error };
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

/**
 * Generate HTML from template data for providers that don't support SendGrid templates
 * This creates a basic HTML email from template data
 */
function generateTemplateHTML(template, templateData, templateCategory, templateName) {
  // Create a basic HTML template
  let html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #06b6d4; margin-bottom: 10px;">📧 Newsletterfy</h1>
        <hr style="border: none; border-top: 2px solid #06b6d4; width: 100px; margin: 0 auto;">
      </div>
      
      <div style="background-color: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
        <h2 style="color: #1f2937; margin-bottom: 20px;">${template.subject}</h2>
  `;

  // Add template-specific content based on category and template name
  if (templateCategory === 'payout') {
    html += generatePayoutTemplateContent(templateName, templateData);
  } else if (templateCategory === 'auth') {
    html += generateAuthTemplateContent(templateName, templateData);
  } else if (templateCategory === 'newsletter') {
    html += generateNewsletterTemplateContent(templateName, templateData);
  } else {
    // Generic template
    html += `
      <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
        Thank you for using Newsletterfy. This email was sent regarding your account activity.
      </p>
    `;
  }

  // Add footer
  html += `
      </div>
      
      <div style="text-align: center; padding: 20px; border-top: 1px solid #e5e7eb; margin-top: 30px;">
        <p style="color: #9ca3af; font-size: 14px; margin-bottom: 10px;">
          This email was sent by ${templateData.newsletter_name || 'Newsletterfy'}
        </p>
        <p style="color: #9ca3af; font-size: 12px;">
          If you have any questions, please contact our support team.
        </p>
      </div>
    </div>
  `;

  return html;
}

/**
 * Generate payout-specific template content
 */
function generatePayoutTemplateContent(templateName, data) {
  switch (templateName) {
    case 'approved':
      return `
        <p style="color: #059669; font-weight: 600; margin-bottom: 15px;">✅ Great news! Your payout request has been approved.</p>
        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
          Your payout of <strong>$${data.amount}</strong> has been approved and will be processed soon.
        </p>
        ${data.payoutId ? `<p style="color: #6b7280; font-size: 14px;">Payout ID: ${data.payoutId}</p>` : ''}
      `;
    case 'processing':
      return `
        <p style="color: #0369a1; font-weight: 600; margin-bottom: 15px;">🔄 Your payout is being processed.</p>
        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
          Your payout of <strong>$${data.amount}</strong> is currently being processed. You should receive it within 1-3 business days.
        </p>
        ${data.payoutId ? `<p style="color: #6b7280; font-size: 14px;">Payout ID: ${data.payoutId}</p>` : ''}
      `;
    case 'completed':
      return `
        <p style="color: #059669; font-weight: 600; margin-bottom: 15px;">🎉 Your payout has been sent!</p>
        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
          Your payout of <strong>$${data.amount}</strong> has been successfully sent to your account.
        </p>
        ${data.payoutId ? `<p style="color: #6b7280; font-size: 14px;">Payout ID: ${data.payoutId}</p>` : ''}
      `;
    case 'rejected':
      return `
        <p style="color: #dc2626; font-weight: 600; margin-bottom: 15px;">❌ Your payout request has been rejected.</p>
        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
          Unfortunately, your payout request for <strong>$${data.amount}</strong> has been rejected. Please contact support for more information.
        </p>
        ${data.payoutId ? `<p style="color: #6b7280; font-size: 14px;">Payout ID: ${data.payoutId}</p>` : ''}
      `;
    case 'failed':
      return `
        <p style="color: #dc2626; font-weight: 600; margin-bottom: 15px;">⚠️ Your payout failed.</p>
        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
          There was an issue processing your payout of <strong>$${data.amount}</strong>. Please contact support for assistance.
        </p>
        ${data.payoutId ? `<p style="color: #6b7280; font-size: 14px;">Payout ID: ${data.payoutId}</p>` : ''}
      `;
    default:
      return `<p style="color: #4b5563; line-height: 1.6;">Payout update: ${templateName}</p>`;
  }
}

/**
 * Generate auth-specific template content
 */
function generateAuthTemplateContent(templateName, data) {
  switch (templateName) {
    case 'welcome':
      return `
        <p style="color: #059669; font-weight: 600; margin-bottom: 15px;">🎉 Welcome to Newsletterfy!</p>
        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
          Thank you for joining our platform. You can now create and manage your newsletters with ease.
        </p>
        ${data.dashboard_url ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.dashboard_url}" style="background-color: #06b6d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Go to Dashboard
            </a>
          </div>
        ` : ''}
      `;
    case 'passwordReset':
      return `
        <p style="color: #0369a1; font-weight: 600; margin-bottom: 15px;">🔑 Password Reset Request</p>
        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
          You requested to reset your password. Click the button below to set a new password.
        </p>
        ${data.reset_url ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.reset_url}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Reset Password
            </a>
          </div>
        ` : ''}
        <p style="color: #6b7280; font-size: 14px;">If you didn't request this, please ignore this email.</p>
      `;
    case 'emailVerification':
      return `
        <p style="color: #0369a1; font-weight: 600; margin-bottom: 15px;">📧 Verify Your Email</p>
        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
          Please verify your email address to complete your account setup.
        </p>
        ${data.verification_url ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.verification_url}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Verify Email
            </a>
          </div>
        ` : ''}
      `;
    default:
      return `<p style="color: #4b5563; line-height: 1.6;">Authentication update: ${templateName}</p>`;
  }
}

/**
 * Generate newsletter-specific template content
 */
function generateNewsletterTemplateContent(templateName, data) {
  switch (templateName) {
    case 'published':
      return `
        <p style="color: #059669; font-weight: 600; margin-bottom: 15px;">📰 New Newsletter Published!</p>
        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
          Your newsletter "<strong>${data.newsletter_name}</strong>" has been successfully published.
        </p>
      `;
    case 'draft':
      return `
        <p style="color: #0369a1; font-weight: 600; margin-bottom: 15px;">📝 Newsletter Draft Saved</p>
        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
          Your newsletter draft "<strong>${data.newsletter_name}</strong>" has been saved.
        </p>
      `;
    default:
      return `<p style="color: #4b5563; line-height: 1.6;">Newsletter update: ${templateName}</p>`;
  }
} 