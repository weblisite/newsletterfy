import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// POST /api/monetization/affiliate-links/[code]/track
export async function POST(req, { params }) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { code } = params;
    const { type } = await req.json(); // 'click' or 'conversion'

    // Get the affiliate link
    const { data: affiliateLink, error: fetchError } = await supabase
      .from('affiliate_links')
      .select('*')
      .eq('code', code)
      .single();

    if (fetchError) throw fetchError;
    if (!affiliateLink) {
      return NextResponse.json({ error: 'Affiliate link not found' }, { status: 404 });
    }

    // Update the metrics based on the type
    const updates = {
      clicks: type === 'click' ? affiliateLink.clicks + 1 : affiliateLink.clicks,
      conversions: type === 'conversion' ? affiliateLink.conversions + 1 : affiliateLink.conversions,
      revenue: type === 'conversion' ? affiliateLink.revenue + 50 : affiliateLink.revenue, // Assuming $50 per conversion
    };

    const { error: updateError } = await supabase
      .from('affiliate_links')
      .update(updates)
      .eq('id', affiliateLink.id);

    if (updateError) throw updateError;

    // If it's a conversion, create a referral record
    if (type === 'conversion') {
      const { error: referralError } = await supabase
        .from('affiliate_referrals')
        .insert([{
          user_id: affiliateLink.user_id,
          affiliate_link_id: affiliateLink.id,
          amount: 50, // Base amount for the subscription
          commission: 25, // 50% commission
          status: 'pending',
          plan: 'Pro', // Default plan
        }]);

      if (referralError) throw referralError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking affiliate link:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 