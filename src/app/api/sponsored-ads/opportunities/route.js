import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Get available sponsored ad opportunities for the authenticated user
export async function GET(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, return mock data until database tables are set up
    const mockOpportunities = [
      {
        id: 'opp_1',
        title: 'TechCorp Software Launch Campaign',
        brand_name: 'TechCorp',
        ad_content: 'Discover the latest productivity software that\'s revolutionizing how teams collaborate. Get 30% off your first year with our exclusive newsletter subscriber discount.',
        pricing_model: 'cpc',
        cost_per_click: 2.50,
        cost_per_mille: null,
        target_audience: 'Tech professionals, Software developers',
        target_impressions: 5000,
        call_to_action: 'Get 30% Off Now',
        landing_url: 'https://techcorp.example.com/newsletter-exclusive',
        end_date: '2025-12-31',
        creative_urls: ['https://example.com/ad-image-1.jpg']
      },
      {
        id: 'opp_2',
        title: 'MarketingPro Course Promotion',
        brand_name: 'MarketingPro Academy',
        ad_content: 'Master digital marketing with our comprehensive online course. Join 10,000+ successful marketers who transformed their careers with our proven methodology.',
        pricing_model: 'cpm',
        cost_per_click: null,
        cost_per_mille: 8.00,
        target_audience: 'Marketing professionals, Entrepreneurs',
        target_impressions: 10000,
        call_to_action: 'Start Learning Today',
        landing_url: 'https://marketingpro.example.com/course',
        end_date: '2025-12-31',
        creative_urls: ['https://example.com/ad-image-2.jpg']
      },
      {
        id: 'opp_3',
        title: 'FinanceApp Investment Platform',
        brand_name: 'FinanceApp',
        ad_content: 'Take control of your financial future with our AI-powered investment platform. No fees for the first 6 months for newsletter subscribers.',
        pricing_model: 'cpc',
        cost_per_click: 3.75,
        cost_per_mille: null,
        target_audience: 'Finance professionals, Investors',
        target_impressions: 3000,
        call_to_action: 'Start Investing Free',
        landing_url: 'https://financeapp.example.com/signup',
        end_date: '2025-12-31',
        creative_urls: []
      }
    ];

    /* Original database code - uncomment when tables are ready
    // Get user's newsletter info for matching
    const { data: userProfiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('newsletter_niche, subscriber_count, demographics')
      .eq('user_id', session.user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json({ opportunities: [] });
    }

    // Get available sponsored ad campaigns that match user's criteria
    const { data: opportunities, error } = await supabase
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
      .eq('approval_status', 'approved')
      .lte('start_date', new Date().toISOString())
      .gte('end_date', new Date().toISOString())
      .gt('budget_total', 0);

    if (error) throw error;

    // Filter opportunities based on user's newsletter criteria
    const relevantOpportunities = opportunities.filter(campaign => {
      // Check if campaign targets match user's newsletter niche
      const matchesNiche = campaign.target_niches.length === 0 || 
        campaign.target_niches.some(niche => userProfiles.newsletter_niche?.includes(niche));
      
      // Check if user has minimum subscriber count if specified
      const meetsSubscriberRequirement = !campaign.min_subscribers || 
        userProfiles.subscriber_count >= campaign.min_subscribers;
      
      return matchesNiche && meetsSubscriberRequirement;
    });

    // Transform to opportunity format
    const formattedOpportunities = relevantOpportunities.map(campaign => ({
      id: campaign.id,
      title: campaign.ad_title,
      brand_name: campaign.brands?.brand_name,
      ad_content: campaign.ad_description,
      pricing_model: campaign.bid_type, // 'cpc' or 'cpm'
      cost_per_click: campaign.bid_type === 'cpc' ? campaign.bid_amount : null,
      cost_per_mille: campaign.bid_type === 'cpm' ? campaign.bid_amount : null,
      target_audience: campaign.target_niches.join(', '),
      target_impressions: campaign.budget_total / campaign.bid_amount * (campaign.bid_type === 'cpm' ? 1000 : 100),
      call_to_action: campaign.call_to_action,
      landing_url: campaign.landing_url,
      end_date: campaign.end_date,
      creative_urls: campaign.creative_urls
    }));
    */

    return NextResponse.json({ opportunities: mockOpportunities });
  } catch (error) {
    console.error('Error fetching sponsored ad opportunities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch opportunities' },
      { status: 500 }
    );
  }
}

// Accept or decline a sponsored ad opportunity
export async function PUT(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { opportunityId, action, publicationDate, newsletterContent } = body;

    if (!opportunityId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (action === 'accept') {
      if (!publicationDate) {
        return NextResponse.json({ error: 'Publication date is required when accepting' }, { status: 400 });
      }

      // For now, just return success - later implement database storage
      const mockAcceptedOpportunity = {
        id: `accepted_${opportunityId}`,
        user_id: session.user.id,
        campaign_id: opportunityId,
        publication_date: publicationDate,
        status: 'accepted',
        accepted_at: new Date().toISOString()
      };

      /* Original database code - uncomment when tables are ready
      // Get the campaign details
      const { data: campaign, error: campaignError } = await supabase
        .from('sponsored_ad_campaigns')
        .select('*')
        .eq('id', opportunityId)
        .single();

      if (campaignError || !campaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      }

      // Check if publication date is valid (before campaign end date)
      if (new Date(publicationDate) > new Date(campaign.end_date)) {
        return NextResponse.json({ 
          error: 'Publication date cannot be after campaign end date' 
        }, { status: 400 });
      }

      // Create accepted opportunity record
      const { data: acceptedOpportunity, error: insertError } = await supabase
        .from('accepted_ad_opportunities')
        .insert([{
          user_id: session.user.id,
          campaign_id: opportunityId,
          publication_date: publicationDate,
          status: 'accepted',
          accepted_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // If newsletter content is provided, save it as a draft
      if (newsletterContent) {
        const { error: draftError } = await supabase
          .from('newsletter_drafts')
          .insert([{
            user_id: session.user.id,
            ad_opportunity_id: acceptedOpportunity.id,
            content: newsletterContent,
            scheduled_date: publicationDate,
            status: 'draft'
          }]);

        if (draftError) {
          console.error('Error saving newsletter draft:', draftError);
        }
      }
      */

      return NextResponse.json({ 
        success: true, 
        message: 'Opportunity accepted successfully',
        acceptedOpportunity: mockAcceptedOpportunity 
      });
    } else if (action === 'decline') {
      // For now, just return success - later implement database storage
      /* Original database code - uncomment when tables are ready
      // Record the decline
      const { error: declineError } = await supabase
        .from('declined_ad_opportunities')
        .insert([{
          user_id: session.user.id,
          campaign_id: opportunityId,
          declined_at: new Date().toISOString()
        }]);

      if (declineError) throw declineError;
      */

      return NextResponse.json({ 
        success: true, 
        message: 'Opportunity declined' 
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error processing opportunity action:', error);
    return NextResponse.json(
      { error: 'Failed to process opportunity' },
      { status: 500 }
    );
  }
} 