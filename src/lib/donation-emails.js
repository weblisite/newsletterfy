import { sendTransactionalEmail, sendSimpleEmail } from './email.js';

/**
 * Send thank you email to donor after successful donation
 */
export async function sendDonorThankYouEmail({ 
  donor_email, 
  donor_name, 
  recipient_name, 
  amount, 
  message, 
  tier_name = null 
}) {
  try {
    const subject = `Thank you for your donation to ${recipient_name}!`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin-bottom: 10px;">🎉 Thank You!</h1>
          <p style="font-size: 18px; color: #374151;">Your donation has been received</p>
        </div>
        
        <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #1f2937; margin-top: 0;">Donation Details</h2>
          <ul style="list-style: none; padding: 0;">
            <li style="margin-bottom: 8px;"><strong>Amount:</strong> $${amount}</li>
            <li style="margin-bottom: 8px;"><strong>Recipient:</strong> ${recipient_name}</li>
            ${tier_name ? `<li style="margin-bottom: 8px;"><strong>Tier:</strong> ${tier_name}</li>` : ''}
            ${message ? `<li style="margin-bottom: 8px;"><strong>Your Message:</strong> "${message}"</li>` : ''}
          </ul>
        </div>
        
        <div style="margin-bottom: 20px;">
          <p>Hi ${donor_name},</p>
          <p>Thank you so much for your generous donation of <strong>$${amount}</strong> to ${recipient_name}'s newsletter! Your support helps creators continue producing amazing content.</p>
          ${message ? `<p>Your message: <em>"${message}"</em></p>` : ''}
          <p>You should receive an email receipt from our payment processor shortly.</p>
        </div>
        
        <div style="background: #dbeafe; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
          <p style="margin: 0; color: #1e40af;">
            <strong>💝 Your support matters!</strong> Content creators rely on supporters like you to keep their newsletters free and accessible to everyone.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            This email was sent from Newsletterfy<br>
            Questions? Contact us at support@newsletterfy.com
          </p>
        </div>
      </div>
    `;

    const text = `
      Thank you for your donation!
      
      Hi ${donor_name},
      
      Thank you for your generous donation of $${amount} to ${recipient_name}'s newsletter!
      ${tier_name ? `Tier: ${tier_name}` : ''}
      ${message ? `Your message: "${message}"` : ''}
      
      Your support helps creators continue producing amazing content.
      
      Best regards,
      The Newsletterfy Team
    `;

    return await sendSimpleEmail({
      to: donor_email,
      subject,
      html,
      text
    });
  } catch (error) {
    console.error('Error sending donor thank you email:', error);
    return { success: false, error };
  }
}

/**
 * Send notification email to recipient about new donation
 */
export async function sendRecipientDonationEmail({ 
  recipient_email, 
  recipient_name, 
  donor_name, 
  amount, 
  message, 
  tier_name = null 
}) {
  try {
    const subject = `🎉 You received a $${amount} donation!`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #059669; margin-bottom: 10px;">💰 New Donation Received!</h1>
          <p style="font-size: 18px; color: #374151;">Someone just supported your newsletter</p>
        </div>
        
        <div style="background: #ecfdf5; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #065f46; margin-top: 0;">Donation Details</h2>
          <ul style="list-style: none; padding: 0;">
            <li style="margin-bottom: 8px;"><strong>Amount:</strong> $${amount}</li>
            <li style="margin-bottom: 8px;"><strong>Your Share:</strong> $${(amount * 0.8).toFixed(2)} (80%)</li>
            <li style="margin-bottom: 8px;"><strong>From:</strong> ${donor_name}</li>
            ${tier_name ? `<li style="margin-bottom: 8px;"><strong>Tier:</strong> ${tier_name}</li>` : ''}
          </ul>
        </div>
        
        <div style="margin-bottom: 20px;">
          <p>Hi ${recipient_name},</p>
          <p>Great news! You just received a <strong>$${amount}</strong> donation from ${donor_name}. Your supporter believes in your content and wants to help you continue creating amazing newsletters!</p>
          ${message ? `<div style="background: #f3f4f6; border-left: 4px solid #6b7280; padding: 15px; margin: 15px 0;"><p style="margin: 0; font-style: italic;">"${message}"</p><p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">- ${donor_name}</p></div>` : ''}
          <p>After our 20% platform fee, you'll receive <strong>$${(amount * 0.8).toFixed(2)}</strong> from this donation.</p>
        </div>
        
        <div style="background: #fef3c7; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
          <p style="margin: 0; color: #92400e;">
            <strong>💡 Keep it up!</strong> Donations like this show that your content is making a real impact. Consider thanking your supporters in your next newsletter!
          </p>
        </div>
        
        <div style="text-align: center; margin-bottom: 20px;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/user-dashboard" 
             style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            View Your Dashboard
          </a>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            This email was sent from Newsletterfy<br>
            Questions? Contact us at support@newsletterfy.com
          </p>
        </div>
      </div>
    `;

    const text = `
      New Donation Received!
      
      Hi ${recipient_name},
      
      You just received a $${amount} donation from ${donor_name}!
      Your share: $${(amount * 0.8).toFixed(2)} (80%)
      ${tier_name ? `Tier: ${tier_name}` : ''}
      ${message ? `Message: "${message}"` : ''}
      
      Keep up the great work!
      
      View your dashboard: ${process.env.NEXT_PUBLIC_BASE_URL}/user-dashboard
      
      Best regards,
      The Newsletterfy Team
    `;

    return await sendSimpleEmail({
      to: recipient_email,
      subject,
      html,
      text
    });
  } catch (error) {
    console.error('Error sending recipient donation email:', error);
    return { success: false, error };
  }
}

/**
 * Send both donor and recipient emails after successful donation
 */
export async function sendDonationEmails({
  donor_email,
  donor_name,
  recipient_email,
  recipient_name,
  amount,
  message,
  tier_name = null
}) {
  const results = await Promise.allSettled([
    sendDonorThankYouEmail({
      donor_email,
      donor_name,
      recipient_name,
      amount,
      message,
      tier_name
    }),
    sendRecipientDonationEmail({
      recipient_email,
      recipient_name,
      donor_name,
      amount,
      message,
      tier_name
    })
  ]);

  return {
    donor_email_sent: results[0].status === 'fulfilled' && results[0].value.success,
    recipient_email_sent: results[1].status === 'fulfilled' && results[1].value.success,
    errors: results
      .filter(result => result.status === 'rejected' || !result.value.success)
      .map(result => result.status === 'rejected' ? result.reason : result.value.error)
  };
} 