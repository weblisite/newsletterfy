import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Get brand ID from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new Error('Authentication required');

    const brandId = session?.user?.id;
    if (!brandId) throw new Error('Brand ID not found');

    // Fetch analytics data from database
    const { data: analyticsData, error: analyticsError } = await supabase
      .from('brand_analytics')
      .select('*')
      .eq('brand_id', brandId)
      .gte('date', startDate)
      .lte('date', endDate)
      .single();

    if (analyticsError) throw analyticsError;

    // Format the response
    const response = {
      overview: {
        totalImpressions: analyticsData.total_impressions || 0,
        totalClicks: analyticsData.total_clicks || 0,
        totalSpent: analyticsData.total_spent || 0,
        averageCTR: analyticsData.average_ctr || 0,
        averageCPC: analyticsData.average_cpc || 0,
        totalConversions: analyticsData.total_conversions || 0,
        conversionRate: analyticsData.conversion_rate || 0,
      },
      trends: {
        impressions: analyticsData.impressions_trend || [],
        clicks: analyticsData.clicks_trend || [],
        spend: analyticsData.spend_trend || [],
      },
      performance: {
        byNiche: analyticsData.performance_by_niche || [],
        byNewsletter: analyticsData.performance_by_newsletter || [],
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Analytics API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics data' },
      { status: error.message === 'Authentication required' ? 401 : 500 }
    );
  }
} 