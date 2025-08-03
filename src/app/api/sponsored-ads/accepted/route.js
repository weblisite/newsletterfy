import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Get accepted sponsored ad opportunities for the authenticated user
export async function GET(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get accepted opportunities with campaign details
    const { data: acceptedOpportunities, error } = await supabase
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
          end_date,
          brands (
            brand_name,
            logo_url
          )
        )
      `)
      .eq('user_id', session.user.id)
      .eq('status', 'accepted')
      .order('publication_date', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ acceptedOpportunities: acceptedOpportunities || [] });
  } catch (error) {
    console.error('Error fetching accepted opportunities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accepted opportunities' },
      { status: 500 }
    );
  }
}

// Update publication date for an accepted opportunity
export async function PUT(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { opportunityId, publicationDate } = body;

    if (!opportunityId || !publicationDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: updatedOpportunity, error } = await supabase
      .from('accepted_ad_opportunities')
      .update({ publication_date: publicationDate })
      .eq('id', opportunityId)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      updatedOpportunity 
    });
  } catch (error) {
    console.error('Error updating opportunity:', error);
    return NextResponse.json(
      { error: 'Failed to update opportunity' },
      { status: 500 }
    );
  }
} 