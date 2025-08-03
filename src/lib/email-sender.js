/**
 * Newsletter Email Sender Utilities
 * Handles dynamic sender email generation based on newsletter names
 */

/**
 * Sanitize newsletter name for email address
 * @param {string} newsletterName - The newsletter name
 * @returns {string} - Sanitized string suitable for email addresses
 */
function sanitizeNewsletterName(newsletterName) {
  if (!newsletterName) return 'newsletter';
  
  return newsletterName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 50) // Limit length to 50 characters
    .replace(/-$/, ''); // Remove trailing hyphen if any
}

/**
 * Generate newsletter-specific sender email
 * @param {string} newsletterName - The newsletter name
 * @param {string} fallbackDomain - Fallback domain if not using newsletterfy.com
 * @returns {string} - Newsletter-specific sender email
 */
export function generateNewsletterSenderEmail(newsletterName, fallbackDomain = 'mail.newsletterfy.com') {
  const sanitizedName = sanitizeNewsletterName(newsletterName);
  const emailPrefix = sanitizedName || 'newsletter';
  return `${emailPrefix}@${fallbackDomain}`;
}

/**
 * Generate sender information for newsletter emails
 * @param {Object} newsletter - Newsletter object with name and other details
 * @param {Object} user - User object who owns the newsletter
 * @param {Object} options - Additional options for sender configuration
 * @returns {Object} - Sender information object
 */
export function generateNewsletterSender(newsletter, user = null, options = {}) {
  const {
    useCustomDomain = false,
    customDomain = null,
    fallbackSenderName = null
  } = options;

  // Generate email address
  const domain = useCustomDomain && customDomain 
    ? customDomain 
    : 'mail.newsletterfy.com';
    
  const senderEmail = generateNewsletterSenderEmail(newsletter.name || newsletter.title, domain);
  
  // Generate sender name
  const senderName = newsletter.senderName 
    || fallbackSenderName 
    || newsletter.name 
    || newsletter.title 
    || (user?.name ? `${user.name}'s Newsletter` : 'Newsletter');

  return {
    email: senderEmail,
    name: senderName,
    replyTo: newsletter.replyTo || user?.email || process.env.EMAIL_FROM || 'noreply@newsletterfy.com'
  };
}

/**
 * Validate newsletter sender email configuration
 * @param {Object} sender - Sender object to validate
 * @returns {Object} - Validation result
 */
export function validateNewsletterSender(sender) {
  const errors = [];
  
  if (!sender.email) {
    errors.push('Sender email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sender.email)) {
    errors.push('Invalid sender email format');
  }
  
  if (!sender.name) {
    errors.push('Sender name is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get newsletter sender for different email types
 * @param {Object} newsletter - Newsletter object
 * @param {Object} user - User object
 * @param {string} emailType - Type of email (newsletter, test, welcome, etc.)
 * @returns {Object} - Sender configuration
 */
export function getNewsletterSenderByType(newsletter, user, emailType = 'newsletter') {
  const baseSender = generateNewsletterSender(newsletter, user);
  
  switch (emailType) {
    case 'test':
      return {
        ...baseSender,
        name: `[TEST] ${baseSender.name}`
      };
      
    case 'welcome':
      return {
        ...baseSender,
        name: `Welcome to ${newsletter.name || newsletter.title}`
      };
      
    case 'subscription':
      return {
        ...baseSender,
        name: `${newsletter.name || newsletter.title} - Subscription Update`
      };
      
    case 'newsletter':
    default:
      return baseSender;
  }
}

/**
 * Examples of generated sender emails:
 * 
 * Newsletter Name: "Tech Weekly" -> tech-weekly@mail.newsletterfy.com
 * Newsletter Name: "Finance & Crypto Insights" -> finance-crypto-insights@mail.newsletterfy.com
 * Newsletter Name: "Health & Wellness 2024" -> health-wellness-2024@mail.newsletterfy.com
 * Newsletter Name: "AI/ML Newsletter" -> aiml-newsletter@mail.newsletterfy.com
 */ 