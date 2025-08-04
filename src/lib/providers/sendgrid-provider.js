import sgMail from '@sendgrid/mail';
import sgClient from '@sendgrid/client';
import { BaseEmailProvider } from './base-provider.js';
import { generateNewsletterSender, getNewsletterSenderByType } from '../email-sender.js';

/**
 * SendGrid Email Provider
 * Implements the BaseEmailProvider interface for SendGrid
 */
export class SendGridProvider extends BaseEmailProvider {
  constructor() {
    super('sendgrid', 'SendGrid');
    this.client = null;
    this.mailClient = null;
  }

  /**
   * Initialize SendGrid with API key
   */
  async initialize() {
    try {
      this.validateConfig();
      
      // Initialize SendGrid clients
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      sgClient.setApiKey(process.env.SENDGRID_API_KEY);
      
      this.client = sgClient;
      this.mailClient = sgMail;
      this.initialized = true;
      this.healthy = true;
      this.resetErrorCount();
      
      console.log('✅ SendGrid provider initialized successfully');
      return { success: true, provider: 'sendgrid' };
    } catch (error) {
      console.error('❌ SendGrid initialization failed:', error);
      this.initialized = false;
      this.healthy = false;
      this.errorCount++;
      throw new Error(`SendGrid initialization failed: ${error.message}`);
    }
  }

  /**
   * Send email using SendGrid
   */
  async sendEmail(params) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const {
        to,
        subject,
        html,
        text = null,
        from = null,
        newsletter = null,
        user = null,
        attachments = [],
        templateId = null,
        dynamicTemplateData = null
      } = params;

      // Generate sender information
      let sender = from;
      if (newsletter && !from) {
        const emailType = params.emailType || 'newsletter';
        sender = getNewsletterSenderByType(newsletter, user, emailType);
      }

      // Fallback to default sender
      if (!sender) {
        sender = {
          email: process.env.EMAIL_FROM || 'noreply@newsletterfy.com',
          name: process.env.EMAIL_FROM_NAME || 'Newsletterfy'
        };
      }

      // Prepare message object
      const msg = {
        to: Array.isArray(to) ? to : [to],
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

      // Add dynamic template data if using template
      if (templateId && dynamicTemplateData) {
        msg.templateId = templateId;
        msg.dynamicTemplateData = {
          subject: subject,
          newsletter_name: newsletter?.name || newsletter?.title,
          sender_name: sender.name,
          ...dynamicTemplateData
        };
        // Remove html/text when using template
        delete msg.html;
        delete msg.text;
      }

      // Send email
      const response = await this.mailClient.send(msg);
      const messageId = response[0]?.headers['x-message-id'];

      // Reset error count on successful send
      this.resetErrorCount();

      return {
        success: true,
        messageId,
        provider: 'sendgrid',
        response: response[0]
      };

    } catch (error) {
      console.error('SendGrid send error:', error);
      this.errorCount++;
      
      // If too many errors, mark as unhealthy
      if (this.errorCount >= this.maxErrors) {
        this.healthy = false;
      }

      return {
        success: false,
        error: error.message,
        provider: 'sendgrid',
        errorCount: this.errorCount
      };
    }
  }

  /**
   * Test SendGrid connection by sending a test email
   */
  async testConnection(testEmail) {
    const startTime = Date.now();
    
    try {
      if (!testEmail) {
        throw new Error('Test email address is required');
      }

      const testResult = await this.sendEmail({
        to: testEmail,
        subject: `SendGrid Test Email - ${new Date().toISOString()}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1a73e8;">✅ SendGrid Test Successful</h2>
            <p>This is a test email sent from your Newsletterfy platform using SendGrid.</p>
            <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Provider:</strong> SendGrid</p>
            <p><strong>Status:</strong> Successfully delivered</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              This email was sent as a test from your Newsletterfy platform admin dashboard.
            </p>
          </div>
        `,
        text: `SendGrid Test Email - Sent at ${new Date().toLocaleString()}`,
        from: {
          email: process.env.EMAIL_FROM || 'test@mail.newsletterfy.com',
          name: 'Newsletterfy Test'
        }
      });

      const responseTime = Date.now() - startTime;

      if (testResult.success) {
        return {
          success: true,
          responseTime,
          messageId: testResult.messageId,
          message: 'SendGrid test email sent successfully'
        };
      } else {
        return {
          success: false,
          responseTime,
          error: testResult.error,
          message: 'SendGrid test email failed'
        };
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('SendGrid test connection failed:', error);
      
      return {
        success: false,
        responseTime,
        error: error.message,
        message: 'SendGrid connection test failed'
      };
    }
  }

  /**
   * Get SendGrid-specific health status
   */
  async getHealthStatus() {
    try {
      const baseHealth = await super.getHealthStatus();
      
      if (!baseHealth.healthy) {
        return baseHealth;
      }

      // Additional SendGrid-specific health checks
      const startTime = Date.now();
      
      // Test API connectivity by getting account information
      const [response] = await this.client.request({
        method: 'GET',
        url: '/v3/user/account'
      });

      const responseTime = Date.now() - startTime;

      return {
        ...baseHealth,
        responseTime,
        accountType: response?.type || 'unknown',
        reputation: response?.reputation || null,
        message: 'SendGrid is healthy and API is accessible'
      };

    } catch (error) {
      console.error('SendGrid health check failed:', error);
      this.healthy = false;
      this.errorCount++;

      return {
        healthy: false,
        lastCheck: new Date(),
        errors: this.errorCount,
        message: `SendGrid health check failed: ${error.message}`
      };
    }
  }

  /**
   * Get SendGrid configuration requirements
   */
  getConfigRequirements() {
    return {
      requiredEnvVars: ['SENDGRID_API_KEY'],
      optionalEnvVars: [
        'SENDGRID_UNSUBSCRIBE_GROUP_ID',
        'EMAIL_FROM',
        'EMAIL_FROM_NAME'
      ],
      configDescription: 'SendGrid requires an API key with sending permissions'
    };
  }

  /**
   * Send bulk email campaign (for newsletters)
   */
  async sendBulkCampaign({ listIds, subject, content, sender, newsletter, user }) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

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
      const [campaignResponse] = await this.client.request({
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
        throw new Error('Failed to create SendGrid campaign');
      }

      // Schedule campaign to send immediately
      await this.client.request({
        method: 'POST',
        url: `/v3/marketing/campaigns/${campaignResponse.id}/schedule`,
        body: {
          send_at: 'now'
        }
      });

      return { 
        success: true, 
        campaignId: campaignResponse.id, 
        provider: 'sendgrid' 
      };

    } catch (error) {
      console.error('SendGrid bulk campaign failed:', error);
      this.errorCount++;
      
      return { 
        success: false, 
        error: error.message, 
        provider: 'sendgrid' 
      };
    }
  }

  /**
   * Get SendGrid-specific statistics
   */
  getStats() {
    const baseStats = super.getStats();
    
    return {
      ...baseStats,
      features: [
        'Dynamic Templates',
        'Advanced Analytics', 
        'A/B Testing',
        'Unsubscribe Groups',
        'Marketing Campaigns'
      ],
      pricing: 'Usage-based pricing',
      limits: {
        freeDaily: 100,
        freeMonthly: 40000
      }
    };
  }
}

export default SendGridProvider;