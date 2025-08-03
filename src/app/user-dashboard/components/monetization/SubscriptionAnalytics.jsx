"use client";
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Card,
  CardHeader,
  CardContent,
  CardDescription,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Calendar,
  Download,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  X
} from 'lucide-react';

export default function SubscriptionAnalytics({ onClose }) {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30days');
  const [analytics, setAnalytics] = useState({
    overview: {},
    revenueData: [],
    subscriberGrowth: [],
    churnAnalysis: {},
    tierPerformance: [],
    cohortData: [],
    predictions: {}
  });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/monetization/subscriptions/analytics?period=${dateRange}`);
      const data = await response.json();
      
      if (data.error) throw new Error(data.error);
      setAnalytics(data);
    } catch (error) {
      toast.error('Failed to load analytics');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      const response = await fetch(`/api/monetization/subscriptions/export?period=${dateRange}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `subscription-analytics-${dateRange}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Analytics data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const MetricCard = ({ title, value, change, changeType, icon: Icon, description }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className={`flex items-center text-xs ${changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
            {changeType === 'positive' ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
            {Math.abs(change)}% from last period
          </div>
        )}
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-7xl max-h-[90vh] w-full overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Subscription Analytics</h2>
            <p className="text-gray-600">Detailed insights into your subscription performance</p>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="border rounded-md px-3 py-2"
            >
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="90days">Last 90 days</option>
              <option value="1year">Last year</option>
            </select>
            <Button onClick={exportData} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={onClose} variant="ghost" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Overview Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard
              title="Total Subscribers"
              value={analytics.overview.totalSubscribers?.toLocaleString() || '0'}
              change={analytics.overview.subscriberGrowth}
              changeType={analytics.overview.subscriberGrowth > 0 ? 'positive' : 'negative'}
              icon={Users}
              description="Active paid subscribers"
            />
            <MetricCard
              title="Monthly Revenue"
              value={`$${analytics.overview.monthlyRevenue?.toLocaleString() || '0'}`}
              change={analytics.overview.revenueGrowth}
              changeType={analytics.overview.revenueGrowth > 0 ? 'positive' : 'negative'}
              icon={DollarSign}
              description="Recurring monthly revenue"
            />
            <MetricCard
              title="Churn Rate"
              value={`${(analytics.overview.churnRate * 100)?.toFixed(1) || '0'}%`}
              change={analytics.overview.churnChange}
              changeType={analytics.overview.churnChange < 0 ? 'positive' : 'negative'}
              icon={TrendingDown}
              description="Monthly subscriber churn"
            />
            <MetricCard
              title="Average LTV"
              value={`$${analytics.overview.averageLTV?.toFixed(2) || '0'}`}
              change={analytics.overview.ltvGrowth}
              changeType={analytics.overview.ltvGrowth > 0 ? 'positive' : 'negative'}
              icon={TrendingUp}
              description="Customer lifetime value"
            />
          </div>

          {/* Revenue and Growth Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Monthly recurring revenue over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subscriber Growth</CardTitle>
                <CardDescription>New vs churned subscribers</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.subscriberGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="newSubscribers" fill="#10b981" name="New Subscribers" />
                    <Bar dataKey="churnedSubscribers" fill="#ef4444" name="Churned" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Tier Performance and Churn Analysis */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tier Performance</CardTitle>
                <CardDescription>Revenue distribution by subscription tier</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.tierPerformance}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {analytics.tierPerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Churn Analysis</CardTitle>
                <CardDescription>Reasons for subscription cancellations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.churnAnalysis.reasons?.map((reason, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{reason.reason}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full" 
                            style={{ width: `${(reason.percentage * 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{(reason.percentage * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  )) || <p className="text-gray-500">No churn data available</p>}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cohort Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Cohort Analysis</CardTitle>
              <CardDescription>Retention rates by signup month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left p-2">Cohort</th>
                      <th className="text-center p-2">Size</th>
                      <th className="text-center p-2">Month 1</th>
                      <th className="text-center p-2">Month 2</th>
                      <th className="text-center p-2">Month 3</th>
                      <th className="text-center p-2">Month 6</th>
                      <th className="text-center p-2">Month 12</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.cohortData.map((cohort, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2 font-medium">{cohort.month}</td>
                        <td className="p-2 text-center">{cohort.size}</td>
                        <td className="p-2 text-center">
                          <Badge 
                            variant={cohort.month1 > 0.8 ? 'default' : cohort.month1 > 0.6 ? 'secondary' : 'destructive'}
                          >
                            {(cohort.month1 * 100).toFixed(0)}%
                          </Badge>
                        </td>
                        <td className="p-2 text-center">
                          <Badge 
                            variant={cohort.month2 > 0.7 ? 'default' : cohort.month2 > 0.5 ? 'secondary' : 'destructive'}
                          >
                            {(cohort.month2 * 100).toFixed(0)}%
                          </Badge>
                        </td>
                        <td className="p-2 text-center">
                          <Badge 
                            variant={cohort.month3 > 0.6 ? 'default' : cohort.month3 > 0.4 ? 'secondary' : 'destructive'}
                          >
                            {(cohort.month3 * 100).toFixed(0)}%
                          </Badge>
                        </td>
                        <td className="p-2 text-center">
                          <Badge 
                            variant={cohort.month6 > 0.4 ? 'default' : cohort.month6 > 0.2 ? 'secondary' : 'destructive'}
                          >
                            {(cohort.month6 * 100).toFixed(0)}%
                          </Badge>
                        </td>
                        <td className="p-2 text-center">
                          <Badge 
                            variant={cohort.month12 > 0.3 ? 'default' : cohort.month12 > 0.15 ? 'secondary' : 'destructive'}
                          >
                            {(cohort.month12 * 100).toFixed(0)}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Predictions and Insights */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Predictions</CardTitle>
                <CardDescription>AI-powered revenue forecasts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Next Month Forecast</span>
                    <span className="font-bold text-lg">${analytics.predictions.nextMonth?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>3-Month Forecast</span>
                    <span className="font-bold text-lg">${analytics.predictions.threeMonth?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Annual Forecast</span>
                    <span className="font-bold text-lg text-green-600">${analytics.predictions.annual?.toLocaleString()}</span>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Confidence:</strong> {analytics.predictions.confidence}% 
                      based on historical data and current trends.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
                <CardDescription>AI-generated recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.insights?.map((insight, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        insight.type === 'positive' ? 'bg-green-500' :
                        insight.type === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <div>
                        <p className="text-sm font-medium">{insight.title}</p>
                        <p className="text-xs text-gray-600">{insight.description}</p>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-gray-500">
                      <Eye className="h-8 w-8 mx-auto mb-2" />
                      <p>Insights will appear once you have more data</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Metrics Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Metrics</CardTitle>
              <CardDescription>Comprehensive subscription statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <h4 className="font-medium">Acquisition Metrics</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>New Subscribers (This Month)</span>
                      <span>{analytics.detailedMetrics?.newSubscribers || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Conversion Rate</span>
                      <span>{(analytics.detailedMetrics?.conversionRate * 100)?.toFixed(2) || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cost Per Acquisition</span>
                      <span>${analytics.detailedMetrics?.cpa?.toFixed(2) || 0}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Retention Metrics</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>30-Day Retention</span>
                      <span>{(analytics.detailedMetrics?.retention30 * 100)?.toFixed(1) || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>90-Day Retention</span>
                      <span>{(analytics.detailedMetrics?.retention90 * 100)?.toFixed(1) || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Annual Retention</span>
                      <span>{(analytics.detailedMetrics?.retentionAnnual * 100)?.toFixed(1) || 0}%</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Revenue Metrics</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>ARPU</span>
                      <span>${analytics.detailedMetrics?.arpu?.toFixed(2) || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly Growth Rate</span>
                      <span>{(analytics.detailedMetrics?.growthRate * 100)?.toFixed(1) || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Revenue per Visitor</span>
                      <span>${analytics.detailedMetrics?.rpv?.toFixed(2) || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 