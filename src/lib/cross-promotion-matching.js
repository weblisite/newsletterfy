// Cross-Promotion Automated Matching System
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Analyzes newsletter characteristics for matching
 * @param {Object} newsletter - Newsletter object
 * @returns {Object} Newsletter analysis including keywords, engagement metrics, and audience profile
 */
export function analyzeNewsletterForMatching(newsletter) {
  const analysis = {
    id: newsletter.id,
    userId: newsletter.userId,
    keywords: extractKeywords(newsletter.content + ' ' + newsletter.subject),
    categories: categorizeContent(newsletter.content),
    engagementMetrics: {
      openRate: newsletter.openRate || 0,
      clickRate: newsletter.clickRate || 0,
      subscriberCount: newsletter.subscriberCount || 0,
      engagementScore: calculateEngagementScore(newsletter)
    },
    audienceProfile: {
      size: newsletter.subscriberCount || 0,
      quality: calculateAudienceQuality(newsletter),
      demographics: newsletter.demographics || {}
    },
    contentStyle: analyzeContentStyle(newsletter.content),
    publishingFrequency: newsletter.publishingFrequency || 'weekly'
  };

  return analysis;
}

/**
 * Extracts relevant keywords from newsletter content
 */
function extractKeywords(text) {
  // Common stop words to filter out
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'from', 'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might'
  ]);

  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));

  // Count word frequency
  const wordCount = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });

  // Return top keywords
  return Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 20)
    .map(([word]) => word);
}

/**
 * Categorizes content into relevant topics
 */
function categorizeContent(content) {
  const categories = {
    technology: ['tech', 'software', 'coding', 'programming', 'development', 'ai', 'machine learning'],
    business: ['business', 'startup', 'entrepreneur', 'marketing', 'sales', 'finance', 'investment'],
    health: ['health', 'fitness', 'wellness', 'nutrition', 'medical', 'diet', 'exercise'],
    lifestyle: ['lifestyle', 'travel', 'food', 'fashion', 'home', 'family', 'personal'],
    education: ['education', 'learning', 'teaching', 'course', 'university', 'student', 'academic'],
    news: ['news', 'current', 'events', 'politics', 'world', 'breaking', 'update'],
    entertainment: ['entertainment', 'movies', 'music', 'games', 'celebrity', 'sports'],
    finance: ['finance', 'money', 'investing', 'stock', 'crypto', 'trading', 'economy']
  };

  const contentLower = content.toLowerCase();
  const matchedCategories = [];

  Object.entries(categories).forEach(([category, keywords]) => {
    const matches = keywords.filter(keyword => contentLower.includes(keyword)).length;
    if (matches > 0) {
      matchedCategories.push({
        category,
        relevance: matches / keywords.length,
        matchCount: matches
      });
    }
  });

  return matchedCategories
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 3)
    .map(item => item.category);
}

/**
 * Calculates engagement score based on various metrics
 */
function calculateEngagementScore(newsletter) {
  const openRate = newsletter.openRate || 0;
  const clickRate = newsletter.clickRate || 0;
  const subscriberGrowth = newsletter.subscriberGrowth || 0;
  const replyRate = newsletter.replyRate || 0;

  // Weighted scoring
  const score = (
    (openRate * 0.4) +
    (clickRate * 0.3) +
    (subscriberGrowth * 0.2) +
    (replyRate * 0.1)
  );

  return Math.max(0, Math.min(1, score));
}

/**
 * Calculates audience quality score
 */
function calculateAudienceQuality(newsletter) {
  const engagementRate = (newsletter.openRate || 0) * (newsletter.clickRate || 0);
  const unsubscribeRate = newsletter.unsubscribeRate || 0;
  const spamComplaintRate = newsletter.spamComplaintRate || 0;

  // Quality score (higher is better)
  const quality = Math.max(0, 
    engagementRate - (unsubscribeRate * 2) - (spamComplaintRate * 5)
  );

  return Math.min(1, quality);
}

/**
 * Analyzes content style and tone
 */
function analyzeContentStyle(content) {
  const styles = {
    formal: 0,
    casual: 0,
    technical: 0,
    educational: 0,
    promotional: 0
  };

  const contentLower = content.toLowerCase();

  // Formal indicators
  if (contentLower.includes('furthermore') || contentLower.includes('however') || 
      contentLower.includes('therefore') || contentLower.includes('moreover')) {
    styles.formal += 0.3;
  }

  // Casual indicators
  if (contentLower.includes('hey') || contentLower.includes('awesome') || 
      contentLower.includes('cool') || contentLower.includes('!')) {
    styles.casual += 0.3;
  }

  // Technical indicators
  if (contentLower.includes('algorithm') || contentLower.includes('api') || 
      contentLower.includes('framework') || contentLower.includes('methodology')) {
    styles.technical += 0.3;
  }

  // Educational indicators
  if (contentLower.includes('learn') || contentLower.includes('understand') || 
      contentLower.includes('tutorial') || contentLower.includes('guide')) {
    styles.educational += 0.3;
  }

  // Promotional indicators
  if (contentLower.includes('buy') || contentLower.includes('discount') || 
      contentLower.includes('offer') || contentLower.includes('sale')) {
    styles.promotional += 0.3;
  }

  // Return dominant style
  return Object.entries(styles)
    .sort(([,a], [,b]) => b - a)[0][0];
}

/**
 * Finds potential cross-promotion matches for a newsletter
 * @param {Object} sourceNewsletter - The newsletter looking for cross-promotion partners
 * @param {Array} candidateNewsletters - Array of potential partner newsletters
 * @returns {Array} Sorted array of matches with compatibility scores
 */
export function findCrossPromotionMatches(sourceNewsletter, candidateNewsletters) {
  const sourceAnalysis = analyzeNewsletterForMatching(sourceNewsletter);
  
  const matches = candidateNewsletters
    .filter(candidate => candidate.userId !== sourceNewsletter.userId) // Exclude own newsletters
    .map(candidate => {
      const candidateAnalysis = analyzeNewsletterForMatching(candidate);
      const compatibility = calculateCompatibilityScore(sourceAnalysis, candidateAnalysis);
      
      return {
        newsletter: candidate,
        analysis: candidateAnalysis,
        compatibility,
        reasons: getMatchingReasons(sourceAnalysis, candidateAnalysis)
      };
    })
    .filter(match => match.compatibility > 0.3) // Only include decent matches
    .sort((a, b) => b.compatibility - a.compatibility);

  return matches;
}

/**
 * Calculates compatibility score between two newsletters
 */
function calculateCompatibilityScore(source, candidate) {
  let score = 0;

  // Category overlap (40% weight)
  const categoryOverlap = calculateCategoryOverlap(source.categories, candidate.categories);
  score += categoryOverlap * 0.4;

  // Keyword similarity (30% weight)
  const keywordSimilarity = calculateKeywordSimilarity(source.keywords, candidate.keywords);
  score += keywordSimilarity * 0.3;

  // Engagement compatibility (15% weight)
  const engagementCompatibility = calculateEngagementCompatibility(
    source.engagementMetrics, 
    candidate.engagementMetrics
  );
  score += engagementCompatibility * 0.15;

  // Audience size compatibility (10% weight)
  const audienceCompatibility = calculateAudienceCompatibility(
    source.audienceProfile.size, 
    candidate.audienceProfile.size
  );
  score += audienceCompatibility * 0.1;

  // Content style compatibility (5% weight)
  const styleCompatibility = source.contentStyle === candidate.contentStyle ? 1 : 0.5;
  score += styleCompatibility * 0.05;

  return Math.max(0, Math.min(1, score));
}

/**
 * Calculates category overlap between two newsletters
 */
function calculateCategoryOverlap(categories1, categories2) {
  if (!categories1.length || !categories2.length) return 0;
  
  const overlap = categories1.filter(cat => categories2.includes(cat)).length;
  const total = new Set([...categories1, ...categories2]).size;
  
  return overlap / total;
}

/**
 * Calculates keyword similarity using Jaccard index
 */
function calculateKeywordSimilarity(keywords1, keywords2) {
  if (!keywords1.length || !keywords2.length) return 0;
  
  const set1 = new Set(keywords1);
  const set2 = new Set(keywords2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

/**
 * Calculates engagement compatibility
 */
function calculateEngagementCompatibility(metrics1, metrics2) {
  // Prefer newsletters with similar engagement levels
  const openRateDiff = Math.abs(metrics1.openRate - metrics2.openRate);
  const clickRateDiff = Math.abs(metrics1.clickRate - metrics2.clickRate);
  
  const openRateCompatibility = 1 - openRateDiff;
  const clickRateCompatibility = 1 - clickRateDiff;
  
  return (openRateCompatibility + clickRateCompatibility) / 2;
}

/**
 * Calculates audience size compatibility
 */
function calculateAudienceCompatibility(size1, size2) {
  if (size1 === 0 || size2 === 0) return 0;
  
  const larger = Math.max(size1, size2);
  const smaller = Math.min(size1, size2);
  
  // Prefer similar audience sizes, but not identical
  const ratio = smaller / larger;
  
  // Sweet spot is between 0.1 and 0.9
  if (ratio >= 0.1 && ratio <= 0.9) {
    return ratio;
  } else if (ratio < 0.1) {
    return ratio * 5; // Penalty for very different sizes
  } else {
    return 0.9; // Slight penalty for very similar sizes
  }
}

/**
 * Gets human-readable reasons for the match
 */
function getMatchingReasons(source, candidate) {
  const reasons = [];
  
  // Category matches
  const sharedCategories = source.categories.filter(cat => candidate.categories.includes(cat));
  if (sharedCategories.length > 0) {
    reasons.push(`Shared interests: ${sharedCategories.join(', ')}`);
  }
  
  // Audience size
  const sizeDiff = Math.abs(source.audienceProfile.size - candidate.audienceProfile.size);
  const sizeRatio = Math.min(source.audienceProfile.size, candidate.audienceProfile.size) / 
                   Math.max(source.audienceProfile.size, candidate.audienceProfile.size);
  
  if (sizeRatio > 0.7) {
    reasons.push('Similar audience sizes');
  } else if (sizeRatio > 0.3) {
    reasons.push('Complementary audience sizes');
  }
  
  // Engagement levels
  const engagementDiff = Math.abs(source.engagementMetrics.engagementScore - candidate.engagementMetrics.engagementScore);
  if (engagementDiff < 0.2) {
    reasons.push('Similar engagement levels');
  }
  
  // Content style
  if (source.contentStyle === candidate.contentStyle) {
    reasons.push(`Both use ${source.contentStyle} writing style`);
  }
  
  return reasons;
}

/**
 * Creates automated cross-promotion campaigns based on matches
 * @param {Object} sourceNewsletter - Source newsletter
 * @param {Array} matches - Array of compatible newsletters
 * @param {Object} campaignSettings - Campaign configuration
 * @returns {Array} Created campaign objects
 */
export async function createAutomatedCrossPromotionCampaigns(sourceNewsletter, matches, campaignSettings = {}) {
  const {
    maxCampaigns = 3,
    minCompatibilityScore = 0.5,
    campaignDuration = 30, // days
    autoApprove = false
  } = campaignSettings;

  const campaigns = [];
  
  // Filter matches by minimum compatibility
  const qualifiedMatches = matches
    .filter(match => match.compatibility >= minCompatibilityScore)
    .slice(0, maxCampaigns);

  for (const match of qualifiedMatches) {
    try {
      const campaign = await createCrossPromotionCampaign({
        sourceNewsletterId: sourceNewsletter.id,
        targetNewsletterId: match.newsletter.id,
        compatibility: match.compatibility,
        reasons: match.reasons,
        duration: campaignDuration,
        status: autoApprove ? 'active' : 'pending',
        estimatedReach: calculateEstimatedReach(sourceNewsletter, match.newsletter),
        estimatedRevenue: calculateEstimatedRevenue(sourceNewsletter, match.newsletter)
      });
      
      campaigns.push(campaign);
    } catch (error) {
      console.error('Error creating cross-promotion campaign:', error);
    }
  }

  return campaigns;
}

/**
 * Creates a cross-promotion campaign in the database
 */
async function createCrossPromotionCampaign(campaignData) {
  try {
    const { data, error } = await supabase
      .from('cross_promotion_campaigns')
      .insert([{
        source_newsletter_id: campaignData.sourceNewsletterId,
        target_newsletter_id: campaignData.targetNewsletterId,
        compatibility_score: campaignData.compatibility,
        matching_reasons: campaignData.reasons,
        duration_days: campaignData.duration,
        status: campaignData.status,
        estimated_reach: campaignData.estimatedReach,
        estimated_revenue: campaignData.estimatedRevenue,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating cross-promotion campaign:', error);
    throw error;
  }
}

/**
 * Calculates estimated reach for cross-promotion
 */
function calculateEstimatedReach(sourceNewsletter, targetNewsletter) {
  // Estimate based on average cross-promotion performance
  const averageConversionRate = 0.05; // 5% conversion rate
  const targetAudience = targetNewsletter.subscriberCount || 0;
  
  return Math.round(targetAudience * averageConversionRate);
}

/**
 * Calculates estimated revenue for cross-promotion
 */
function calculateEstimatedRevenue(sourceNewsletter, targetNewsletter) {
  const estimatedReach = calculateEstimatedReach(sourceNewsletter, targetNewsletter);
  const revenuePerSubscriber = 2.5; // Average revenue per acquired subscriber
  
  return estimatedReach * revenuePerSubscriber;
}

/**
 * Gets all available newsletters for cross-promotion matching
 * @param {string} excludeUserId - User ID to exclude from results
 * @returns {Array} Array of available newsletters
 */
export async function getAvailableNewslettersForMatching(excludeUserId) {
  try {
    const { data, error } = await supabase
      .from('newsletters')
      .select('*')
      .neq('user_id', excludeUserId)
      .eq('status', 'published')
      .gte('subscriber_count', 100) // Minimum subscriber requirement
      .order('subscriber_count', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching available newsletters:', error);
    return [];
  }
}

/**
 * Updates cross-promotion campaign performance
 * @param {string} campaignId - Campaign ID
 * @param {Object} performanceData - Performance metrics
 */
export async function updateCampaignPerformance(campaignId, performanceData) {
  try {
    const { data, error } = await supabase
      .from('cross_promotion_campaigns')
      .update({
        actual_reach: performanceData.actualReach,
        actual_clicks: performanceData.actualClicks,
        actual_conversions: performanceData.actualConversions,
        actual_revenue: performanceData.actualRevenue,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating campaign performance:', error);
    throw error;
  }
}

/**
 * Gets performance analytics for cross-promotion campaigns
 * @param {string} userId - User ID
 * @returns {Object} Performance analytics
 */
export async function getCrossPromotionAnalytics(userId) {
  try {
    const { data, error } = await supabase
      .from('cross_promotion_campaigns')
      .select('*')
      .or(`source_newsletter_id.in.(${await getUserNewsletterIds(userId)}),target_newsletter_id.in.(${await getUserNewsletterIds(userId)})`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const analytics = {
      totalCampaigns: data.length,
      activeCampaigns: data.filter(c => c.status === 'active').length,
      completedCampaigns: data.filter(c => c.status === 'completed').length,
      totalReach: data.reduce((sum, c) => sum + (c.actual_reach || 0), 0),
      totalRevenue: data.reduce((sum, c) => sum + (c.actual_revenue || 0), 0),
      averageCompatibility: data.reduce((sum, c) => sum + c.compatibility_score, 0) / data.length,
      conversionRate: data.length > 0 ? 
        data.reduce((sum, c) => sum + (c.actual_conversions || 0), 0) / 
        data.reduce((sum, c) => sum + (c.actual_reach || 1), 0) : 0
    };

    return analytics;
  } catch (error) {
    console.error('Error fetching cross-promotion analytics:', error);
    return {};
  }
}

/**
 * Helper function to get user's newsletter IDs
 */
async function getUserNewsletterIds(userId) {
  try {
    const { data, error } = await supabase
      .from('newsletters')
      .select('id')
      .eq('user_id', userId);

    if (error) throw error;
    return data.map(n => n.id).join(',');
  } catch (error) {
    console.error('Error fetching user newsletter IDs:', error);
    return '';
  }
}

/**
 * Main function to run automated cross-promotion matching
 * @param {string} userId - User ID
 * @param {Object} settings - Matching settings
 * @returns {Object} Matching results and created campaigns
 */
export async function runAutomatedCrossPromotionMatching(userId, settings = {}) {
  try {
    // Get user's newsletters
    const { data: userNewsletters, error: userError } = await supabase
      .from('newsletters')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'published');

    if (userError) throw userError;

    if (!userNewsletters.length) {
      return { error: 'No published newsletters found' };
    }

    // Get available newsletters for matching
    const availableNewsletters = await getAvailableNewslettersForMatching(userId);

    const results = [];

    // Find matches for each user newsletter
    for (const newsletter of userNewsletters) {
      const matches = findCrossPromotionMatches(newsletter, availableNewsletters);
      
      if (matches.length > 0) {
        const campaigns = await createAutomatedCrossPromotionCampaigns(newsletter, matches, settings);
        results.push({
          newsletter,
          matches: matches.length,
          campaignsCreated: campaigns.length,
          campaigns
        });
      }
    }

    return {
      success: true,
      newslettersProcessed: userNewsletters.length,
      totalMatches: results.reduce((sum, r) => sum + r.matches, 0),
      totalCampaigns: results.reduce((sum, r) => sum + r.campaignsCreated, 0),
      results
    };

  } catch (error) {
    console.error('Error running automated cross-promotion matching:', error);
    return { error: error.message };
  }
} 