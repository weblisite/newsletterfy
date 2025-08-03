"use client";
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function Analytics() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [selectedDateRange, setSelectedDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const [analyticsData, setAnalyticsData] = useState({
    overview: {
      totalImpressions: 245000,
      totalClicks: 12250,
      totalSpent: 17450,
      averageCTR: 5.0,
      averageCPC: 1.42,
      totalConversions: 980,
      conversionRate: 8.0,
    },
    trends: {
      impressions: [
        { date: '2024-01-01', value: 7500 },
        { date: '2024-01-08', value: 8200 },
        { date: '2024-01-15', value: 7800 },
        { date: '2024-01-22', value: 8500 },
        { date: '2024-01-29', value: 9200 },
      ],
      clicks: [
        { date: '2024-01-01', value: 375 },
        { date: '2024-01-08', value: 410 },
        { date: '2024-01-15', value: 390 },
        { date: '2024-01-22', value: 425 },
        { date: '2024-01-29', value: 460 },
      ],
      spend: [
        { date: '2024-01-01', value: 532.50 },
        { date: '2024-01-08', value: 582.20 },
        { date: '2024-01-15', value: 553.80 },
        { date: '2024-01-22', value: 603.50 },
        { date: '2024-01-29', value: 653.20 },
      ],
    },
    performance: {
      byNiche: [
        { name: 'Tech', impressions: 85000, clicks: 4250, spent: 6037.50, ctr: 5.0 },
        { name: 'Fashion', impressions: 65000, clicks: 3250, spent: 4615.00, ctr: 5.0 },
        { name: 'Lifestyle', impressions: 55000, clicks: 2750, spent: 3905.00, ctr: 5.0 },
        { name: 'Business', impressions: 40000, clicks: 2000, spent: 2840.00, ctr: 5.0 },
      ],
      byNewsletter: [
        { name: 'Tech Insider', impressions: 45000, clicks: 2250, spent: 3195.00, ctr: 5.0 },
        { name: 'Fashion Weekly', impressions: 35000, clicks: 1750, spent: 2485.00, ctr: 5.0 },
        { name: 'Lifestyle Digest', impressions: 30000, clicks: 1500, spent: 2130.00, ctr: 5.0 },
        { name: 'Business Daily', impressions: 25000, clicks: 1250, spent: 1775.00, ctr: 5.0 },
      ],
    },
  });

  const timeframeOptions = [
    { label: 'Last 7 days', value: '7d' },
    { label: 'Last 30 days', value: '30d' },
    { label: 'Last 90 days', value: '90d' },
    { label: 'Year to date', value: 'ytd' },
    { label: 'All time', value: 'all' },
  ];

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedTimeframe, selectedDateRange]);

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/brand/analytics?timeframe=${selectedTimeframe}&startDate=${selectedDateRange.startDate}&endDate=${selectedDateRange.endDate}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch analytics data');
      }
      const data = await response.json();
      setAnalyticsData(data);
      setIsLoading(false);
    } catch (error) {
      toast.error(error.message);
      console.error(error);
      setIsLoading(false);
    }
  };

  const handleTimeframeChange = (timeframe) => {
    setSelectedTimeframe(timeframe);
    const endDate = new Date();
    let startDate;

    switch (timeframe) {
      case '7d':
        startDate = new Date(endDate - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(endDate - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(endDate - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'ytd':
        startDate = new Date(endDate.getFullYear(), 0, 1);
        break;
      case 'all':
        startDate = new Date(2020, 0, 1); // Example start date
        break;
      default:
        startDate = new Date(endDate - 30 * 24 * 60 * 60 * 1000);
    }

    setSelectedDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    });
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="animate-fadeIn">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Analytics</h2>
          <p className="text-gray-600">Track and analyze your campaign performance</p>
        </div>
        <div className="flex items-center space-x-2">
          {timeframeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleTimeframeChange(option.value)}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                selectedTimeframe === option.value
                  ? 'bg-cyan-100 text-cyan-700'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="glass-panel p-6">
          <div className="flex flex-col">
            <p className="text-sm text-gray-600">Total Impressions</p>
            <h3 className="text-2xl font-bold text-gray-900">
              {analyticsData.overview.totalImpressions.toLocaleString()}
            </h3>
            <p className="text-sm text-cyan-600">Ad views</p>
          </div>
        </div>
        <div className="glass-panel p-6">
          <div className="flex flex-col">
            <p className="text-sm text-gray-600">Total Clicks</p>
            <h3 className="text-2xl font-bold text-gray-900">
              {analyticsData.overview.totalClicks.toLocaleString()}
            </h3>
            <p className="text-sm text-cyan-600">CTR: {analyticsData.overview.averageCTR}%</p>
          </div>
        </div>
        <div className="glass-panel p-6">
          <div className="flex flex-col">
            <p className="text-sm text-gray-600">Total Spent</p>
            <h3 className="text-2xl font-bold text-gray-900">
              ${analyticsData.overview.totalSpent.toLocaleString()}
            </h3>
            <p className="text-sm text-cyan-600">CPC: ${analyticsData.overview.averageCPC}</p>
          </div>
        </div>
        <div className="glass-panel p-6">
          <div className="flex flex-col">
            <p className="text-sm text-gray-600">Conversions</p>
            <h3 className="text-2xl font-bold text-gray-900">
              {analyticsData.overview.totalConversions.toLocaleString()}
            </h3>
            <p className="text-sm text-cyan-600">Rate: {analyticsData.overview.conversionRate}%</p>
          </div>
        </div>
      </div>

      {/* Trends Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Impressions & Clicks Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={analyticsData.trends.impressions.map((item, index) => ({
                  date: item.date,
                  impressions: item.value,
                  clicks: analyticsData.trends.clicks[index].value,
                }))}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="impressions"
                  stroke="#0088FE"
                  name="Impressions"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="clicks"
                  stroke="#00C49F"
                  name="Clicks"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Spend Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analyticsData.trends.spend}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Spend" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Performance by Niche and Newsletter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance by Niche</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsData.performance.byNiche}
                  dataKey="spent"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {analyticsData.performance.byNiche.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Niche
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Impressions
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clicks
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CTR
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Spent
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analyticsData.performance.byNiche.map((niche, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {niche.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {niche.impressions.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {niche.clicks.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {niche.ctr}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${niche.spent.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance by Newsletter</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analyticsData.performance.byNewsletter}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip />
                <Legend />
                <Bar dataKey="clicks" name="Clicks" fill="#0088FE" />
                <Bar dataKey="impressions" name="Impressions" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Newsletter
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Impressions
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clicks
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CTR
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Spent
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analyticsData.performance.byNewsletter.map((newsletter, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {newsletter.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {newsletter.impressions.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {newsletter.clicks.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {newsletter.ctr}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${newsletter.spent.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 