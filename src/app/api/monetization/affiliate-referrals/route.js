import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// GET /api/monetization/affiliate-referrals
export async function GET(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all referrals for the user with referred user details
    const { data: referrals, error } = await supabase
      .from('affiliate_referrals')
      .select(`
        *,
        referred_user:users!referred_user_id (
          email,
          full_name
        )
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Format the referrals data
    const formattedReferrals = referrals.map(referral => ({
      id: referral.id,
      referredUser: referral.referred_user?.full_name || referral.referred_user?.email || 'Anonymous',
      amount: referral.amount,
      commission: referral.commission,
      status: referral.status,
      plan: referral.plan,
      date: referral.created_at
    }));

    return NextResponse.json({ referrals: formattedReferrals });
  } catch (error) {
    console.error('Error fetching affiliate referrals:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/monetization/affiliate-referrals
export async function PATCH(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { referralId, status } = await req.json();

    const { error } = await supabase
      .from('affiliate_referrals')
      .update({ status })
      .eq('id', referralId)
      .eq('user_id', session.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating affiliate referral:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 