import { NextResponse } from 'next/server';
import { checkAuth, getSupabaseClient } from '@/lib/auth-utils';

// Get monetization analytics for the authenticated user
export async function GET(req) {
  try {
    const { session, error: authError } = await checkAuth();
    const supabase = getSupabaseClient();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters for date range
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Fetch all monetization data
    const [
      sponsoredAds,
      crossPromotions,
      subscriptionTiers,
      donations,
      digitalProducts,
      affiliateLinks
    ] = await Promise.all([
      // Sponsored Ads
      supabase
        .from('sponsored_ads')
        .select('clicks, impressions, revenue, created_at')
        .eq('user_id', session.user.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate),

      // Cross Promotions
      supabase
        .from('cross_promotions')
        .select('clicks, revenue, created_at')
        .eq('user_id', session.user.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate),

      // Subscription Tiers
      supabase
        .from('subscription_tiers')
        .select('subscribers, revenue, created_at')
        .eq('user_id', session.user.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate),

      // Donations
      supabase
        .from('donations')
        .select('amount, created_at')
        .eq('user_id', session.user.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate),

      // Digital Products
      supabase
        .from('digital_products')
        .select('sales, revenue, created_at')
        .eq('user_id', session.user.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate),

      // Affiliate Links
      supabase
        .from('affiliate_links')
        .select('clicks, conversions, revenue, created_at')
        .eq('user_id', session.user.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
    ]);

    // Calculate totals and metrics
    const analytics = {
      sponsored_ads: {
        total_clicks: sponsoredAds.data?.reduce((sum, ad) => sum + (ad.clicks || 0), 0) || 0,
        total_impressions: sponsoredAds.data?.reduce((sum, ad) => sum + (ad.impressions || 0), 0) || 0,
        total_revenue: sponsoredAds.data?.reduce((sum, ad) => sum + (ad.revenue || 0), 0) || 0,
        ctr: sponsoredAds.data?.reduce((sum, ad) => sum + (ad.impressions ? (ad.clicks / ad.impressions) : 0), 0) || 0
      },
      cross_promotions: {
        total_clicks: crossPromotions.data?.reduce((sum, promo) => sum + (promo.clicks || 0), 0) || 0,
        total_revenue: crossPromotions.data?.reduce((sum, promo) => sum + (promo.revenue || 0), 0) || 0
      },
      subscriptions: {
        total_subscribers: subscriptionTiers.data?.reduce((sum, tier) => sum + (tier.subscribers || 0), 0) || 0,
        total_revenue: subscriptionTiers.data?.reduce((sum, tier) => sum + (tier.revenue || 0), 0) || 0
      },
      donations: {
        total_amount: donations.data?.reduce((sum, donation) => sum + (donation.amount || 0), 0) || 0,
        total_count: donations.data?.length || 0,
        average_amount: donations.data?.length ? 
          donations.data.reduce((sum, donation) => sum + (donation.amount || 0), 0) / donations.data.length : 0
      },
      digital_products: {
        total_sales: digitalProducts.data?.reduce((sum, product) => sum + (product.sales || 0), 0) || 0,
        total_revenue: digitalProducts.data?.reduce((sum, product) => sum + (product.revenue || 0), 0) || 0
      },
      affiliate_program: {
        total_clicks: affiliateLinks.data?.reduce((sum, link) => sum + (link.clicks || 0), 0) || 0,
        total_conversions: affiliateLinks.data?.reduce((sum, link) => sum + (link.conversions || 0), 0) || 0,
        total_revenue: affiliateLinks.data?.reduce((sum, link) => sum + (link.revenue || 0), 0) || 0,
        conversion_rate: affiliateLinks.data?.reduce((sum, link) => sum + (link.clicks ? (link.conversions / link.clicks) : 0), 0) || 0
      },
      total_revenue: 0
    };

    // Calculate total revenue across all streams
    analytics.total_revenue = 
      analytics.sponsored_ads.total_revenue +
      analytics.cross_promotions.total_revenue +
      analytics.subscriptions.total_revenue +
      analytics.donations.total_amount +
      analytics.digital_products.total_revenue +
      analytics.affiliate_program.total_revenue;

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching monetization analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monetization analytics' },
      { status: 500 }
    );
  }
} 