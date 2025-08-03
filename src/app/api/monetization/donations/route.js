import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// GET /api/monetization/donations
export async function GET(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch donations without the problematic join
    const { data: donations, error } = await supabase
      .from('donations')
      .select('*')
      .eq('recipient_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch tier information separately for donations that have a tier
    const donationsWithTiers = await Promise.all(
      (donations || []).map(async (donation) => {
        if (donation.donation_tier_id) {
          const { data: tier } = await supabase
            .from('donation_tiers')
            .select('id, name, amount, description, perks')
            .eq('id', donation.donation_tier_id)
            .single();
          
          return { ...donation, donation_tier: tier };
        }
        return { ...donation, donation_tier: null };
      })
    );

    // Calculate analytics
    const totalDonations = donations?.length || 0;
    const totalAmount = donations?.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0) || 0;
    const userShare = totalAmount * 0.8; // 80% to creator
    const platformFee = totalAmount * 0.2; // 20% platform fee
    const uniqueDonors = new Set(donations?.map(d => d.donor_id).filter(id => id)).size || 0;

    return NextResponse.json({
      donations: donationsWithTiers,
      analytics: {
        totalDonations,
        totalAmount,
        userShare,
        platformFee,
        uniqueDonors
      }
    });
  } catch (error) {
    console.error('Error fetching donations:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/monetization/donations
export async function POST(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { amount, message, tier_id, recipient_id } = body;

    if (!amount || !recipient_id) {
      return NextResponse.json({ error: 'Amount and recipient are required' }, { status: 400 });
    }

    // Calculate shares
    const userShare = amount * 0.8; // 80% to creator
    const platformFee = amount * 0.2; // 20% platform fee

    const { data: donation, error } = await supabase
      .from('donations')
      .insert([{
        donor_id: session.user.id,
        recipient_id,
        amount,
        user_share: userShare,
        platform_fee: platformFee,
        message,
        donation_tier_id: tier_id,
        status: 'completed'
      }])
      .select('*')
      .single();

    if (error) throw error;

    // Fetch tier information if tier_id is provided
    let donationTier = null;
    if (tier_id) {
      const { data: tier } = await supabase
        .from('donation_tiers')
        .select('id, name, amount, description, perks')
        .eq('id', tier_id)
        .single();
      donationTier = tier;
    }

    // Update recipient's total donations
    try {
      await supabase.rpc('update_user_donation_stats', {
        user_id: recipient_id,
        donation_amount: amount
      });
    } catch (statsError) {
      console.error('Error updating donation stats:', statsError);
      // Don't fail the whole transaction for stats update
    }

    return NextResponse.json({ 
      donation: { 
        ...donation, 
        donation_tier: donationTier 
      } 
    });
  } catch (error) {
    console.error('Error processing donation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 