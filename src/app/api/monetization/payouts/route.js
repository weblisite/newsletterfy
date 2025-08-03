import { NextResponse } from 'next/server';
import { checkAuth, getSupabaseClient } from '@/lib/auth-utils';

// Get payout history and current balance for the authenticated user
export async function GET(req) {
  try {
    const { session, error: authError } = await checkAuth();
    const supabase = getSupabaseClient();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters for date range and status
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const status = searchParams.get('status');

    // Build query for payouts
    let query = supabase
      .from('payouts')
      .select('*')
      .eq('user_id', session.user.id);

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    if (status) {
      query = query.eq('status', status);
    }

    // Order by created_at in descending order
    query = query.order('created_at', { ascending: false });

    const { data: payouts, error: payoutsError } = await query;

    if (payoutsError) throw payoutsError;

    // Calculate current balance from all monetization streams
    const [
      sponsoredAds,
      crossPromotions,
      subscriptionTiers,
      donations,
      digitalProducts,
      affiliateLinks,
      platformFees,
      completedPayouts
    ] = await Promise.all([
      // Get total revenue from each stream
      supabase
        .from('sponsored_ads')
        .select('revenue')
        .eq('user_id', session.user.id),
      supabase
        .from('cross_promotions')
        .select('revenue')
        .eq('user_id', session.user.id),
      supabase
        .from('subscription_tiers')
        .select('revenue')
        .eq('user_id', session.user.id),
      supabase
        .from('donations')
        .select('amount')
        .eq('user_id', session.user.id),
      supabase
        .from('digital_products')
        .select('revenue')
        .eq('user_id', session.user.id),
      supabase
        .from('affiliate_links')
        .select('revenue')
        .eq('user_id', session.user.id),
      // Get platform fees configuration
      supabase
        .from('platform_fees')
        .select('*')
        .eq('user_id', session.user.id)
        .single(),
      // Get total of completed payouts
      supabase
        .from('payouts')
        .select('amount')
        .eq('user_id', session.user.id)
        .eq('status', 'completed')
    ]);

    // Calculate total revenue
    const totalRevenue = {
      sponsored_ads: sponsoredAds.data?.reduce((sum, item) => sum + (item.revenue || 0), 0) || 0,
      cross_promotions: crossPromotions.data?.reduce((sum, item) => sum + (item.revenue || 0), 0) || 0,
      subscriptions: subscriptionTiers.data?.reduce((sum, item) => sum + (item.revenue || 0), 0) || 0,
      donations: donations.data?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0,
      digital_products: digitalProducts.data?.reduce((sum, item) => sum + (item.revenue || 0), 0) || 0,
      affiliate_program: affiliateLinks.data?.reduce((sum, item) => sum + (item.revenue || 0), 0) || 0
    };

    // Calculate platform fees
    const fees = platformFees.data || {
      sponsored_ads_fee: 20,
      cross_promotions_fee: 20,
      subscription_tiers_fee: 20,
      donations_fee: 20,
      digital_products_fee: 20,
      affiliate_program_fee: 20
    };

    const platformFeeAmount = 
      (totalRevenue.sponsored_ads * fees.sponsored_ads_fee / 100) +
      (totalRevenue.cross_promotions * fees.cross_promotions_fee / 100) +
      (totalRevenue.subscriptions * fees.subscription_tiers_fee / 100) +
      (totalRevenue.donations * fees.donations_fee / 100) +
      (totalRevenue.digital_products * fees.digital_products_fee / 100) +
      (totalRevenue.affiliate_program * fees.affiliate_program_fee / 100);

    // Calculate total paid out
    const totalPaidOut = completedPayouts.data?.reduce((sum, payout) => sum + (payout.amount || 0), 0) || 0;

    // Calculate current balance
    const totalEarnings = Object.values(totalRevenue).reduce((sum, val) => sum + val, 0);
    const currentBalance = totalEarnings - platformFeeAmount - totalPaidOut;

    return NextResponse.json({
      payouts,
      current_balance: currentBalance,
      total_earnings: totalEarnings,
      platform_fees: platformFeeAmount,
      total_paid_out: totalPaidOut,
      payout_config: platformFees.data
    });
  } catch (error) {
    console.error('Error fetching payout information:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payout information' },
      { status: 500 }
    );
  }
}

// Request a new payout
export async function POST(req) {
  try {
    const { session, error: authError } = await checkAuth();
    const supabase = getSupabaseClient();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { amount } = body;

    // Get platform fees configuration
    const { data: platformFees, error: feesError } = await supabase
      .from('platform_fees')
      .select('payout_threshold, payout_method, payment_details')
      .eq('user_id', session.user.id)
      .single();

    if (feesError && feesError.code !== 'PGRST116') throw feesError;

    const payout_threshold = platformFees?.payout_threshold || 100;

    if (amount < payout_threshold) {
      return NextResponse.json(
        { error: `Minimum payout amount is ${payout_threshold}` },
        { status: 400 }
      );
    }

    if (!platformFees?.payment_details) {
      return NextResponse.json(
        { error: 'Payment details not configured' },
        { status: 400 }
      );
    }

    // Verify available balance
    const { data: currentBalance } = await supabase
      .rpc('calculate_available_balance', { user_id: session.user.id });

    if (amount > currentBalance) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Create payout request
    const { data, error } = await supabase
      .from('payouts')
      .insert([
        {
          user_id: session.user.id,
          amount,
          status: 'pending',
          payout_method: platformFees.payout_method,
          payment_details: platformFees.payment_details
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error requesting payout:', error);
    return NextResponse.json(
      { error: 'Failed to request payout' },
      { status: 500 }
    );
  }
}

// Cancel a pending payout
export async function DELETE(req) {
  try {
    const { session, error: authError } = await checkAuth();
    const supabase = getSupabaseClient();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Payout ID is required' },
        { status: 400 }
      );
    }

    // Verify payout belongs to user and is pending
    const { data: payout, error: getError } = await supabase
      .from('payouts')
      .select('status')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (getError) throw getError;

    if (!payout) {
      return NextResponse.json(
        { error: 'Payout not found' },
        { status: 404 }
      );
    }

    if (payout.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending payouts can be cancelled' },
        { status: 400 }
      );
    }

    // Cancel the payout
    const { error } = await supabase
      .from('payouts')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) throw error;

    return NextResponse.json({ message: 'Payout cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling payout:', error);
    return NextResponse.json(
      { error: 'Failed to cancel payout' },
      { status: 500 }
    );
  }
} 