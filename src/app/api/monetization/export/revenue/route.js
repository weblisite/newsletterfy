import { NextResponse } from 'next/server';
import { checkAuth, getSupabaseClient } from '@/lib/auth-utils';
import { convertToCSV, formatDate, formatCurrency } from '@/lib/export-utils';

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
    const type = searchParams.get('type') || 'all';

    // Validate revenue type
    const validTypes = ['all', 'sponsored_ads', 'cross_promotions', 'subscriptions', 'donations', 'digital_products', 'affiliate'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid revenue type' },
        { status: 400 }
      );
    }

    // Initialize arrays to store all revenue data
    let revenueData = [];

    // Helper function to fetch and format revenue data
    async function fetchRevenueData(table, type, amountField = 'revenue') {
      let query = supabase
        .from(table)
        .select('*')
        .eq('user_id', session.user.id);

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data.map(item => ({
        type,
        amount: item[amountField],
        description: item.description || item.name || '',
        created_at: item.created_at,
        source: item.source || '',
        status: item.status || 'completed'
      }));
    }

    // Fetch data based on type
    if (type === 'all' || type === 'sponsored_ads') {
      const sponsoredAds = await fetchRevenueData('sponsored_ads', 'Sponsored Ads');
      revenueData = [...revenueData, ...sponsoredAds];
    }

    if (type === 'all' || type === 'cross_promotions') {
      const crossPromotions = await fetchRevenueData('cross_promotions', 'Cross Promotions');
      revenueData = [...revenueData, ...crossPromotions];
    }

    if (type === 'all' || type === 'subscriptions') {
      const subscriptions = await fetchRevenueData('subscription_tiers', 'Subscriptions');
      revenueData = [...revenueData, ...subscriptions];
    }

    if (type === 'all' || type === 'donations') {
      const donations = await fetchRevenueData('donations', 'Donations', 'amount');
      revenueData = [...revenueData, ...donations];
    }

    if (type === 'all' || type === 'digital_products') {
      const digitalProducts = await fetchRevenueData('digital_products', 'Digital Products');
      revenueData = [...revenueData, ...digitalProducts];
    }

    if (type === 'all' || type === 'affiliate') {
      const affiliateRevenue = await fetchRevenueData('affiliate_links', 'Affiliate Program');
      revenueData = [...revenueData, ...affiliateRevenue];
    }

    // Sort by date
    revenueData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Define CSV headers and field mapping
    const headers = [
      'Date',
      'Type',
      'Amount',
      'Description',
      'Source',
      'Status'
    ];

    const fieldMap = {
      'Date': 'created_at',
      'Type': 'type',
      'Amount': 'amount',
      'Description': 'description',
      'Source': 'source',
      'Status': 'status'
    };

    // Format the data
    const formattedRevenue = revenueData.map(item => ({
      ...item,
      amount: formatCurrency(item.amount),
      created_at: formatDate(new Date(item.created_at))
    }));

    // Convert to CSV
    const csv = convertToCSV(formattedRevenue, headers, fieldMap);

    // Create the response with appropriate headers
    const response = new NextResponse(csv);
    response.headers.set('Content-Type', 'text/csv');
    response.headers.set(
      'Content-Disposition',
      `attachment; filename="revenue_${type}_${formatDate(new Date())}.csv"`
    );

    return response;
  } catch (error) {
    console.error('Error exporting revenue data:', error);
    return NextResponse.json(
      { error: 'Failed to export revenue data' },
      { status: 500 }
    );
  }
} 