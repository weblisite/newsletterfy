import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Get pending campaigns for publisher approval
export async function GET(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';

    // Get campaigns that match user's newsletter categories/niches
    const { data: campaigns, error } = await supabase
      .from('sponsored_ad_campaigns')
      .select(`
        *,
        brands (
          brand_name,
          company_name,
          logo_url,
          verified
        )
      `)
      .eq('approval_status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Filter campaigns based on user's newsletter interests/niches
    // For now, return all pending campaigns that don't have a publisher assigned
    const filteredCampaigns = campaigns.filter(campaign => 
      !campaign.publisher_id && campaign.status === 'pending'
    );

    return NextResponse.json({ campaigns: filteredCampaigns });
  } catch (error) {
    console.error('Error fetching campaigns for approval:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

// Approve or reject a campaign
export async function POST(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      campaign_id, 
      action, // 'approve' or 'reject'
      notes,
      proposed_rate 
    } = body;

    if (!campaign_id || !action) {
      return NextResponse.json(
        { error: 'Campaign ID and action are required' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be approve or reject' },
        { status: 400 }
      );
    }

    // Get the campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('sponsored_ad_campaigns')
      .select('*')
      .eq('id', campaign_id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Check if campaign is still pending
    if (campaign.approval_status !== 'pending') {
      return NextResponse.json(
        { error: 'Campaign has already been processed' },
        { status: 400 }
      );
    }

    // Update campaign based on action
    let updateData = {
      approval_status: action === 'approve' ? 'approved' : 'rejected',
      approval_notes: notes,
      approved_by: session.user.id,
      approved_at: new Date().toISOString()
    };

    if (action === 'approve') {
      updateData.publisher_id = session.user.id;
      updateData.status = 'approved';
      
      // If publisher proposed a different rate, update it
      if (proposed_rate && proposed_rate !== campaign.bid_amount) {
        updateData.bid_amount = proposed_rate;
      }
    } else {
      updateData.status = 'rejected';
    }

    const { data: updatedCampaign, error: updateError } = await supabase
      .from('sponsored_ad_campaigns')
      .update(updateData)
      .eq('id', campaign_id)
      .select()
      .single();

    if (updateError) throw updateError;

    // If approved, create campaign approval request record
    if (action === 'approve') {
      await supabase
        .from('campaign_approval_requests')
        .insert([{
          campaign_id,
          publisher_id: session.user.id,
          brand_id: campaign.brand_id,
          status: 'approved',
          final_rate: proposed_rate || campaign.bid_amount,
          response_message: notes,
          responded_at: new Date().toISOString()
        }]);

      // TODO: Send notification to brand about approval
      // TODO: Start ad placement scheduling
    }

    return NextResponse.json({ 
      campaign: updatedCampaign,
      message: `Campaign ${action}d successfully`
    });
  } catch (error) {
    console.error('Error processing campaign approval:', error);
    return NextResponse.json(
      { error: 'Failed to process campaign' },
      { status: 500 }
    );
  }
} 