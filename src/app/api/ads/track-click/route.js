import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(req.url);
    const opportunityId = searchParams.get('opportunity_id');
    const campaignId = searchParams.get('campaign_id');
    const redirect = searchParams.get('redirect');

    if (!redirect) {
      return NextResponse.json({ error: 'Redirect URL is required' }, { status: 400 });
    }

    // Track the click
    if (opportunityId) {
      // Track click for accepted opportunity
      await supabase
        .from('ad_clicks')
        .insert([{
          opportunity_id: opportunityId,
          clicked_at: new Date().toISOString(),
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
          user_agent: req.headers.get('user-agent') || 'unknown'
        }]);
    } else if (campaignId) {
      // Track click for general campaign
      await supabase
        .from('ad_clicks')
        .insert([{
          campaign_id: campaignId,
          clicked_at: new Date().toISOString(),
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
          user_agent: req.headers.get('user-agent') || 'unknown'
        }]);
    }

    // Redirect to the target URL
    return NextResponse.redirect(redirect);
  } catch (error) {
    console.error('Error tracking click:', error);
    // Still redirect even if tracking fails
    const redirect = new URL(req.url).searchParams.get('redirect');
    if (redirect) {
      return NextResponse.redirect(redirect);
    }
    return NextResponse.json({ error: 'Failed to track click' }, { status: 500 });
  }
} 