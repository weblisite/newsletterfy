import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// GET /api/donations/analytics - Get comprehensive donation analytics
export async function GET(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '30'; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Basic donation metrics
    const { data: donations, error: donationsError } = await supabase
      .from('donations')
      .select('*')
      .eq('recipient_id', session.user.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (donationsError) throw donationsError;

    // Recurring donations analytics
    const { data: recurringDonations, error: recurringError } = await supabase
      .from('recurring_donations')
      .select('*')
      .eq('recipient_id', session.user.id);

    if (recurringError) throw recurringError;

    // Newsletter analytics for conversion tracking
    const { data: newsletters, error: newslettersError } = await supabase
      .from('newsletters')
      .select('id, title, created_at, views, clicks')
      .eq('user_id', session.user.id)
      .gte('created_at', startDate.toISOString());

    if (newslettersError) console.error('Newsletter analytics error:', newslettersError);

    // Calculate metrics
    const analytics = calculateAdvancedAnalytics(donations, recurringDonations, newsletters);

    return NextResponse.json({
      analytics,
      raw_data: {
        donations: donations?.slice(0, 10), // Last 10 donations for debugging
        recurring_count: recurringDonations?.length || 0,
        newsletter_count: newsletters?.length || 0
      }
    });

  } catch (error) {
    console.error('Error fetching donation analytics:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

function calculateAdvancedAnalytics(donations = [], recurringDonations = [], newsletters = []) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Basic metrics
  const totalDonations = donations.length;
  const totalAmount = donations.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
  const userShare = totalAmount * 0.8;
  const platformFee = totalAmount * 0.2;

  // Time period comparisons
  const last30Days = donations.filter(d => new Date(d.created_at) >= thirtyDaysAgo);
  const last7Days = donations.filter(d => new Date(d.created_at) >= sevenDaysAgo);
  const previousPeriod = donations.filter(d => {
    const date = new Date(d.created_at);
    return date < thirtyDaysAgo && date >= new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000);
  });

  // Growth calculations
  const current30DayAmount = last30Days.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
  const previous30DayAmount = previousPeriod.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
  const growthRate = previous30DayAmount > 0 
    ? ((current30DayAmount - previous30DayAmount) / previous30DayAmount) * 100 
    : 0;

  // Donor analytics
  const uniqueDonors = new Set();
  const donorFrequency = {};
  const donorAmounts = {};

  donations.forEach(d => {
    const donorKey = d.donor_id || d.metadata?.donor_email || 'anonymous';
    uniqueDonors.add(donorKey);
    donorFrequency[donorKey] = (donorFrequency[donorKey] || 0) + 1;
    donorAmounts[donorKey] = (donorAmounts[donorKey] || 0) + parseFloat(d.amount || 0);
  });

  // Retention metrics
  const repeatDonors = Object.values(donorFrequency).filter(freq => freq > 1).length;
  const retentionRate = uniqueDonors.size > 0 ? (repeatDonors / uniqueDonors.size) * 100 : 0;

  // Average metrics
  const averageDonation = totalDonations > 0 ? totalAmount / totalDonations : 0;
  const averageDonorValue = uniqueDonors.size > 0 ? totalAmount / uniqueDonors.size : 0;

  // Recurring donation metrics
  const activeRecurring = recurringDonations.filter(rd => rd.status === 'active');
  const monthlyRecurringRevenue = activeRecurring
    .filter(rd => rd.frequency === 'monthly')
    .reduce((sum, rd) => sum + parseFloat(rd.amount || 0), 0);
  const weeklyRecurringRevenue = activeRecurring
    .filter(rd => rd.frequency === 'weekly')
    .reduce((sum, rd) => sum + parseFloat(rd.amount || 0), 0);

  // Estimate MRR (Monthly Recurring Revenue)
  const estimatedMRR = monthlyRecurringRevenue + (weeklyRecurringRevenue * 4.33);

  // Conversion analytics (requires newsletter data)
  const newsletterViews = newsletters.reduce((sum, n) => sum + (n.views || 0), 0);
  const conversionRate = newsletterViews > 0 ? (totalDonations / newsletterViews) * 100 : 0;

  // Time-based analysis
  const donationsByDay = {};
  const donationsByHour = {};
  
  donations.forEach(d => {
    const date = new Date(d.created_at);
    const day = date.toISOString().split('T')[0];
    const hour = date.getHours();
    
    donationsByDay[day] = (donationsByDay[day] || 0) + parseFloat(d.amount || 0);
    donationsByHour[hour] = (donationsByHour[hour] || 0) + 1;
  });

  // Peak activity analysis
  const peakDonationDay = Object.entries(donationsByDay)
    .sort(([,a], [,b]) => b - a)[0];
  const peakDonationHour = Object.entries(donationsByHour)
    .sort(([,a], [,b]) => b - a)[0];

  // Tier performance (if tiers exist)
  const tierPerformance = {};
  donations.forEach(d => {
    if (d.donation_tier_id) {
      const tier = d.donation_tier_id;
      if (!tierPerformance[tier]) {
        tierPerformance[tier] = { count: 0, amount: 0 };
      }
      tierPerformance[tier].count++;
      tierPerformance[tier].amount += parseFloat(d.amount || 0);
    }
  });

  // Predict next month revenue based on trends
  const recentTrend = last7Days.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
  const predictedMonthlyRevenue = (recentTrend / 7) * 30; // Simple linear projection

  return {
    // Overview metrics
    overview: {
      totalDonations,
      totalAmount,
      userShare,
      platformFee,
      uniqueDonors: uniqueDonors.size,
      averageDonation,
      averageDonorValue,
      growthRate,
      retentionRate
    },

    // Recurring metrics
    recurring: {
      activeSubscriptions: activeRecurring.length,
      totalSubscriptions: recurringDonations.length,
      monthlyRecurringRevenue,
      estimatedMRR,
      recurringDonorCount: activeRecurring.length
    },

    // Performance metrics
    performance: {
      conversionRate,
      newsletterViews,
      donationsPerNewsletter: newsletters.length > 0 ? totalDonations / newsletters.length : 0,
      repeatDonorPercentage: retentionRate,
      averageTimeToRepeat: calculateAverageTimeToRepeat(donations)
    },

    // Trends
    trends: {
      last7Days: {
        donations: last7Days.length,
        amount: last7Days.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0)
      },
      last30Days: {
        donations: last30Days.length,
        amount: current30DayAmount
      },
      growthRate,
      predictedMonthlyRevenue
    },

    // Activity patterns
    patterns: {
      peakDonationDay: peakDonationDay ? {
        date: peakDonationDay[0],
        amount: peakDonationDay[1]
      } : null,
      peakDonationHour: peakDonationHour ? {
        hour: parseInt(peakDonationHour[0]),
        count: peakDonationHour[1]
      } : null,
      donationsByDay: Object.entries(donationsByDay)
        .sort(([a], [b]) => b.localeCompare(a))
        .slice(0, 30) // Last 30 days
        .map(([date, amount]) => ({ date, amount })),
      donationsByHour: Object.entries(donationsByHour)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .sort((a, b) => a.hour - b.hour)
    },

    // Tier insights
    tiers: {
      performance: Object.entries(tierPerformance)
        .map(([tierId, data]) => ({
          tierId,
          donations: data.count,
          amount: data.amount,
          averageAmount: data.amount / data.count
        }))
        .sort((a, b) => b.amount - a.amount),
      topTier: Object.entries(tierPerformance)
        .sort(([,a], [,b]) => b.amount - a.amount)[0]
    },

    // Goal insights (placeholder for when goals are integrated)
    goals: {
      active: 0,
      completed: 0,
      totalProgress: 0
    }
  };
}

function calculateAverageTimeToRepeat(donations) {
  const donorFirstLast = {};
  
  donations.forEach(d => {
    const donorKey = d.donor_id || d.metadata?.donor_email || 'anonymous';
    const date = new Date(d.created_at);
    
    if (!donorFirstLast[donorKey]) {
      donorFirstLast[donorKey] = { first: date, last: date, count: 1 };
    } else {
      donorFirstLast[donorKey].last = date > donorFirstLast[donorKey].last ? date : donorFirstLast[donorKey].last;
      donorFirstLast[donorKey].first = date < donorFirstLast[donorKey].first ? date : donorFirstLast[donorKey].first;
      donorFirstLast[donorKey].count++;
    }
  });

  const repeatDonors = Object.values(donorFirstLast).filter(d => d.count > 1);
  
  if (repeatDonors.length === 0) return 0;
  
  const averageDays = repeatDonors.reduce((sum, donor) => {
    const daysBetween = (donor.last - donor.first) / (1000 * 60 * 60 * 24);
    return sum + daysBetween;
  }, 0) / repeatDonors.length;
  
  return averageDays;
} 