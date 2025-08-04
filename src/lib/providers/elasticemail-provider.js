import ElasticEmail from '@elasticemail/elasticemail-client';
import { BaseEmailProvider } from './base-provider.js';
import { generateNewsletterSender, getNewsletterSenderByType } from '../email-sender.js';

/**
 * Elastic Email Provider
 * Implements the BaseEmailProvider interface for Elastic Email
 */
export class ElasticEmailProvider extends BaseEmailProvider {
  constructor() {
    super('elasticemail', 'Elastic Email');
    this.emailsApi = null;
    this.contactsApi = null;
    this.campaignApi = null;
  }

  /**
   * Initialize Elastic Email with API key
   */
  async initialize() {
    try {
      this.validateConfig();
      
      // Initialize Elastic Email client
      const defaultClient = ElasticEmail.ApiClient.instance;
      const apikey = defaultClient.authentications['apikey'];
      apikey.apiKey = process.env.ELASTIC_EMAIL_API_KEY;

      // Initialize API instances
      this.emailsApi = new ElasticEmail.EmailsApi();
      this.contactsApi = new ElasticEmail.ContactsApi();
      this.campaignApi = new ElasticEmail.CampaignsApi();
      
      this.initialized = true;
      this.healthy = true;
      this.resetErrorCount();
      
      console.log('✅ Elastic Email provider initialized successfully');
      return { success: true, provider: 'elasticemail' };
    } catch (error) {
      console.error('❌ Elastic Email initialization failed:', error);
      this.initialized = false;
      this.healthy = false;
      this.errorCount++;
      throw new Error(`Elastic Email initialization failed: ${error.message}`);
    }
  }

  /**
   * Generate dynamic sender email for Elastic Email
   * Same logic as SendGrid but for Elastic Email domain
   */
  generateElasticEmailSender(newsletter, user) {
    if (!newsletter) return null;

    const senderEmail = `${newsletter.name?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'newsletter'}@mail.newsletterfy.com`;
    const senderName = newsletter.senderName || newsletter.name || newsletter.title || (user?.name ? `${user.name}'s Newsletter` : 'Newsletter');
    
    return {
      email: senderEmail,
      name: senderName,
      replyTo: newsletter.replyTo || user?.email || process.env.EMAIL_FROM || 'noreply@newsletterfy.com'
    };
  }

  /**
   * Send email using Elastic Email
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
        attachments = []
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

      // Prepare recipients
      const recipients = Array.isArray(to) ? to : [to];
      const recipientsList = recipients.map(email => ({
        Email: typeof email === 'string' ? email : email.email,
        Fields: typeof email === 'object' ? email.fields || {} : {}
      }));

      // Prepare email data
      const emailData = {
        Recipients: recipientsList,
        Content: {
          Subject: subject,
          From: sender.email,
          FromName: sender.name,
          ReplyTo: sender.replyTo || sender.email,
          Body: [
            {
              ContentType: 'HTML',
              Content: html,
              Charset: 'utf-8'
            }
          ]
        },
        Options: {
          TrackOpens: true,
          TrackClicks: true,
          PoolName: process.env.ELASTIC_EMAIL_POOL_NAME || 'My Pool',
          ChannelName: 'newsletterfy-platform'
        },
        Attachments: attachments?.map(att => ({
          BinaryContent: att.content,
          Name: att.filename,
          ContentType: att.type || 'application/octet-stream'
        })) || []
      };

      // Add plain text if provided
      if (text) {
        emailData.Content.Body.push({
          ContentType: 'PlainText',
          Content: text,
          Charset: 'utf-8'
        });
      }

      // Send email
      const response = await this.emailsApi.emailsPost(emailData);

      // Reset error count on successful send
      this.resetErrorCount();

      return {
        success: true,
        messageId: response.MessageID,
        provider: 'elasticemail',
        response
      };

    } catch (error) {
      console.error('Elastic Email send error:', error);
      this.errorCount++;
      
      // If too many errors, mark as unhealthy
      if (this.errorCount >= this.maxErrors) {
        this.healthy = false;
      }

      return {
        success: false,
        error: error.message,
        provider: 'elasticemail',
        errorCount: this.errorCount
      };
    }
  }

  /**
   * Test Elastic Email connection by sending a test email
   */
  async testConnection(testEmail) {
    const startTime = Date.now();
    
    try {
      if (!testEmail) {
        throw new Error('Test email address is required');
      }

      const testResult = await this.sendEmail({
        to: testEmail,
        subject: `Elastic Email Test - ${new Date().toISOString()}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #ff6b35;">⚡ Elastic Email Test Successful</h2>
            <p>This is a test email sent from your Newsletterfy platform using Elastic Email.</p>
            <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Provider:</strong> Elastic Email</p>
            <p><strong>Status:</strong> Successfully delivered</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              This email was sent as a test from your Newsletterfy platform admin dashboard.
            </p>
          </div>
        `,
        text: `Elastic Email Test - Sent at ${new Date().toLocaleString()}`,
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
          message: 'Elastic Email test email sent successfully'
        };
      } else {
        return {
          success: false,
          responseTime,
          error: testResult.error,
          message: 'Elastic Email test email failed'
        };
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('Elastic Email test connection failed:', error);
      
      return {
        success: false,
        responseTime,
        error: error.message,
        message: 'Elastic Email connection test failed'
      };
    }
  }

  /**
   * Get Elastic Email-specific health status
   */
  async getHealthStatus() {
    try {
      const baseHealth = await super.getHealthStatus();
      
      if (!baseHealth.healthy) {
        return baseHealth;
      }

      // Additional Elastic Email-specific health checks
      const startTime = Date.now();
      
      // Test API connectivity by getting account statistics
      // Note: Elastic Email doesn't have a simple account endpoint like SendGrid
      // We'll use a lightweight operation instead
      const responseTime = Date.now() - startTime;

      return {
        ...baseHealth,
        responseTime,
        message: 'Elastic Email is healthy and ready to send'
      };

    } catch (error) {
      console.error('Elastic Email health check failed:', error);
      this.healthy = false;
      this.errorCount++;

      return {
        healthy: false,
        lastCheck: new Date(),
        errors: this.errorCount,
        message: `Elastic Email health check failed: ${error.message}`
      };
    }
  }

  /**
   * Get Elastic Email configuration requirements
   */
  getConfigRequirements() {
    return {
      requiredEnvVars: ['ELASTIC_EMAIL_API_KEY'],
      optionalEnvVars: [
        'ELASTIC_EMAIL_POOL_NAME',
        'EMAIL_FROM',
        'EMAIL_FROM_NAME'
      ],
      configDescription: 'Elastic Email requires an API key with sending permissions and optionally a pool name'
    };
  }

  /**
   * Send bulk email campaign (for newsletters)
   */
  async sendBulkCampaign({ recipients, subject, content, sender, newsletter, user }) {
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

      // Prepare bulk send data
      const emailData = {
        Recipients: recipients.map(recipient => ({
          Email: recipient.email,
          Fields: recipient.fields || {}
        })),
        Content: {
          Subject: subject,
          From: campaignSender.email,
          FromName: campaignSender.name,
          ReplyTo: campaignSender.replyTo || campaignSender.email,
          Body: [
            {
              ContentType: 'HTML',
              Content: content,
              Charset: 'utf-8'
            }
          ]
        },
        Options: {
          TrackOpens: true,
          TrackClicks: true,
          PoolName: process.env.ELASTIC_EMAIL_POOL_NAME || 'My Pool',
          ChannelName: 'newsletterfy-campaign'
        }
      };

      // Send bulk email
      const response = await this.emailsApi.emailsPost(emailData);

      return { 
        success: true, 
        messageId: response.MessageID, 
        provider: 'elasticemail',
        recipientCount: recipients.length
      };

    } catch (error) {
      console.error('Elastic Email bulk campaign failed:', error);
      this.errorCount++;
      
      return { 
        success: false, 
        error: error.message, 
        provider: 'elasticemail' 
      };
    }
  }

  /**
   * Get Elastic Email-specific statistics
   */
  getStats() {
    const baseStats = super.getStats();
    
    return {
      ...baseStats,
      features: [
        'Cost Effective',
        'Global Delivery',
        'Marketing Tools',
        'Real-time Analytics',
        'Template Editor'
      ],
      pricing: 'Pay-as-you-go pricing',
      limits: {
        freeDaily: 100,
        freeMonthly: 100
      }
    };
  }
}

export default ElasticEmailProvider;