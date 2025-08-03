import { JSDOM } from 'jsdom';
import { nanoid } from 'nanoid';

/**
 * Add tracking to email content
 * @param {string} content - The HTML content of the email
 * @param {string} newsletterId - The ID of the newsletter
 * @param {string} subscriberId - The ID of the subscriber
 * @param {string} baseUrl - The base URL of the application
 * @returns {string} - The processed HTML content with tracking
 */
export function addTracking(content, newsletterId, subscriberId, baseUrl) {
  const dom = new JSDOM(content);
  const document = dom.window.document;

  // Add tracking pixel for opens
  const trackingPixel = document.createElement('img');
  trackingPixel.src = `${baseUrl}/api/newsletter/track?id=${newsletterId}&sid=${subscriberId}`;
  trackingPixel.width = 1;
  trackingPixel.height = 1;
  trackingPixel.style.display = 'none';
  document.body.appendChild(trackingPixel);

  // Add tracking to all links
  const links = document.getElementsByTagName('a');
  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    const originalUrl = link.href;

    // Skip if it's already a tracking link or mailto link
    if (originalUrl.includes('/api/newsletter/track') || originalUrl.startsWith('mailto:')) {
      continue;
    }

    // Create a unique tracking ID for this link
    const trackingId = nanoid();

    // Store the original URL and create a tracking link
    const trackingUrl = `${baseUrl}/api/newsletter/track/link/${trackingId}`;

    // Store the tracking data in the database (this should be done in bulk)
    storeTrackingLink(trackingId, {
      newsletterId,
      subscriberId,
      originalUrl,
    });

    // Update the link href
    link.href = trackingUrl;
  }

  return dom.serialize();
}

/**
 * Store tracking link data
 * @param {string} trackingId - The unique tracking ID
 * @param {Object} data - The tracking data
 */
async function storeTrackingLink(trackingId, data) {
  try {
    const response = await fetch('/api/newsletter/track/store', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trackingId,
        ...data,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to store tracking link');
    }
  } catch (error) {
    console.error('Error storing tracking link:', error);
  }
}

/**
 * Process bounce notifications
 * @param {Object} bounceData - The bounce notification data
 */
export async function processBounce(bounceData) {
  try {
    const { newsletterId, subscriberId, type, reason } = bounceData;

    // Update newsletter stats
    await fetch('/api/newsletter/stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        newsletterId,
        type: 'bounce',
      }),
    });

    // Update subscriber status
    if (subscriberId) {
      await fetch('/api/subscribers/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriberId,
          status: 'bounced',
          reason,
        }),
      });
    }
  } catch (error) {
    console.error('Error processing bounce:', error);
  }
}

/**
 * Process complaint notifications
 * @param {Object} complaintData - The complaint notification data
 */
export async function processComplaint(complaintData) {
  try {
    const { newsletterId, subscriberId, type, reason } = complaintData;

    // Update subscriber status
    if (subscriberId) {
      await fetch('/api/subscribers/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriberId,
          status: 'unsubscribed',
          reason: 'complaint',
          details: reason,
        }),
      });
    }

    // Log complaint for review
    await fetch('/api/newsletter/complaints', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        newsletterId,
        subscriberId,
        type,
        reason,
      }),
    });
  } catch (error) {
    console.error('Error processing complaint:', error);
  }
} 