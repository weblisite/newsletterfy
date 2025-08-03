import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Mock analytics data for development
const generateMockTimeSeriesData = (days = 30) => {
  const data = [];
  const now = Date.now();
  for (let i = 0; i < days; i++) {
    const date = new Date(now - (days - i - 1) * 24 * 60 * 60 * 1000);
    data.push({
      date: date.toISOString().split('T')[0],
      amount: Math.floor(Math.random() * 10000) / 100,
      count: Math.floor(Math.random() * 20),
    });
  }
  return data;
};

const MOCK_ANALYTICS = {
  total_amount: 125750.45,
  total_count: 1250,
  average_amount: 100.60,
  processing_time: {
    average: 48, // hours
    median: 36,
    distribution: {
      '0-24h': 450,
      '24-48h': 350,
      '48-72h': 300,
      '72h+': 150
    }
  },
  method_distribution: {
    bank_transfer: 500,
    paypal: 400,
    intasend: 250,
    crypto: 100
  },
  time_series: generateMockTimeSeriesData(),
  status_distribution: {
    pending: 200,
    processing: 150,
    completed: 850,
    failed: 50
  }
};

export async function GET(request) {
  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';

  if (isDevelopment) {
    // Parse query parameters for time range
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const timeframe = searchParams.get('timeframe') || '30d';

    // Generate appropriate mock data based on timeframe
    let days = 30;
    switch (timeframe) {
      case '7d':
        days = 7;
        break;
      case '14d':
        days = 14;
        break;
      case '30d':
        days = 30;
        break;
      case '90d':
        days = 90;
        break;
      default:
        days = 30;
    }

    return NextResponse.json({
      ...MOCK_ANALYTICS,
      time_series: generateMockTimeSeriesData(days)
    });
  }

  // Production mode
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Build queries for analytics data
    const [
      { data: totals },
      { data: methodDistribution },
      { data: statusDistribution },
      { data: timeSeries },
      { data: processingTimes }
    ] = await Promise.all([
      // Get totals
      supabase.rpc('get_payout_totals', { 
        start_date: startDate, 
        end_date: endDate 
      }),

      // Get method distribution
      supabase
        .from('payouts')
        .select('payout_method, count', { count: 'exact' })
        .group('payout_method'),

      // Get status distribution
      supabase
        .from('payouts')
        .select('status, count', { count: 'exact' })
        .group('status'),

      // Get time series data
      supabase.rpc('get_payout_time_series', {
        start_date: startDate,
        end_date: endDate
      }),

      // Get processing time statistics
      supabase.rpc('get_processing_time_stats')
    ]);

    return NextResponse.json({
      total_amount: totals?.total_amount || 0,
      total_count: totals?.total_count || 0,
      average_amount: totals?.average_amount || 0,
      processing_time: {
        average: processingTimes?.average || 0,
        median: processingTimes?.median || 0,
        distribution: processingTimes?.distribution || {}
      },
      method_distribution: methodDistribution?.reduce((acc, { payout_method, count }) => {
        acc[payout_method] = count;
        return acc;
      }, {}),
      time_series: timeSeries || [],
      status_distribution: statusDistribution?.reduce((acc, { status, count }) => {
        acc[status] = count;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Error fetching payout analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payout analytics' },
      { status: 500 }
    );
  }
} 