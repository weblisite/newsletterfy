import { createClient } from '@supabase/supabase-js';
import { SendGridProvider } from './providers/sendgrid-provider.js';
import { ElasticEmailProvider } from './providers/elasticemail-provider.js';

/**
 * Email Provider Manager
 * Manages switching between email providers and handles fallback logic
 */
export class EmailProviderManager {
  constructor() {
    this.providers = {
      sendgrid: new SendGridProvider(),
      elasticemail: new ElasticEmailProvider()
    };
    
    this.activeProviderId = 'sendgrid'; // Default to SendGrid
    this.fallbackEnabled = true;
    this.isInitialized = false;
    
    // Initialize Supabase client for settings
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  /**
   * Initialize the provider manager
   */
  async initialize() {
    try {
      // Load active provider from database
      await this.loadActiveProvider();
      
      // Initialize the active provider
      await this.initializeActiveProvider();
      
      this.isInitialized = true;
      console.log(`✅ Email Provider Manager initialized with ${this.activeProviderId}`);
      return { success: true, activeProvider: this.activeProviderId };
    } catch (error) {
      console.error('❌ Email Provider Manager initialization failed:', error);
      throw error;
    }
  }

  /**
   * Load active provider setting from database
   */
  async loadActiveProvider() {
    try {
      const { data, error } = await this.supabase
        .from('email_provider_settings')
        .select('active_provider, provider_config')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.warn('No provider settings found, using default (SendGrid)');
        this.activeProviderId = 'sendgrid';
        this.fallbackEnabled = true;
        return;
      }

      this.activeProviderId = data.active_provider || 'sendgrid';
      this.fallbackEnabled = data.provider_config?.fallback_enabled !== false;
      
      console.log(`📍 Loaded active provider: ${this.activeProviderId}`);
    } catch (error) {
      console.error('Error loading active provider:', error);
      // Fallback to SendGrid on error
      this.activeProviderId = 'sendgrid';
      this.fallbackEnabled = true;
    }
  }

  /**
   * Initialize the currently active provider
   */
  async initializeActiveProvider() {
    const provider = this.providers[this.activeProviderId];
    if (!provider) {
      throw new Error(`Unknown provider: ${this.activeProviderId}`);
    }

    try {
      await provider.initialize();
      console.log(`✅ Active provider ${this.activeProviderId} initialized`);
    } catch (error) {
      console.error(`❌ Failed to initialize ${this.activeProviderId}:`, error);
      
      // If fallback is enabled and we're not already on the fallback provider
      if (this.fallbackEnabled && this.activeProviderId !== 'sendgrid') {
        console.log('🔄 Attempting fallback to SendGrid...');
        await this.performFallback();
      } else {
        throw error;
      }
    }
  }

  /**
   * Switch to a different email provider
   */
  async switchProvider(newProviderId, adminUserId = null) {
    try {
      if (!this.providers[newProviderId]) {
        throw new Error(`Unknown provider: ${newProviderId}`);
      }

      if (newProviderId === this.activeProviderId) {
        return { 
          success: true, 
          message: `Already using ${newProviderId}`,
          activeProvider: this.activeProviderId 
        };
      }

      console.log(`🔄 Switching from ${this.activeProviderId} to ${newProviderId}...`);

      // Initialize the new provider first
      const newProvider = this.providers[newProviderId];
      await newProvider.initialize();

      // Update database
      const { error } = await this.supabase
        .from('email_provider_settings')
        .insert({
          active_provider: newProviderId,
          provider_config: { 
            fallback_enabled: this.fallbackEnabled,
            switched_from: this.activeProviderId
          },
          switched_by: adminUserId,
          switched_at: new Date().toISOString()
        });

      if (error) {
        console.error('Database update failed:', error);
        throw new Error('Failed to update provider settings in database');
      }

      // Update active provider
      const previousProvider = this.activeProviderId;
      this.activeProviderId = newProviderId;

      // Log the switch
      await this.logProviderEvent({
        event: 'provider_switched',
        from_provider: previousProvider,
        to_provider: newProviderId,
        admin_user_id: adminUserId,
        details: { success: true }
      });

      console.log(`✅ Successfully switched to ${newProviderId}`);
      
      return { 
        success: true, 
        activeProvider: this.activeProviderId,
        previousProvider,
        message: `Successfully switched to ${newProviderId}`
      };

    } catch (error) {
      console.error(`❌ Provider switch failed:`, error);
      
      // Log the failed switch
      await this.logProviderEvent({
        event: 'provider_switch_failed',
        from_provider: this.activeProviderId,
        to_provider: newProviderId,
        admin_user_id: adminUserId,
        details: { error: error.message }
      });

      return { 
        success: false, 
        error: error.message,
        activeProvider: this.activeProviderId
      };
    }
  }

  /**
   * Perform automatic fallback to secondary provider
   */
  async performFallback() {
    const fallbackProvider = this.activeProviderId === 'sendgrid' ? 'elasticemail' : 'sendgrid';
    
    try {
      console.log(`🚨 Performing automatic fallback to ${fallbackProvider}...`);
      
      // Initialize fallback provider
      const provider = this.providers[fallbackProvider];
      await provider.initialize();
      
      // Update active provider (but don't update database for automatic fallback)
      const previousProvider = this.activeProviderId;
      this.activeProviderId = fallbackProvider;
      
      // Log the fallback
      await this.logProviderEvent({
        event: 'automatic_fallback',
        from_provider: previousProvider,
        to_provider: fallbackProvider,
        details: { reason: 'Primary provider failed' }
      });
      
      console.log(`✅ Automatic fallback to ${fallbackProvider} successful`);
      return { success: true, activeProvider: this.activeProviderId };
      
    } catch (error) {
      console.error(`❌ Fallback failed:`, error);
      
      await this.logProviderEvent({
        event: 'fallback_failed',
        from_provider: this.activeProviderId,
        to_provider: fallbackProvider,
        details: { error: error.message }
      });
      
      throw new Error(`Both primary and fallback providers failed: ${error.message}`);
    }
  }

  /**
   * Send email using the active provider with automatic fallback
   */
  async sendEmail(params) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const activeProvider = this.providers[this.activeProviderId];
    
    try {
      // Attempt to send with active provider
      const result = await activeProvider.sendEmail(params);
      
      if (result.success) {
        // Log successful send
        await this.logEmailSend({
          provider: this.activeProviderId,
          recipient: Array.isArray(params.to) ? params.to[0] : params.to,
          subject: params.subject,
          status: 'sent',
          message_id: result.messageId
        });
        
        return result;
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.error(`❌ ${this.activeProviderId} send failed:`, error);
      
      // If fallback is enabled, try the other provider
      if (this.fallbackEnabled) {
        const fallbackProviderId = this.activeProviderId === 'sendgrid' ? 'elasticemail' : 'sendgrid';
        const fallbackProvider = this.providers[fallbackProviderId];
        
        try {
          console.log(`🔄 Attempting fallback send with ${fallbackProviderId}...`);
          
          // Initialize fallback provider if needed
          if (!fallbackProvider.isHealthy()) {
            await fallbackProvider.initialize();
          }
          
          const fallbackResult = await fallbackProvider.sendEmail(params);
          
          if (fallbackResult.success) {
            // Log successful fallback send
            await this.logEmailSend({
              provider: fallbackProviderId,
              recipient: Array.isArray(params.to) ? params.to[0] : params.to,
              subject: params.subject,
              status: 'sent_fallback',
              message_id: fallbackResult.messageId
            });
            
            console.log(`✅ Fallback send successful with ${fallbackProviderId}`);
            return { ...fallbackResult, usedFallback: true };
          } else {
            throw new Error(fallbackResult.error);
          }
          
        } catch (fallbackError) {
          console.error(`❌ Fallback send also failed:`, fallbackError);
          
          // Log failed send
          await this.logEmailSend({
            provider: `${this.activeProviderId}_and_${fallbackProviderId}`,
            recipient: Array.isArray(params.to) ? params.to[0] : params.to,
            subject: params.subject,
            status: 'failed',
            error_message: `Both providers failed: ${error.message}, ${fallbackError.message}`
          });
          
          return { 
            success: false, 
            error: `Both providers failed: Primary (${error.message}), Fallback (${fallbackError.message})`,
            provider: 'both_failed'
          };
        }
      } else {
        // Log failed send without fallback
        await this.logEmailSend({
          provider: this.activeProviderId,
          recipient: Array.isArray(params.to) ? params.to[0] : params.to,
          subject: params.subject,
          status: 'failed',
          error_message: error.message
        });
        
        return { 
          success: false, 
          error: error.message, 
          provider: this.activeProviderId 
        };
      }
    }
  }

  /**
   * Test a specific provider
   */
  async testProvider(providerId, testEmail) {
    const provider = this.providers[providerId];
    if (!provider) {
      return { success: false, error: `Unknown provider: ${providerId}` };
    }

    try {
      // Initialize provider if not already done
      if (!provider.initialized) {
        await provider.initialize();
      }
      
      const result = await provider.testConnection(testEmail);
      
      // Log test result
      await this.logProviderEvent({
        event: 'provider_test',
        provider: providerId,
        details: { 
          success: result.success, 
          responseTime: result.responseTime,
          testEmail: testEmail
        }
      });
      
      return result;
      
    } catch (error) {
      await this.logProviderEvent({
        event: 'provider_test_failed',
        provider: providerId,
        details: { error: error.message, testEmail: testEmail }
      });
      
      return { 
        success: false, 
        error: error.message, 
        provider: providerId 
      };
    }
  }

  /**
   * Get status of all providers
   */
  async getProvidersStatus() {
    const status = {
      activeProvider: this.activeProviderId,
      fallbackEnabled: this.fallbackEnabled,
      providers: {}
    };

    for (const [id, provider] of Object.entries(this.providers)) {
      try {
        const health = await provider.getHealthStatus();
        const stats = provider.getStats();
        const config = provider.getConfigRequirements();
        
        status.providers[id] = {
          ...stats,
          health,
          config,
          isActive: id === this.activeProviderId,
          configured: config.requiredEnvVars.every(env => !!process.env[env])
        };
      } catch (error) {
        status.providers[id] = {
          id,
          name: provider.name,
          healthy: false,
          error: error.message,
          isActive: id === this.activeProviderId,
          configured: false
        };
      }
    }

    return status;
  }

  /**
   * Log provider-related events
   */
  async logProviderEvent(eventData) {
    try {
      await this.supabase
        .from('email_provider_logs')
        .insert({
          provider: eventData.provider || this.activeProviderId,
          email_type: eventData.event,
          subject: JSON.stringify(eventData.details || {}),
          status: eventData.success !== false ? 'sent' : 'failed',
          error_message: eventData.error,
          recipient_email: eventData.admin_user_id || 'system'
        });
    } catch (error) {
      console.error('Failed to log provider event:', error);
    }
  }

  /**
   * Log email send attempts
   */
  async logEmailSend(logData) {
    try {
      await this.supabase
        .from('email_provider_logs')
        .insert({
          provider: logData.provider,
          email_type: logData.email_type || 'unknown',
          recipient_email: logData.recipient,
          subject: logData.subject,
          status: logData.status,
          error_message: logData.error_message,
          message_id: logData.message_id
        });
    } catch (error) {
      console.error('Failed to log email send:', error);
    }
  }
}

// Create a singleton instance
const emailProviderManager = new EmailProviderManager();

export default emailProviderManager;