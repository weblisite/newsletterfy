import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Generate ad content for newsletter inclusion
export async function POST(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { opportunityId, placement = 'middle' } = body;

    if (!opportunityId) {
      return NextResponse.json({ error: 'Opportunity ID is required' }, { status: 400 });
    }

    // Mock data for testing - replace with database query later
    const mockOpportunities = {
      'opp_1': {
        id: 'opp_1',
        sponsored_ad_campaigns: {
          ad_title: 'TechCorp Software Launch Campaign',
          ad_description: 'Discover the latest productivity software that\'s revolutionizing how teams collaborate. Get 30% off your first year with our exclusive newsletter subscriber discount.',
          call_to_action: 'Get 30% Off Now',
          landing_url: 'https://techcorp.example.com/newsletter-exclusive',
          creative_urls: ['https://example.com/ad-image-1.jpg'],
          bid_type: 'cpc',
          bid_amount: 2.50,
          brands: {
            brand_name: 'TechCorp',
            logo_url: 'https://example.com/techcorp-logo.png'
          }
        }
      },
      'opp_2': {
        id: 'opp_2',
        sponsored_ad_campaigns: {
          ad_title: 'MarketingPro Course Promotion',
          ad_description: 'Master digital marketing with our comprehensive online course. Join 10,000+ successful marketers who transformed their careers with our proven methodology.',
          call_to_action: 'Start Learning Today',
          landing_url: 'https://marketingpro.example.com/course',
          creative_urls: ['https://example.com/ad-image-2.jpg'],
          bid_type: 'cpm',
          bid_amount: 8.00,
          brands: {
            brand_name: 'MarketingPro Academy',
            logo_url: 'https://example.com/marketingpro-logo.png'
          }
        }
      },
      'opp_3': {
        id: 'opp_3',
        sponsored_ad_campaigns: {
          ad_title: 'FinanceApp Investment Platform',
          ad_description: 'Take control of your financial future with our AI-powered investment platform. No fees for the first 6 months for newsletter subscribers.',
          call_to_action: 'Start Investing Free',
          landing_url: 'https://financeapp.example.com/signup',
          creative_urls: [],
          bid_type: 'cpc',
          bid_amount: 3.75,
          brands: {
            brand_name: 'FinanceApp',
            logo_url: 'https://example.com/financeapp-logo.png'
          }
        }
      }
    };

    const opportunity = mockOpportunities[opportunityId];

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    /* Original database code - uncomment when tables are ready
    // Get the accepted opportunity with campaign details
    const { data: opportunity, error } = await supabase
      .from('accepted_ad_opportunities')
      .select(`
        *,
        sponsored_ad_campaigns (
          ad_title,
          ad_description,
          call_to_action,
          landing_url,
          creative_urls,
          bid_type,
          bid_amount,
          brands (
            brand_name,
            logo_url
          )
        )
      `)
      .eq('id', opportunityId)
      .eq('user_id', session.user.id)
      .single();

    if (error || !opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }
    */

    const campaign = opportunity.sponsored_ad_campaigns;
    const brand = campaign.brands;

    // Generate tracking URLs
    const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/ads/track-click?opportunity_id=${opportunityId}&redirect=${encodeURIComponent(campaign.landing_url)}`;
    const impressionPixel = `${process.env.NEXT_PUBLIC_APP_URL}/api/ads/track-impression?opportunity_id=${opportunityId}`;

    // Generate HTML content for the ad (clean version without revenue info)
    const adHtml = generateAdHTML(campaign, brand, trackingUrl, impressionPixel, placement);

    return NextResponse.json({ 
      success: true,
      adContent: {
        html: adHtml, // Clean HTML without revenue info
        placement: placement,
        campaign: {
          title: campaign.ad_title,
          description: campaign.ad_description,
          brand: brand.brand_name,
          callToAction: campaign.call_to_action
        }
      }
    });
  } catch (error) {
    console.error('Error generating ad content:', error);
    return NextResponse.json(
      { error: 'Failed to generate ad content' },
      { status: 500 }
    );
  }
}

function generateAdHTML(campaign, brand, trackingUrl, impressionPixel, placement) {
  const primaryImage = campaign.creative_urls && campaign.creative_urls.length > 0 ? campaign.creative_urls[0] : null;
  const brandLogo = brand?.logo_url;

  const adHtml = `
    <div style="border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px; margin: 24px 0; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <!-- Sponsored Label -->
      <div style="display: flex; align-items: center; margin-bottom: 16px; padding: 8px 12px; background-color: #fef3c7; border-radius: 6px; border-left: 4px solid #f59e0b;">
        ${brandLogo ? `<img src="${brandLogo}" alt="${brand.brand_name}" style="width: 24px; height: 24px; border-radius: 4px; margin-right: 10px; object-fit: cover;">` : ''}
        <span style="font-size: 12px; font-weight: 600; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px;">Sponsored by ${brand?.brand_name || 'Our Partner'}</span>
      </div>
      
      ${primaryImage ? `
        <div style="margin-bottom: 20px; text-align: center;">
          <img src="${primaryImage}" alt="${campaign.ad_title}" style="width: 100%; max-width: 500px; height: auto; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
        </div>
      ` : ''}
      
      <!-- Ad Content -->
      <h3 style="color: #1f2937; font-size: 22px; font-weight: 700; margin: 0 0 12px 0; line-height: 1.3;">${campaign.ad_title}</h3>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">${campaign.ad_description}</p>
      
      <!-- Call to Action Button -->
      <div style="text-align: left;">
        <a href="${trackingUrl}" 
           style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px; transition: all 0.3s ease; border: none; cursor: pointer; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.5);"
           onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 12px -1px rgba(59, 130, 246, 0.6)';"
           onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 6px -1px rgba(59, 130, 246, 0.5)';">
          ${campaign.call_to_action || 'Learn More'} →
        </a>
      </div>
      
      <!-- Tracking Pixel -->
      <img src="${impressionPixel}" alt="" style="display: none;" width="1" height="1">
    </div>
  `;

  return adHtml;
} 