import { useState, useCallback } from 'react';

export function usePayoutAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        timeframe: params.timeframe || 'month',
        ...(params.start_date && { start_date: params.start_date }),
        ...(params.end_date && { end_date: params.end_date })
      });

      const response = await fetch(`/api/admin/payouts/analytics?${queryParams}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch analytics');
      }

      setAnalytics(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Format time series data for charts
  const getTimeSeriesData = useCallback(() => {
    if (!analytics?.time_series) return null;

    return {
      labels: analytics.time_series.map(item => item.period),
      datasets: [
        {
          label: 'Total Paid',
          data: analytics.time_series.map(item => item.total_paid),
          borderColor: '#06B6D4',
          backgroundColor: 'rgba(6, 182, 212, 0.1)',
          yAxisID: 'y-axis-1',
        },
        {
          label: 'Completed Payouts',
          data: analytics.time_series.map(item => item.completed_payouts),
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          yAxisID: 'y-axis-2',
        },
        {
          label: 'Failed Payouts',
          data: analytics.time_series.map(item => item.failed_payouts),
          borderColor: '#EF4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          yAxisID: 'y-axis-2',
        }
      ]
    };
  }, [analytics]);

  // Format method distribution data for charts
  const getMethodDistributionData = useCallback(() => {
    if (!analytics?.method_distribution || !Array.isArray(analytics.method_distribution)) return null;

    return {
      labels: analytics.method_distribution.map(item => item.payout_method),
      datasets: [{
        data: analytics.method_distribution.map(item => item.total_amount),
        backgroundColor: [
          '#06B6D4',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#22D3EE'
        ]
      }]
    };
  }, [analytics]);

  // Format processing time distribution data
  const getProcessingTimeData = useCallback(() => {
    if (!analytics?.processing_time?.processing_time_distribution) return null;

    const distribution = analytics.processing_time.processing_time_distribution;
    return {
      labels: distribution.map(item => item.range),
      datasets: [{
        data: distribution.map(item => item.count),
        backgroundColor: [
          '#06B6D4',
          '#10B981',
          '#F59E0B',
          '#EF4444'
        ]
      }]
    };
  }, [analytics]);

  return {
    analytics,
    loading,
    error,
    fetchAnalytics,
    getTimeSeriesData,
    getMethodDistributionData,
    getProcessingTimeData
  };
} 