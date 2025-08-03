import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET ads
export async function GET(request) {
  try {
    // Get brand ID from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new Error('Authentication required');

    const brandId = session?.user?.id;
    if (!brandId) throw new Error('Brand ID not found');

    // Fetch ads from database
    const { data: ads, error: adsError } = await supabase
      .from('brand_ads')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false });

    if (adsError) throw adsError;

    // Fetch campaigns
    const { data: campaigns, error: campaignsError } = await supabase
      .from('brand_campaigns')
      .select(`
        *,
        metrics:brand_campaign_metrics(*)
      `)
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false });

    if (campaignsError) throw campaignsError;

    // Calculate campaign stats
    const campaignStats = {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter(c => c.status === 'active').length,
      totalSpent: campaigns.reduce((sum, c) => sum + (c.spent || 0), 0),
      averageCTR: campaigns.length > 0
        ? campaigns.reduce((sum, c) => sum + (c.metrics?.ctr || 0), 0) / campaigns.length
        : 0,
    };

    // Format campaigns data
    const formattedCampaigns = campaigns.map(campaign => ({
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      budget: campaign.budget,
      spent: campaign.spent,
      startDate: campaign.start_date,
      endDate: campaign.end_date,
      targetNiches: campaign.target_niches,
      metrics: {
        impressions: campaign.metrics?.impressions || 0,
        clicks: campaign.metrics?.clicks || 0,
        ctr: campaign.metrics?.ctr || 0,
        averageCPC: campaign.metrics?.average_cpc || 0,
        conversions: campaign.metrics?.conversions || 0,
        conversionRate: campaign.metrics?.conversion_rate || 0,
      },
      newsletters: campaign.newsletters || [],
    }));

    return NextResponse.json({
      ads,
      campaigns: formattedCampaigns,
      campaignStats,
    });
  } catch (error) {
    console.error('Ads API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch ads data' },
      { status: error.message === 'Authentication required' ? 401 : 500 }
    );
  }
}

// POST create ad
export async function POST(request) {
  try {
    const formData = await request.formData();
    
    // Get brand ID from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new Error('Authentication required');

    const brandId = session?.user?.id;
    if (!brandId) throw new Error('Brand ID not found');

    // Upload image to storage if provided
    let imageUrl = null;
    const image = formData.get('image');
    if (image) {
      const { data: imageData, error: imageError } = await supabase.storage
        .from('ad-images')
        .upload(`${brandId}/${Date.now()}-${image.name}`, image);

      if (imageError) throw imageError;
      imageUrl = imageData.path;
    }

    // Create ad in database
    const { data: ad, error: adError } = await supabase
      .from('brand_ads')
      .insert({
        brand_id: brandId,
        title: formData.get('title'),
        content: formData.get('content'),
        image_url: imageUrl,
        target_url: formData.get('targetUrl'),
        cpc: parseFloat(formData.get('cpc')),
        cpm: parseFloat(formData.get('cpm')),
        budget: parseFloat(formData.get('budget')),
        start_date: formData.get('startDate'),
        end_date: formData.get('endDate'),
        target_niches: JSON.parse(formData.get('targetNiches')),
        target_industries: JSON.parse(formData.get('targetIndustries')),
        status: 'pending',
      })
      .select()
      .single();

    if (adError) throw adError;

    return NextResponse.json(ad);
  } catch (error) {
    console.error('Create Ad API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create ad' },
      { status: error.message === 'Authentication required' ? 401 : 500 }
    );
  }
}

// PUT update campaign status
export async function PUT(request) {
  try {
    const { campaignId, status } = await request.json();

    // Get brand ID from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new Error('Authentication required');

    const brandId = session?.user?.id;
    if (!brandId) throw new Error('Brand ID not found');

    // Update campaign status
    const { error: updateError } = await supabase
      .from('brand_campaigns')
      .update({ status })
      .eq('id', campaignId)
      .eq('brand_id', brandId);

    if (updateError) throw updateError;

    return NextResponse.json({ message: 'Campaign status updated successfully' });
  } catch (error) {
    console.error('Update Campaign Status API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update campaign status' },
      { status: error.message === 'Authentication required' ? 401 : 500 }
    );
  }
} 