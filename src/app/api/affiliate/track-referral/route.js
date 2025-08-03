import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const supabase = createClientComponentClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { affiliate_code, subscription_id, subscription_amount, plan_name } = await request.json();

    if (!affiliate_code || !subscription_id || !subscription_amount) {
      return NextResponse.json({ 
        error: 'Missing required fields: affiliate_code, subscription_id, subscription_amount' 
      }, { status: 400 });
    }

    // Find the affiliate link by code
    const { data: affiliateLink, error: linkError } = await supabase
      .from('affiliate_links')
      .select('id, user_id, code')
      .eq('code', affiliate_code)
      .single();

    if (linkError || !affiliateLink) {
      return NextResponse.json({ error: 'Invalid affiliate code' }, { status: 400 });
    }

    // Check if referral already exists for this subscription
    const { data: existingReferral } = await supabase
      .from('affiliate_referrals')
      .select('id')
      .eq('subscription_id', subscription_id)
      .single();

    if (existingReferral) {
      return NextResponse.json({ 
        message: 'Referral already tracked for this subscription' 
      }, { status: 200 });
    }

    // Calculate commission (20% of subscription amount)
    const commission = subscription_amount * 0.20;

    // Create affiliate referral record
    const { data: referral, error: referralError } = await supabase
      .from('affiliate_referrals')
      .insert({
        user_id: affiliateLink.user_id,
        referred_user: session.user.id,
        plan: plan_name || 'Platform Subscription',
        amount: subscription_amount,
        commission: commission,
        status: 'active',
        date: new Date().toISOString(),
        link_id: affiliateLink.id,
        subscription_id: subscription_id,
        monthly_commission: commission,
        is_recurring: true,
        subscription_status: 'active',
        total_commission_paid: 0
      })
      .select()
      .single();

    if (referralError) {
      console.error('Error creating affiliate referral:', referralError);
      return NextResponse.json({ 
        error: 'Failed to track referral' 
      }, { status: 500 });
    }

    // Update affiliate link statistics
    await supabase
      .from('affiliate_links')
      .update({
        conversions: affiliateLink.conversions + 1,
        revenue: affiliateLink.revenue + commission
      })
      .eq('id', affiliateLink.id);

    // Create initial commission payment record
    const currentDate = new Date();
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    await supabase
      .from('affiliate_commission_payments')
      .insert({
        referral_id: referral.id,
        affiliate_user_id: affiliateLink.user_id,
        subscription_id: subscription_id,
        commission_amount: commission,
        subscription_amount: subscription_amount,
        commission_rate: 0.20,
        payment_period_start: monthStart.toISOString().split('T')[0],
        payment_period_end: monthEnd.toISOString().split('T')[0],
        status: 'pending'
      });

    return NextResponse.json({
      success: true,
      referral_id: referral.id,
      commission: commission,
      message: 'Affiliate referral tracked successfully'
    });

  } catch (error) {
    console.error('Error tracking affiliate referral:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 