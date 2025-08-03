import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user is authenticated and is an admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role in users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters for date range
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = searchParams.get('endDate') || new Date().toISOString();

    // Fetch analytics data
    const [
      newsletterStats,
      userStats,
      revenueStats,
      engagementStats
    ] = await Promise.all([
      // Newsletter statistics
      supabase
        .from('newsletters')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate),
      
      // User statistics
      supabase
        .from('users')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate),
      
      // Revenue statistics
      supabase
        .from('transactions')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate),
      
      // Engagement statistics
      supabase
        .from('engagement_metrics')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
    ]);

    // Process and aggregate data
    const analyticsData = {
      overview: {
        totalNewsletters: newsletterStats.data?.length || 0,
        totalUsers: userStats.data?.length || 0,
        totalRevenue: revenueStats.data?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0,
        averageEngagement: engagementStats.data?.reduce((sum, e) => sum + (e.engagement_rate || 0), 0) / (engagementStats.data?.length || 1)
      },
      trends: {
        newsletters: processTrendData(newsletterStats.data || [], startDate, endDate),
        users: processTrendData(userStats.data || [], startDate, endDate),
        revenue: processTrendData(revenueStats.data || [], startDate, endDate),
        engagement: processTrendData(engagementStats.data || [], startDate, endDate)
      }
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Admin analytics error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

function processTrendData(data, startDate, endDate) {
  // Create a map of dates to aggregate values
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  
  const trendData = Array.from({ length: days }, (_, i) => {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    return {
      date: date.toISOString().split('T')[0],
      value: 0
    };
  });

  // Aggregate data by date
  data.forEach(item => {
    const date = new Date(item.created_at || item.date).toISOString().split('T')[0];
    const index = trendData.findIndex(d => d.date === date);
    if (index !== -1) {
      trendData[index].value += 1;
    }
  });

  return trendData;
} 