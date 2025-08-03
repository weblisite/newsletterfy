import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Get all campaigns for the brand
export async function GET(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get brand ID for the user
    const { data: brand } = await supabase
      .from('brands')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (!brand) {
      return NextResponse.json({ error: 'Brand profile not found' }, { status: 404 });
    }

    const { data: campaigns, error } = await supabase
      .from('sponsored_ad_campaigns')
      .select('*')
      .eq('brand_id', brand.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

// Create a new campaign
export async function POST(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get brand ID for the user
    const { data: brand } = await supabase
      .from('brands')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (!brand) {
      return NextResponse.json({ error: 'Brand profile not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      campaign_name,
      campaign_type,
      ad_title,
      ad_description,
      call_to_action,
      landing_url,
      creative_urls,
      target_niches,
      target_demographics,
      target_interests,
      budget_total,
      budget_daily,
      bid_type,
      bid_amount,
      start_date,
      end_date,
      frequency_cap,
      priority_level
    } = body;

    // Validate required fields
    if (!campaign_name || !ad_title || !ad_description || !landing_url || !budget_total || !bid_amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if brand has sufficient funds
    const { data: funds } = await supabase
      .from('brand_funds')
      .select('balance')
      .eq('brand_id', brand.id)
      .single();

    if (!funds || funds.balance < parseFloat(budget_total)) {
      return NextResponse.json(
        { error: 'Insufficient funds. Please add money to your account.' },
        { status: 400 }
      );
    }

    // Create the campaign
    const { data: campaign, error } = await supabase
      .from('sponsored_ad_campaigns')
      .insert([{
        brand_id: brand.id,
        campaign_name,
        campaign_type: campaign_type || 'newsletter_placement',
        ad_title,
        ad_description,
        call_to_action: call_to_action || 'Learn More',
        landing_url,
        creative_urls: creative_urls || [],
        target_niches: target_niches || [],
        target_demographics: target_demographics || {},
        target_interests: target_interests || [],
        budget_total: parseFloat(budget_total),
        budget_daily: budget_daily ? parseFloat(budget_daily) : null,
        bid_type: bid_type || 'cpm',
        bid_amount: parseFloat(bid_amount),
        start_date,
        end_date,
        frequency_cap: frequency_cap || 3,
        priority_level: priority_level || 1,
        status: 'pending',
        approval_status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}

// Update campaign
export async function PATCH(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...updateData } = body;

    // Get brand ID for the user
    const { data: brand } = await supabase
      .from('brands')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (!brand) {
      return NextResponse.json({ error: 'Brand profile not found' }, { status: 404 });
    }

    const { data: campaign, error } = await supabase
      .from('sponsored_ad_campaigns')
      .update(updateData)
      .eq('id', id)
      .eq('brand_id', brand.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    );
  }
} 