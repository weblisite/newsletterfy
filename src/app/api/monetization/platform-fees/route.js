import { NextResponse } from 'next/server';
import { checkAuth, getSupabaseClient } from '@/lib/auth-utils';

// Get platform fees configuration for the authenticated user
export async function GET(req) {
  try {
    const { session, error: authError } = await checkAuth();
    const supabase = getSupabaseClient();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('platform_fees')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw error;
    }

    // If no configuration exists, return default values
    if (!data) {
      return NextResponse.json({
        sponsored_ads_fee: 20, // 20% platform fee
        cross_promotions_fee: 20,
        subscription_tiers_fee: 20,
        donations_fee: 20,
        digital_products_fee: 20,
        affiliate_program_fee: 20,
        payout_threshold: 100, // Minimum amount for payout
        payout_method: 'bank_transfer',
        payment_details: null
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching platform fees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch platform fees' },
      { status: 500 }
    );
  }
}

// Update platform fees configuration
export async function PUT(req) {
  try {
    const { session, error: authError } = await checkAuth();
    const supabase = getSupabaseClient();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      sponsored_ads_fee,
      cross_promotions_fee,
      subscription_tiers_fee,
      donations_fee,
      digital_products_fee,
      affiliate_program_fee,
      payout_threshold,
      payout_method,
      payment_details
    } = body;

    // Validate fee percentages
    const fees = [
      sponsored_ads_fee,
      cross_promotions_fee,
      subscription_tiers_fee,
      donations_fee,
      digital_products_fee,
      affiliate_program_fee
    ];

    if (fees.some(fee => fee < 0 || fee > 100)) {
      return NextResponse.json(
        { error: 'Fee percentages must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Validate payout threshold
    if (payout_threshold < 0) {
      return NextResponse.json(
        { error: 'Payout threshold must be greater than 0' },
        { status: 400 }
      );
    }

    // Validate payout method
    const validPayoutMethods = ['bank_transfer', 'mpesa', 'intasend', 'crypto'];
    if (!validPayoutMethods.includes(payout_method)) {
      return NextResponse.json(
        { error: 'Invalid payout method' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('platform_fees')
      .upsert({
        user_id: session.user.id,
        sponsored_ads_fee,
        cross_promotions_fee,
        subscription_tiers_fee,
        donations_fee,
        digital_products_fee,
        affiliate_program_fee,
        payout_threshold,
        payout_method,
        payment_details
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating platform fees:', error);
    return NextResponse.json(
      { error: 'Failed to update platform fees' },
      { status: 500 }
    );
  }
} 