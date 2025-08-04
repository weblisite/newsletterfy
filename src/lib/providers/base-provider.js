/**
 * Base Email Provider Class
 * Defines the interface that all email providers must implement
 */
export class BaseEmailProvider {
  constructor(providerId, providerName) {
    this.id = providerId
    this.name = providerName
    this.initialized = false
    this.healthy = false
    this.lastHealthCheck = null
    this.errorCount = 0
    this.maxErrors = 3 // Maximum errors before marking as unhealthy
  }

  /**
   * Initialize the email provider
   * Must be implemented by each provider
   */
  async initialize() {
    throw new Error(`${this.name}: initialize() method must be implemented`)
  }

  /**
   * Send an email using this provider
   * Must be implemented by each provider
   * 
   * @param {Object} params - Email parameters
   * @param {string|Array} params.to - Recipient email(s)
   * @param {string} params.subject - Email subject
   * @param {string} params.html - HTML content
   * @param {string} params.text - Plain text content (optional)
   * @param {Object} params.from - Sender info (optional, will be generated if not provided)
   * @param {Object} params.newsletter - Newsletter context (optional)
   * @param {Object} params.user - User context (optional)
   * @param {Array} params.attachments - Email attachments (optional)
   * @returns {Promise<Object>} - Send result { success, messageId, provider, error }
   */
  async sendEmail(params) {
    throw new Error(`${this.name}: sendEmail() method must be implemented`)
  }

  /**
   * Test the provider connection
   * Must be implemented by each provider
   * 
   * @param {string} testEmail - Email to send test to
   * @returns {Promise<Object>} - Test result { success, error, responseTime }
   */
  async testConnection(testEmail) {
    throw new Error(`${this.name}: testConnection() method must be implemented`)
  }

  /**
   * Get provider health status
   * Can be overridden by specific providers for custom health checks
   * 
   * @returns {Promise<Object>} - Health status { healthy, lastCheck, errors, message }
   */
  async getHealthStatus() {
    try {
      const startTime = Date.now()
      
      // Basic health check - try to initialize if not already done
      if (!this.initialized) {
        await this.initialize()
      }
      
      const responseTime = Date.now() - startTime
      this.healthy = true
      this.lastHealthCheck = new Date()
      
      return {
        healthy: true,
        lastCheck: this.lastHealthCheck,
        responseTime,
        errors: this.errorCount,
        message: `${this.name} is healthy`
      }
    } catch (error) {
      console.error(`${this.name} health check failed:`, error)
      this.healthy = false
      this.errorCount++
      this.lastHealthCheck = new Date()
      
      return {
        healthy: false,
        lastCheck: this.lastHealthCheck,
        errors: this.errorCount,
        message: `${this.name} health check failed: ${error.message}`
      }
    }
  }

  /**
   * Reset error count (called after successful operations)
   */
  resetErrorCount() {
    this.errorCount = 0
  }

  /**
   * Check if provider is healthy and ready to send emails
   */
  isHealthy() {
    return this.initialized && this.healthy && this.errorCount < this.maxErrors
  }

  /**
   * Get provider configuration requirements
   * Should be overridden by each provider
   */
  getConfigRequirements() {
    return {
      requiredEnvVars: [],
      optionalEnvVars: [],
      configDescription: `Configuration for ${this.name}`
    }
  }

  /**
   * Validate provider configuration
   * Should be overridden by each provider
   */
  validateConfig() {
    const requirements = this.getConfigRequirements()
    const missing = requirements.requiredEnvVars.filter(envVar => !process.env[envVar])
    
    if (missing.length > 0) {
      throw new Error(`${this.name}: Missing required environment variables: ${missing.join(', ')}`)
    }
    
    return true
  }

  /**
   * Get provider statistics
   * Can be overridden for provider-specific stats
   */
  getStats() {
    return {
      id: this.id,
      name: this.name,
      initialized: this.initialized,
      healthy: this.healthy,
      errorCount: this.errorCount,
      lastHealthCheck: this.lastHealthCheck
    }
  }
}

export default BaseEmailProvider