import { useState, useEffect } from 'react';
import { usePayoutAnalytics } from '@/hooks/usePayoutAnalytics';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function PayoutAnalytics() {
  const {
    analytics,
    loading,
    error,
    fetchAnalytics,
    getTimeSeriesData,
    getMethodDistributionData,
    getProcessingTimeData
  } = usePayoutAnalytics();

  const [timeframe, setTimeframe] = useState('month');
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchAnalytics({ timeframe, ...dateRange });
  }, [fetchAnalytics, timeframe, dateRange]);

  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
  };

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Analytics Controls</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="floating-input-container">
            <select
              id="timeframe"
              value={timeframe}
              onChange={(e) => handleTimeframeChange(e.target.value)}
              className="floating-input modern-select"
              required
              placeholder=" "
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
            </select>
            <label htmlFor="timeframe" className="floating-label">Timeframe</label>
          </div>

          <div className="floating-input-container">
            <input
              type="date"
              id="start-date"
              name="start_date"
              value={dateRange.start_date}
              onChange={handleDateRangeChange}
              className="floating-input"
              required
              placeholder=" "
            />
            <label htmlFor="start-date" className="floating-label">Start Date</label>
          </div>

          <div className="floating-input-container">
            <input
              type="date"
              id="end-date"
              name="end_date"
              value={dateRange.end_date}
              onChange={handleDateRangeChange}
              className="floating-input"
              required
              placeholder=" "
            />
            <label htmlFor="end-date" className="floating-label">End Date</label>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4">Loading analytics...</div>
      ) : (
        <>
          {/* User Statistics */}
          {analytics?.user_stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold">Total Users</h3>
                <p className="text-2xl">{analytics.user_stats.total_users}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold">Active Users</h3>
                <p className="text-2xl">{analytics.user_stats.active_users}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold">Average Per User</h3>
                <p className="text-2xl">${analytics.user_stats.average_per_user?.toFixed(2)}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold">Median Payout</h3>
                <p className="text-2xl">${analytics.user_stats.median_payout?.toFixed(2)}</p>
              </div>
            </div>
          )}

          {/* Time Series Chart */}
          {getTimeSeriesData() && (
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Payout Trends</h3>
              <div className="h-[400px]">
                <Line
                  data={getTimeSeriesData()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      'y-axis-1': {
                        type: 'linear',
                        position: 'left',
                        title: {
                          display: true,
                          text: 'Amount ($)'
                        }
                      },
                      'y-axis-2': {
                        type: 'linear',
                        position: 'right',
                        title: {
                          display: true,
                          text: 'Count'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* Method Distribution */}
          {getMethodDistributionData() && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Payout Methods</h3>
                <div className="h-[300px]">
                  <Pie
                    data={getMethodDistributionData()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false
                    }}
                  />
                </div>
              </div>

              {/* Processing Time Distribution */}
              {getProcessingTimeData() && (
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Processing Time Distribution</h3>
                  <div className="h-[300px]">
                    <Bar
                      data={getProcessingTimeData()}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: 'Number of Payouts'
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Processing Time Stats */}
          {analytics?.processing_time && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold">Average Processing Time</h3>
                <p className="text-2xl">
                  {(analytics.processing_time.average_processing_time / 3600).toFixed(1)} hours
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold">Median Processing Time</h3>
                <p className="text-2xl">
                  {(analytics.processing_time.median_processing_time / 3600).toFixed(1)} hours
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 