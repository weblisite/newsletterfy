// Automated Ad Placement System
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Analyzes newsletter content and suggests optimal ad placement positions
 * @param {string} content - Newsletter HTML content
 * @param {Object} preferences - User ad preferences
 * @returns {Array} Array of suggested ad placement positions
 */
export function analyzeContentForAdPlacement(content, preferences = {}) {
  const {
    maxAdsPerNewsletter = 3,
    preferredAdTypes = ['sponsored', 'cross-promotion'],
    minimumContentBetweenAds = 200, // characters
    adPlacementStrategy = 'balanced' // balanced, aggressive, conservative
  } = preferences;

  // Parse HTML content to find suitable insertion points
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/html');
  
  // Find all paragraph elements
  const paragraphs = Array.from(doc.querySelectorAll('p, h2, h3, div'));
  const placements = [];
  
  let characterCount = 0;
  let lastAdPosition = 0;
  
  paragraphs.forEach((element, index) => {
    const textLength = element.textContent.length;
    characterCount += textLength;
    
    // Check if we should place an ad here
    const shouldPlaceAd = shouldInsertAdHere({
      index,
      characterCount,
      lastAdPosition,
      totalElements: paragraphs.length,
      strategy: adPlacementStrategy,
      minimumContentBetweenAds,
      currentAdCount: placements.length,
      maxAdsPerNewsletter
    });
    
    if (shouldPlaceAd) {
      placements.push({
        position: index,
        type: 'after-element',
        element: element.tagName.toLowerCase(),
        characterCount,
        confidence: calculatePlacementConfidence(element, index, paragraphs.length)
      });
      lastAdPosition = characterCount;
    }
  });
  
  return placements;
}

/**
 * Determines if an ad should be inserted at a specific position
 */
function shouldInsertAdHere({
  index,
  characterCount,
  lastAdPosition,
  totalElements,
  strategy,
  minimumContentBetweenAds,
  currentAdCount,
  maxAdsPerNewsletter
}) {
  // Don't exceed max ads
  if (currentAdCount >= maxAdsPerNewsletter) return false;
  
  // Ensure minimum content between ads
  if (characterCount - lastAdPosition < minimumContentBetweenAds) return false;
  
  // Strategy-based placement
  switch (strategy) {
    case 'aggressive':
      return index > 2 && (index % 3 === 0);
    case 'conservative':
      return index > 5 && (index % 8 === 0);
    case 'balanced':
    default:
      return index > 3 && (index % 5 === 0);
  }
}

/**
 * Calculates confidence score for ad placement
 */
function calculatePlacementConfidence(element, index, totalElements) {
  let confidence = 0.5; // Base confidence
  
  // Higher confidence for middle sections
  const position = index / totalElements;
  if (position > 0.3 && position < 0.7) {
    confidence += 0.2;
  }
  
  // Higher confidence after headings
  if (element.tagName.match(/^H[2-4]$/)) {
    confidence += 0.15;
  }
  
  // Lower confidence at the very beginning or end
  if (position < 0.1 || position > 0.9) {
    confidence -= 0.2;
  }
  
  return Math.max(0, Math.min(1, confidence));
}

/**
 * Fetches relevant ads for a newsletter based on content and targeting
 * @param {Object} newsletter - Newsletter object
 * @param {Array} placements - Suggested ad placements
 * @returns {Array} Array of matched ads
 */
export async function fetchRelevantAds(newsletter, placements) {
  try {
    // Get active sponsored ads that match newsletter topics
    const { data: sponsoredAds, error: sponsoredError } = await supabase
      .from('sponsored_ads')
      .select('*')
      .eq('status', 'active')
      .lte('start_date', new Date().toISOString())
      .gte('end_date', new Date().toISOString())
      .limit(placements.length);

    if (sponsoredError) throw sponsoredError;

    // Get cross-promotion opportunities
    const { data: crossPromotions, error: crossError } = await supabase
      .from('cross_promotions')
      .select('*')
      .eq('status', 'active')
      .neq('user_id', newsletter.userId) // Don't show user's own promotions
      .limit(placements.length);

    if (crossError) throw crossError;

    // Score and rank ads
    const allAds = [
      ...sponsoredAds.map(ad => ({ ...ad, type: 'sponsored', score: scoreAd(ad, newsletter) })),
      ...crossPromotions.map(ad => ({ ...ad, type: 'cross-promotion', score: scoreAd(ad, newsletter) }))
    ];

    // Sort by score and return top matches
    return allAds
      .sort((a, b) => b.score - a.score)
      .slice(0, placements.length);

  } catch (error) {
    console.error('Error fetching relevant ads:', error);
    return [];
  }
}

/**
 * Scores an ad based on relevance to newsletter content
 */
function scoreAd(ad, newsletter) {
  let score = 0.5; // Base score
  
  // Keyword matching (simplified)
  const newsletterText = (newsletter.content + ' ' + newsletter.subject).toLowerCase();
  const adText = (ad.campaign + ' ' + (ad.description || '')).toLowerCase();
  
  // Simple keyword overlap scoring
  const newsletterWords = newsletterText.split(/\s+/);
  const adWords = adText.split(/\s+/);
  const overlap = newsletterWords.filter(word => adWords.includes(word)).length;
  
  score += Math.min(0.3, overlap * 0.05);
  
  // Performance-based scoring
  if (ad.clicks && ad.impressions) {
    const ctr = ad.clicks / ad.impressions;
    score += Math.min(0.2, ctr * 2); // CTR contribution
  }
  
  // Budget-based scoring (higher budget = higher priority)
  if (ad.budget) {
    score += Math.min(0.1, ad.budget / 10000); // Normalize budget
  }
  
  return score;
}

/**
 * Inserts ads into newsletter content at specified positions
 * @param {string} content - Original newsletter content
 * @param {Array} placements - Ad placement positions
 * @param {Array} ads - Ads to insert
 * @returns {string} Modified content with ads inserted
 */
export function insertAdsIntoContent(content, placements, ads) {
  if (!placements.length || !ads.length) return content;
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/html');
  const elements = Array.from(doc.querySelectorAll('p, h2, h3, div'));
  
  // Insert ads in reverse order to maintain correct positions
  placements.reverse().forEach((placement, index) => {
    if (ads[index] && elements[placement.position]) {
      const adHtml = generateAdHtml(ads[index], placement);
      const adElement = doc.createElement('div');
      adElement.innerHTML = adHtml;
      
      // Insert after the target element
      elements[placement.position].parentNode.insertBefore(
        adElement,
        elements[placement.position].nextSibling
      );
    }
  });
  
  return doc.documentElement.outerHTML;
}

/**
 * Generates HTML for an ad based on its type
 */
function generateAdHtml(ad, placement) {
  const trackingId = generateTrackingId();
  
  if (ad.type === 'sponsored') {
    return `
      <div class="newsletter-ad sponsored-ad" data-ad-id="${ad.id}" data-tracking-id="${trackingId}" style="margin: 20px 0; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #f8fafc;">
        <div style="font-size: 10px; color: #64748b; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Sponsored</div>
        <h4 style="margin: 0 0 8px 0; color: #1e293b; font-size: 16px; font-weight: 600;">${ad.brand_name}</h4>
        <p style="margin: 0 0 12px 0; color: #475569; font-size: 14px; line-height: 1.5;">${ad.campaign}</p>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/api/ads/track?id=${ad.id}&tracking=${trackingId}" 
           style="display: inline-block; background-color: #3b82f6; color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">
          Learn More
        </a>
      </div>
    `;
  }
  
  if (ad.type === 'cross-promotion') {
    return `
      <div class="newsletter-ad cross-promotion-ad" data-ad-id="${ad.id}" data-tracking-id="${trackingId}" style="margin: 20px 0; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #f0fdf4;">
        <div style="font-size: 10px; color: #16a34a; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Featured Newsletter</div>
        <h4 style="margin: 0 0 8px 0; color: #15803d; font-size: 16px; font-weight: 600;">${ad.newsletter_name}</h4>
        <p style="margin: 0 0 12px 0; color: #166534; font-size: 14px; line-height: 1.5;">${ad.description}</p>
        <p style="margin: 0 0 12px 0; color: #15803d; font-size: 12px;">${ad.subscribers} subscribers</p>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/api/cross-promotions/track?id=${ad.id}&tracking=${trackingId}" 
           style="display: inline-block; background-color: #16a34a; color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">
          Subscribe Now
        </a>
      </div>
    `;
  }
  
  return '';
}

/**
 * Generates a unique tracking ID for ad analytics
 */
function generateTrackingId() {
  return 'track_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

/**
 * Main function to automatically place ads in a newsletter
 * @param {Object} newsletter - Newsletter object
 * @param {Object} userPreferences - User's ad preferences
 * @returns {Object} Modified newsletter with ads and tracking info
 */
export async function automaticallyPlaceAds(newsletter, userPreferences = {}) {
  try {
    // Analyze content for ad placement opportunities
    const placements = analyzeContentForAdPlacement(newsletter.content, userPreferences);
    
    if (placements.length === 0) {
      return { ...newsletter, adsPlaced: 0, adRevenue: 0 };
    }
    
    // Fetch relevant ads
    const relevantAds = await fetchRelevantAds(newsletter, placements);
    
    if (relevantAds.length === 0) {
      return { ...newsletter, adsPlaced: 0, adRevenue: 0 };
    }
    
    // Insert ads into content
    const modifiedContent = insertAdsIntoContent(newsletter.content, placements, relevantAds);
    
    // Calculate potential revenue
    const estimatedRevenue = calculateEstimatedRevenue(relevantAds, newsletter.subscriberCount);
    
    // Log ad placement for analytics
    await logAdPlacements(newsletter.id, relevantAds, placements);
    
    return {
      ...newsletter,
      content: modifiedContent,
      adsPlaced: relevantAds.length,
      adRevenue: estimatedRevenue,
      placedAds: relevantAds.map((ad, index) => ({
        ...ad,
        placement: placements[index]
      }))
    };
    
  } catch (error) {
    console.error('Error in automated ad placement:', error);
    return { ...newsletter, adsPlaced: 0, adRevenue: 0, error: error.message };
  }
}

/**
 * Calculates estimated revenue from placed ads
 */
function calculateEstimatedRevenue(ads, subscriberCount) {
  return ads.reduce((total, ad) => {
    const estimatedCTR = ad.type === 'sponsored' ? 0.02 : 0.015; // 2% for sponsored, 1.5% for cross-promotions
    const revenuePerClick = ad.type === 'sponsored' ? (ad.budget / 1000) : (ad.revenue_per_click || 0.5);
    const estimatedClicks = subscriberCount * estimatedCTR;
    return total + (estimatedClicks * revenuePerClick * 0.8); // 80% goes to newsletter creator
  }, 0);
}

/**
 * Logs ad placements for analytics and tracking
 */
async function logAdPlacements(newsletterId, ads, placements) {
  try {
    const placementLogs = ads.map((ad, index) => ({
      newsletter_id: newsletterId,
      ad_id: ad.id,
      ad_type: ad.type,
      placement_position: placements[index]?.position || 0,
      placement_confidence: placements[index]?.confidence || 0,
      estimated_impressions: 0, // Will be updated when newsletter is sent
      actual_clicks: 0,
      created_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('ad_placements')
      .insert(placementLogs);

    if (error) throw error;
    
  } catch (error) {
    console.error('Error logging ad placements:', error);
  }
}

/**
 * Gets user's ad placement preferences
 */
export async function getUserAdPreferences(userId) {
  try {
    const { data, error } = await supabase
      .from('ad_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    
    return data || {
      max_ads_per_newsletter: 3,
      preferred_ad_types: ['sponsored', 'cross-promotion'],
      minimum_content_between_ads: 200,
      ad_placement_strategy: 'balanced',
      auto_placement_enabled: true
    };
    
  } catch (error) {
    console.error('Error fetching ad preferences:', error);
    return {};
  }
}

/**
 * Updates user's ad placement preferences
 */
export async function updateUserAdPreferences(userId, preferences) {
  try {
    const { data, error } = await supabase
      .from('ad_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
    
  } catch (error) {
    console.error('Error updating ad preferences:', error);
    throw error;
  }
} 