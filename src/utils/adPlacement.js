// Ad Placement System
// Automatically inserts sponsored ads into newsletter content based on campaigns

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Get active ad campaigns for a newsletter
 */
export async function getActiveCampaignsForNewsletter(publisherId, newsletterNiches = []) {
  try {
    const { data: campaigns, error } = await supabase
      .from('sponsored_ad_campaigns')
      .select(`
        *,
        brands (
          brand_name,
          logo_url,
          verified
        )
      `)
      .eq('status', 'active')
      .eq('publisher_id', publisherId)
      .lte('start_date', new Date().toISOString())
      .gte('end_date', new Date().toISOString())
      .gt('budget_total', 0);

    if (error) throw error;

    // Filter campaigns based on newsletter niches
    const relevantCampaigns = campaigns.filter(campaign => {
      const hasMatchingNiche = campaign.target_niches.some(niche => 
        newsletterNiches.includes(niche)
      );
      
      return hasMatchingNiche || campaign.target_niches.length === 0;
    });

    // Sort by priority and bid amount
    relevantCampaigns.sort((a, b) => {
      if (a.priority_level !== b.priority_level) {
        return b.priority_level - a.priority_level;
      }
      return b.bid_amount - a.bid_amount;
    });

    return relevantCampaigns;
  } catch (error) {
    console.error('Error fetching active campaigns:', error);
    return [];
  }
}

/**
 * Generate ad HTML for a campaign
 */
export function generateAdHTML(campaign, placement = 'middle') {
  const { ad_title, ad_description, call_to_action, landing_url, creative_urls, brands } = campaign;
  
  const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/ads/track-click?campaign_id=${campaign.id}&redirect=${encodeURIComponent(landing_url)}`;
  const impressionPixel = `${process.env.NEXT_PUBLIC_APP_URL}/api/ads/track-impression?campaign_id=${campaign.id}`;
  
  const primaryImage = creative_urls && creative_urls.length > 0 ? creative_urls[0] : null;
  const brandLogo = brands?.logo_url;

  return `
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; background-color: #f9fafb; font-family: Arial, sans-serif;">
      <div style="display: flex; align-items: center; margin-bottom: 12px; font-size: 12px; color: #6b7280;">
        ${brandLogo ? `<img src="${brandLogo}" alt="${brands.brand_name}" style="width: 20px; height: 20px; border-radius: 4px; margin-right: 8px;">` : ''}
        <span>Sponsored by ${brands?.brand_name || 'Our Partner'}</span>
      </div>
      
      ${primaryImage ? `
        <div style="margin-bottom: 16px;">
          <img src="${primaryImage}" alt="${ad_title}" style="width: 100%; max-width: 600px; height: auto; border-radius: 6px;">
        </div>
      ` : ''}
      
      <h3 style="color: #1f2937; font-size: 18px; font-weight: bold; margin: 0 0 8px 0; line-height: 1.4;">${ad_title}</h3>
      
      <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">${ad_description}</p>
      
      <a href="${trackingUrl}" style="display: inline-block; background-color: #3b82f6; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px;">${call_to_action}</a>
      
      <img src="${impressionPixel}" alt="" style="display: none;" width="1" height="1">
    </div>
  `;
}

/**
 * Insert ads into newsletter content
 */
export async function insertAdsIntoContent(content, publisherId, newsletterNiches = [], maxAds = 3) {
  try {
    const campaigns = await getActiveCampaignsForNewsletter(publisherId, newsletterNiches);
    
    if (campaigns.length === 0) {
      return content;
    }

    const selectedCampaigns = campaigns.slice(0, maxAds);
    const insertionPoints = findInsertionPoints(content, selectedCampaigns.length);

    let modifiedContent = content;
    let insertedCount = 0;

    for (let i = 0; i < insertionPoints.length && insertedCount < selectedCampaigns.length; i++) {
      const point = insertionPoints[i];
      const campaign = selectedCampaigns[insertedCount];
      
      const adHTML = generateAdHTML(campaign, point.placement);
      
      modifiedContent = 
        modifiedContent.slice(0, point.position) +
        adHTML +
        modifiedContent.slice(point.position);
      
      const adLength = adHTML.length;
      for (let j = i + 1; j < insertionPoints.length; j++) {
        insertionPoints[j].position += adLength;
      }
      
      insertedCount++;
      await recordAdPlacement(campaign.id, publisherId, point.placement);
    }

    return modifiedContent;
  } catch (error) {
    console.error('Error inserting ads into content:', error);
    return content;
  }
}

function findInsertionPoints(content, maxPoints = 3) {
  const points = [];
  const paragraphBreaks = [];
  
  const pTagMatches = content.matchAll(/<\/p>/gi);
  for (const match of pTagMatches) {
    paragraphBreaks.push({
      position: match.index + match[0].length,
      type: 'html'
    });
  }
  
  const lineBreakMatches = content.matchAll(/\n\s*\n/g);
  for (const match of lineBreakMatches) {
    paragraphBreaks.push({
      position: match.index + match[0].length,
      type: 'text'
    });
  }
  
  paragraphBreaks.sort((a, b) => a.position - b.position);
  
  const optimalPositions = [];
  
  if (maxPoints >= 1 && paragraphBreaks.length > 0) {
    optimalPositions.push({
      position: paragraphBreaks[0].position,
      placement: 'top'
    });
  }
  
  if (maxPoints >= 2) {
    const middleIndex = Math.floor(paragraphBreaks.length / 2);
    if (paragraphBreaks[middleIndex]) {
      optimalPositions.push({
        position: paragraphBreaks[middleIndex].position,
        placement: 'middle'
      });
    }
  }
  
  if (maxPoints >= 3) {
    const lastIndex = paragraphBreaks.length - 2;
    if (lastIndex >= 0 && paragraphBreaks[lastIndex]) {
      optimalPositions.push({
        position: paragraphBreaks[lastIndex].position,
        placement: 'bottom'
      });
    }
  }
  
  return optimalPositions.slice(0, maxPoints);
}

async function recordAdPlacement(campaignId, publisherId, placement) {
  try {
    await supabase
      .from('newsletter_ad_placements')
      .insert([{
        campaign_id: campaignId,
        newsletter_id: `newsletter_${publisherId}_${Date.now()}`,
        placement_position: placement,
        is_active: true
      }]);
  } catch (error) {
    console.error('Error recording ad placement:', error);
  }
}

export async function trackAdImpression(campaignId) {
  try {
    await supabase.rpc('increment_campaign_impressions', {
      campaign_id: campaignId
    });

    const today = new Date().toISOString().split('T')[0];
    
    await supabase
      .from('ad_placement_analytics')
      .upsert([{
        campaign_id: campaignId,
        tracking_date: today,
        impressions: 1
      }], {
        onConflict: 'campaign_id,tracking_date',
        update: ['impressions']
      });

  } catch (error) {
    console.error('Error tracking ad impression:', error);
  }
}

export async function trackAdClick(campaignId) {
  try {
    await supabase.rpc('increment_campaign_clicks', {
      campaign_id: campaignId
    });

    const today = new Date().toISOString().split('T')[0];
    
    await supabase
      .from('ad_placement_analytics')
      .upsert([{
        campaign_id: campaignId,
        tracking_date: today,
        clicks: 1,
        unique_clicks: 1
      }], {
        onConflict: 'campaign_id,tracking_date',
        update: ['clicks', 'unique_clicks']
      });

    const { data: campaign } = await supabase
      .from('sponsored_ad_campaigns')
      .select('bid_amount, spent, budget_total')
      .eq('id', campaignId)
      .single();

    if (campaign) {
      const newSpent = campaign.spent + campaign.bid_amount;
      
      await supabase
        .from('sponsored_ad_campaigns')
        .update({ 
          spent: newSpent,
          status: newSpent >= campaign.budget_total ? 'completed' : 'active'
        })
        .eq('id', campaignId);

      await processPublisherPayment(campaignId, campaign.bid_amount);
    }

  } catch (error) {
    console.error('Error tracking ad click:', error);
  }
}

async function processPublisherPayment(campaignId, clickAmount) {
  try {
    const { data: campaign } = await supabase
      .from('sponsored_ad_campaigns')
      .select('publisher_id, brand_id')
      .eq('id', campaignId)
      .single();

    if (!campaign || !campaign.publisher_id) return;

    const platformFeeRate = 0.20;
    const platformFee = clickAmount * platformFeeRate;
    const publisherEarning = clickAmount - platformFee;

    await supabase
      .from('publisher_ad_earnings')
      .insert([{
        publisher_id: campaign.publisher_id,
        campaign_id: campaignId,
        brand_id: campaign.brand_id,
        gross_amount: clickAmount,
        platform_fee_rate: platformFeeRate,
        platform_fee_amount: platformFee,
        net_amount: publisherEarning,
        impressions: 0,
        clicks: 1,
        earning_date: new Date().toISOString().split('T')[0],
        status: 'confirmed'
      }]);

  } catch (error) {
    console.error('Error processing publisher payment:', error);
  }
} 