import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Get publisher ad earnings
export async function GET(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const status = searchParams.get('status'); // 'pending', 'confirmed', 'paid'

    let query = supabase
      .from('publisher_ad_earnings')
      .select(`
        *,
        sponsored_ad_campaigns (
          campaign_name,
          ad_title,
          brands (
            brand_name,
            logo_url
          )
        )
      `)
      .eq('publisher_id', session.user.id)
      .order('earning_date', { ascending: false });

    // Apply filters
    if (startDate) {
      query = query.gte('earning_date', startDate);
    }
    if (endDate) {
      query = query.lte('earning_date', endDate);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: earnings, error } = await query;

    if (error) throw error;

    // Calculate summary statistics
    const totalEarnings = earnings.reduce((sum, earning) => sum + earning.net_amount, 0);
    const totalGross = earnings.reduce((sum, earning) => sum + earning.gross_amount, 0);
    const totalFees = earnings.reduce((sum, earning) => sum + earning.platform_fee_amount, 0);
    const totalClicks = earnings.reduce((sum, earning) => sum + earning.clicks, 0);
    const totalImpressions = earnings.reduce((sum, earning) => sum + earning.impressions, 0);
    
    const confirmedEarnings = earnings.filter(e => e.status === 'confirmed');
    const pendingEarnings = earnings.filter(e => e.status === 'pending');
    const paidEarnings = earnings.filter(e => e.status === 'paid');

    const summary = {
      totalEarnings,
      totalGross,
      totalFees,
      totalClicks,
      totalImpressions,
      averageEarningPerClick: totalClicks > 0 ? totalEarnings / totalClicks : 0,
      confirmedAmount: confirmedEarnings.reduce((sum, earning) => sum + earning.net_amount, 0),
      pendingAmount: pendingEarnings.reduce((sum, earning) => sum + earning.net_amount, 0),
      paidAmount: paidEarnings.reduce((sum, earning) => sum + earning.net_amount, 0),
      earningsCount: earnings.length
    };

    return NextResponse.json({ 
      earnings, 
      summary 
    });
  } catch (error) {
    console.error('Error fetching publisher ad earnings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ad earnings' },
      { status: 500 }
    );
  }
} 