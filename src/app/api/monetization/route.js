import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Get all monetization data
export async function GET(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch all monetization data for the user
    const [
      { data: sponsoredAds },
      { data: crossPromotions },
      { data: subscriptionTiers },
      { data: donations },
      { data: donationTiers },
      { data: digitalProducts },
      { data: affiliateReferrals },
      { data: affiliateLinks },
      { data: monetizationStats }
    ] = await Promise.all([
      supabase
        .from('sponsored_ads')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('cross_promotions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('subscription_tiers')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('donations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('donation_tiers')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('digital_products')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('affiliate_referrals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('affiliate_links')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('monetization_stats')
        .select('*')
        .eq('user_id', userId)
        .single()
    ]);

    // Calculate stats if monetizationStats doesn't exist
    const stats = monetizationStats || {
      sponsored_ads: {
        average_earnings: sponsoredAds?.reduce((acc, ad) => acc + ad.revenue, 0) / sponsoredAds?.length || 0,
        active_sponsors: sponsoredAds?.filter(ad => ad.status === 'active').length || 0,
        platform_fee: 20
      },
      cross_promotions: {
        clicks: crossPromotions?.reduce((acc, promo) => acc + promo.clicks, 0) || 0,
        total_revenue: crossPromotions?.reduce((acc, promo) => acc + promo.revenue, 0) || 0,
        platform_fee: 20
      },
      paid_subscriptions: {
        subscribers: subscriptionTiers?.reduce((acc, tier) => acc + tier.subscribers, 0) || 0,
        total_revenue: subscriptionTiers?.reduce((acc, tier) => acc + tier.revenue, 0) || 0,
        platform_fee: 20
      },
      tips_and_donations: {
        supporters: donations?.length || 0,
        total_tips: donations?.reduce((acc, donation) => acc + donation.amount, 0) || 0,
        platform_fee: 20
      },
      digital_products: {
        products_sold: digitalProducts?.reduce((acc, product) => acc + product.sales, 0) || 0,
        total_sales: digitalProducts?.reduce((acc, product) => acc + product.revenue, 0) || 0,
        platform_fee: 20
      },
      affiliate_program: {
        referrals: affiliateReferrals?.length || 0,
        total_commission: affiliateReferrals?.reduce((acc, ref) => acc + ref.commission, 0) || 0,
        platform_fee: 20
      }
    };

    return NextResponse.json({
      sponsored_ads: sponsoredAds || [],
      cross_promotions: crossPromotions || [],
      subscription_tiers: subscriptionTiers || [],
      donations: donations || [],
      donation_tiers: donationTiers || [],
      digital_products: digitalProducts || [],
      affiliate_referrals: affiliateReferrals || [],
      affiliate_links: affiliateLinks || [],
      stats
    });
  } catch (error) {
    console.error('Error fetching monetization data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monetization data' },
      { status: 500 }
    );
  }
} 