import { NextResponse } from 'next/server';
import { checkAuth, getSupabaseClient } from '@/lib/auth-utils';

// GET /api/monetization/subscriptions/analytics
export async function GET(req) {
  try {
    const { session, error: authError } = await checkAuth();
    const supabase = getSupabaseClient();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '30days';

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7days':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    // Get all subscription data
    const [
      subscriptionsData,
      subscriptionTiersData,
      churnData,
      revenueData
    ] = await Promise.all([
      supabase
        .from('subscriptions')
        .select(`
          *,
          subscription_tiers (
            name,
            price,
            billing_period
          )
        `)
        .eq('creator_id', session.user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true }),

      supabase
        .from('subscription_tiers')
        .select('*')
        .eq('user_id', session.user.id),

      supabase
        .from('subscription_cancellations')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('created_at', startDate.toISOString()),

      supabase
        .from('subscription_revenue_daily')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true })
    ]);

    if (subscriptionsData.error) throw subscriptionsData.error;

    // Process analytics data
    const analytics = await processSubscriptionAnalytics({
      subscriptions: subscriptionsData.data || [],
      tiers: subscriptionTiersData.data || [],
      churnData: churnData.data || [],
      revenueData: revenueData.data || [],
      period,
      startDate,
      endDate,
      userId: session.user.id
    });

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching subscription analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription analytics' },
      { status: 500 }
    );
  }
}

async function processSubscriptionAnalytics({ 
  subscriptions, 
  tiers, 
  churnData, 
  revenueData, 
  period, 
  startDate, 
  endDate, 
  userId 
}) {
  const supabase = getSupabaseClient();

  // Calculate overview metrics
  const currentSubscriptions = subscriptions.filter(s => s.status === 'active');
  const currentRevenue = currentSubscriptions.reduce((sum, s) => sum + parseFloat(s.amount), 0);
  
  // Get previous period data for comparison
  const previousStartDate = new Date(startDate);
  const previousEndDate = new Date(endDate);
  const periodDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  
  previousStartDate.setDate(previousStartDate.getDate() - periodDays);
  previousEndDate.setDate(previousEndDate.getDate() - periodDays);

  const { data: previousSubscriptions } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('creator_id', userId)
    .gte('created_at', previousStartDate.toISOString())
    .lte('created_at', previousEndDate.toISOString());

  const previousRevenue = (previousSubscriptions || [])
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + parseFloat(s.amount), 0);

  // Calculate growth rates
  const subscriberGrowth = previousSubscriptions?.length ? 
    ((currentSubscriptions.length - previousSubscriptions.length) / previousSubscriptions.length * 100) : 0;
  const revenueGrowth = previousRevenue ? 
    ((currentRevenue - previousRevenue) / previousRevenue * 100) : 0;

  // Calculate churn rate
  const totalChurned = churnData.length;
  const avgSubscribers = (currentSubscriptions.length + (previousSubscriptions?.length || 0)) / 2;
  const churnRate = avgSubscribers ? totalChurned / avgSubscribers : 0;

  // Calculate LTV (simplified)
  const averageRevenue = currentRevenue / currentSubscriptions.length || 0;
  const averageLTV = averageRevenue * 12; // Assuming annual LTV

  // Process revenue trend data
  const revenueByMonth = groupRevenueByMonth(revenueData);
  
  // Process subscriber growth data
  const subscriberGrowthData = calculateSubscriberGrowth(subscriptions, churnData, period);

  // Calculate tier performance
  const tierPerformance = calculateTierPerformance(currentSubscriptions, tiers);

  // Analyze churn reasons
  const churnAnalysis = analyzeChurnReasons(churnData);

  // Generate cohort analysis
  const cohortData = await generateCohortAnalysis(userId, supabase);

  // Generate predictions using simple trend analysis
  const predictions = generateRevenuePredictions(revenueByMonth, currentRevenue);

  // Generate AI insights
  const insights = generateInsights({
    subscriberGrowth,
    revenueGrowth,
    churnRate,
    tierPerformance,
    revenueData
  });

  // Calculate detailed metrics
  const detailedMetrics = calculateDetailedMetrics(subscriptions, churnData, currentRevenue);

  return {
    overview: {
      totalSubscribers: currentSubscriptions.length,
      monthlyRevenue: currentRevenue,
      subscriberGrowth,
      revenueGrowth,
      churnRate,
      churnChange: -10, // Placeholder
      averageLTV,
      ltvGrowth: 5 // Placeholder
    },
    revenueData: revenueByMonth,
    subscriberGrowth: subscriberGrowthData,
    churnAnalysis,
    tierPerformance,
    cohortData,
    predictions,
    insights,
    detailedMetrics
  };
}

function groupRevenueByMonth(revenueData) {
  const monthlyRevenue = {};
  
  revenueData.forEach(item => {
    const month = new Date(item.date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
    
    if (!monthlyRevenue[month]) {
      monthlyRevenue[month] = 0;
    }
    monthlyRevenue[month] += parseFloat(item.revenue);
  });

  return Object.entries(monthlyRevenue).map(([month, revenue]) => ({
    month,
    revenue: Math.round(revenue * 100) / 100
  }));
}

function calculateSubscriberGrowth(subscriptions, churnData, period) {
  const monthlyData = {};
  
  // Group new subscriptions by month
  subscriptions.forEach(sub => {
    const month = new Date(sub.created_at).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
    
    if (!monthlyData[month]) {
      monthlyData[month] = { newSubscribers: 0, churnedSubscribers: 0 };
    }
    monthlyData[month].newSubscribers++;
  });

  // Group churned subscriptions by month
  churnData.forEach(churn => {
    const month = new Date(churn.created_at).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
    
    if (!monthlyData[month]) {
      monthlyData[month] = { newSubscribers: 0, churnedSubscribers: 0 };
    }
    monthlyData[month].churnedSubscribers++;
  });

  return Object.entries(monthlyData).map(([month, data]) => ({
    month,
    ...data
  }));
}

function calculateTierPerformance(subscriptions, tiers) {
  const tierRevenue = {};
  
  subscriptions.forEach(sub => {
    const tier = tiers.find(t => t.id === sub.tier_id);
    const tierName = tier?.name || 'Unknown';
    
    if (!tierRevenue[tierName]) {
      tierRevenue[tierName] = 0;
    }
    tierRevenue[tierName] += parseFloat(sub.amount);
  });

  return Object.entries(tierRevenue).map(([name, revenue]) => ({
    name,
    revenue: Math.round(revenue * 100) / 100
  }));
}

function analyzeChurnReasons(churnData) {
  const reasonCounts = {};
  
  churnData.forEach(churn => {
    const reason = churn.reason || 'No reason provided';
    reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
  });

  const total = churnData.length;
  const reasons = Object.entries(reasonCounts).map(([reason, count]) => ({
    reason,
    count,
    percentage: total ? count / total : 0
  }));

  return { reasons, total };
}

async function generateCohortAnalysis(userId, supabase) {
  // Get subscription data for cohort analysis
  const { data: allSubscriptions } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('creator_id', userId)
    .order('created_at', { ascending: true });

  if (!allSubscriptions || allSubscriptions.length === 0) {
    return [];
  }

  // Group subscribers by their signup month (cohort)
  const cohorts = {};
  
  allSubscriptions.forEach(sub => {
    const cohortMonth = new Date(sub.created_at).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
    
    if (!cohorts[cohortMonth]) {
      cohorts[cohortMonth] = [];
    }
    cohorts[cohortMonth].push(sub);
  });

  // Calculate retention rates for each cohort
  const cohortData = Object.entries(cohorts).map(([month, subscribers]) => {
    const cohortStart = new Date(subscribers[0].created_at);
    const size = subscribers.length;
    
    // Calculate retention for different periods
    const retention = {
      month1: calculateRetention(subscribers, cohortStart, 1),
      month2: calculateRetention(subscribers, cohortStart, 2),
      month3: calculateRetention(subscribers, cohortStart, 3),
      month6: calculateRetention(subscribers, cohortStart, 6),
      month12: calculateRetention(subscribers, cohortStart, 12)
    };

    return {
      month,
      size,
      ...retention
    };
  });

  return cohortData.slice(-6); // Return last 6 cohorts
}

function calculateRetention(subscribers, cohortStart, monthsAfter) {
  const targetDate = new Date(cohortStart);
  targetDate.setMonth(targetDate.getMonth() + monthsAfter);
  
  const stillActive = subscribers.filter(sub => {
    if (sub.status === 'cancelled' && sub.cancelled_at) {
      return new Date(sub.cancelled_at) > targetDate;
    }
    return sub.status === 'active';
  });
  
  return stillActive.length / subscribers.length;
}

function generateRevenuePredictions(revenueData, currentRevenue) {
  if (revenueData.length < 2) {
    return {
      nextMonth: currentRevenue,
      threeMonth: currentRevenue * 3,
      annual: currentRevenue * 12,
      confidence: 50
    };
  }

  // Simple linear growth calculation
  const recentData = revenueData.slice(-3);
  const avgGrowth = recentData.reduce((sum, item, index) => {
    if (index === 0) return sum;
    const growth = (item.revenue - recentData[index - 1].revenue) / recentData[index - 1].revenue;
    return sum + growth;
  }, 0) / (recentData.length - 1);

  const nextMonth = currentRevenue * (1 + avgGrowth);
  const threeMonth = nextMonth * Math.pow(1 + avgGrowth, 2);
  const annual = currentRevenue * 12 * (1 + avgGrowth * 6); // Adjusted for annual

  return {
    nextMonth: Math.round(nextMonth * 100) / 100,
    threeMonth: Math.round(threeMonth * 100) / 100,
    annual: Math.round(annual * 100) / 100,
    confidence: Math.min(85, Math.max(60, 75 + (revenueData.length * 2)))
  };
}

function generateInsights({ subscriberGrowth, revenueGrowth, churnRate, tierPerformance, revenueData }) {
  const insights = [];

  // Growth insights
  if (subscriberGrowth > 10) {
    insights.push({
      type: 'positive',
      title: 'Strong Subscriber Growth',
      description: `Your subscriber base is growing at ${subscriberGrowth.toFixed(1)}% which is excellent for long-term revenue.`
    });
  } else if (subscriberGrowth < 0) {
    insights.push({
      type: 'warning',
      title: 'Declining Subscribers',
      description: 'Your subscriber count is decreasing. Consider reviewing your content strategy and pricing.'
    });
  }

  // Revenue insights
  if (revenueGrowth > 15) {
    insights.push({
      type: 'positive',
      title: 'Revenue Acceleration',
      description: `Revenue growth of ${revenueGrowth.toFixed(1)}% indicates strong monetization performance.`
    });
  }

  // Churn insights
  if (churnRate > 0.1) {
    insights.push({
      type: 'critical',
      title: 'High Churn Rate',
      description: `Monthly churn rate of ${(churnRate * 100).toFixed(1)}% is concerning. Focus on retention strategies.`
    });
  } else if (churnRate < 0.05) {
    insights.push({
      type: 'positive',
      title: 'Excellent Retention',
      description: 'Your low churn rate indicates high subscriber satisfaction and content value.'
    });
  }

  // Tier performance insights
  const topTier = tierPerformance.sort((a, b) => b.revenue - a.revenue)[0];
  if (topTier) {
    insights.push({
      type: 'info',
      title: 'Top Performing Tier',
      description: `Your "${topTier.name}" tier generates the most revenue. Consider promoting it more.`
    });
  }

  return insights;
}

function calculateDetailedMetrics(subscriptions, churnData, currentRevenue) {
  const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
  const totalSubscribers = activeSubscriptions.length;
  
  return {
    newSubscribers: subscriptions.filter(s => {
      const createdDate = new Date(s.created_at);
      const thisMonth = new Date();
      thisMonth.setDate(1);
      return createdDate >= thisMonth;
    }).length,
    conversionRate: 0.05, // Placeholder - would need visitor data
    cpa: 25, // Placeholder - would need marketing spend data
    retention30: 0.85, // Placeholder - would need detailed tracking
    retention90: 0.72, // Placeholder
    retentionAnnual: 0.45, // Placeholder
    arpu: totalSubscribers ? currentRevenue / totalSubscribers : 0,
    growthRate: 0.08, // Placeholder
    rpv: 1.25 // Placeholder - would need visitor data
  };
} 