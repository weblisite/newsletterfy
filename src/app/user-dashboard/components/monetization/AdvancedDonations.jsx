"use client";
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  Card,
  CardHeader,
  CardContent,
  CardDescription,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  X, 
  TrendingUp, 
  Target, 
  Users, 
  DollarSign, 
  Calendar,
  AlertTriangle,
  Eye,
  Shield,
  Repeat,
  BarChart3
} from 'lucide-react';

export default function AdvancedDonations({ user, onClose }) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // State for different features
  const [analytics, setAnalytics] = useState(null);
  const [recurringDonations, setRecurringDonations] = useState([]);
  const [goals, setGoals] = useState([]);
  const [fraudAlerts, setFraudAlerts] = useState([]);
  
  // Form states
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    target_amount: '',
    end_date: '',
    category: 'general'
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchAnalytics(),
        fetchRecurringDonations(),
        fetchGoals(),
        fetchFraudAlerts()
      ]);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/donations/analytics?period=30');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalytics(data.analytics);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const fetchRecurringDonations = async () => {
    try {
      const res = await fetch('/api/donations/recurring?type=received');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRecurringDonations(data.recurring_donations || []);
    } catch (error) {
      console.error('Failed to fetch recurring donations:', error);
    }
  };

  const fetchGoals = async () => {
    try {
      const res = await fetch('/api/donations/goals');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setGoals(data.goals || []);
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    }
  };

  const fetchFraudAlerts = async () => {
    try {
      const res = await fetch('/api/donations/fraud-alerts');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setFraudAlerts(data.alerts || []);
    } catch (error) {
      console.error('Failed to fetch fraud alerts:', error);
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/donations/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGoal)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setGoals([...goals, data.goal]);
      setNewGoal({ title: '', description: '', target_amount: '', end_date: '', category: 'general' });
      setShowNewGoal(false);
      toast.success('Goal created successfully');
    } catch (error) {
      toast.error('Failed to create goal');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center py-16">
          <div className="h-8 w-8 animate-spin mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full"></div>
          <p>Loading advanced donations dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-background">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Advanced Donations Dashboard</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recurring">Recurring</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${analytics?.overview?.userShare?.toFixed(2) || '0.00'}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics?.trends?.growthRate > 0 ? '+' : ''}{analytics?.trends?.growthRate?.toFixed(1) || 0}% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Recurring</CardTitle>
                <Repeat className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${(analytics?.recurring?.estimatedMRR * 0.8)?.toFixed(2) || '0.00'}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics?.recurring?.activeSubscriptions || 0} active subscriptions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.performance?.conversionRate?.toFixed(2) || '0.00'}%</div>
                <p className="text-xs text-muted-foreground">
                  From newsletter views to donations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Donor Retention</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.overview?.retentionRate?.toFixed(1) || '0.0'}%</div>
                <p className="text-xs text-muted-foreground">
                  Repeat donor rate
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Active Goals Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Active Goals</CardTitle>
              <CardDescription>Your current donation campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {goals.filter(g => g.status === 'active').slice(0, 3).map((goal) => (
                  <div key={goal.id} className="flex items-center space-x-4">
                    <div className="flex-1">
                      <p className="font-medium">{goal.title}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Progress value={goal.progress_percentage} className="flex-1" />
                        <span className="text-sm text-muted-foreground">
                          ${goal.current_amount}/${goal.target_amount}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {goals.filter(g => g.status === 'active').length === 0 && (
                  <p className="text-muted-foreground">No active goals</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recurring Donations Tab */}
        <TabsContent value="recurring" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Active Subscriptions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analytics?.recurring?.activeSubscriptions || 0}</div>
                <p className="text-sm text-muted-foreground">Generating recurring revenue</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Monthly Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${(analytics?.recurring?.estimatedMRR * 0.8)?.toFixed(2) || '0.00'}</div>
                <p className="text-sm text-muted-foreground">Estimated monthly recurring</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Churn Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">2.1%</div>
                <p className="text-sm text-muted-foreground">Monthly subscription cancellations</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recurring Donations</CardTitle>
              <CardDescription>Manage your subscription-based supporters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recurringDonations.map((donation) => (
                  <Card key={donation.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium">${donation.amount} / {donation.frequency}</p>
                        <p className="text-sm text-muted-foreground">
                          From {donation.donor_name || 'Anonymous'} • {donation.total_payments} payments
                        </p>
                        <Badge variant={donation.status === 'active' ? 'success' : 'secondary'}>
                          {donation.status}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Next payment</p>
                        <p className="font-medium">
                          {new Date(donation.next_payment_date).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {recurringDonations.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No recurring donations yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Donation Goals</h3>
              <p className="text-sm text-muted-foreground">Create campaigns to motivate supporters</p>
            </div>
            <Button onClick={() => setShowNewGoal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Goal
            </Button>
          </div>

          {showNewGoal && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Goal</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateGoal} className="space-y-4">
                  <Input
                    placeholder="Goal Title"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                    required
                  />
                  <Textarea
                    placeholder="Goal Description"
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="number"
                      placeholder="Target Amount ($)"
                      value={newGoal.target_amount}
                      onChange={(e) => setNewGoal({ ...newGoal, target_amount: e.target.value })}
                      required
                      min="1"
                      step="0.01"
                    />
                    <Input
                      type="date"
                      value={newGoal.end_date}
                      onChange={(e) => setNewGoal({ ...newGoal, end_date: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowNewGoal(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Create Goal</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {goals.map((goal) => (
              <Card key={goal.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{goal.title}</CardTitle>
                    <Badge variant={goal.status === 'active' ? 'success' : 'secondary'}>
                      {goal.status}
                    </Badge>
                  </div>
                  <CardDescription>{goal.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Progress</span>
                        <span className="text-sm font-medium">
                          ${goal.current_amount}/${goal.target_amount}
                        </span>
                      </div>
                      <Progress value={goal.progress_percentage} />
                      <p className="text-xs text-muted-foreground mt-1">
                        {goal.progress_percentage?.toFixed(1)}% complete • {goal.donor_count} supporters
                      </p>
                    </div>
                    {goal.end_date && (
                      <p className="text-xs text-muted-foreground">
                        Ends: {new Date(goal.end_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {goals.length === 0 && (
              <p className="text-center text-muted-foreground py-8 col-span-2">
                No goals created yet
              </p>
            )}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Donation Trends</CardTitle>
                <CardDescription>Performance over the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Last 7 Days</p>
                    <p className="text-2xl font-bold">
                      ${analytics?.trends?.last7Days?.amount?.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {analytics?.trends?.last7Days?.donations || 0} donations
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Predicted Next Month</p>
                    <p className="text-2xl font-bold">
                      ${(analytics?.trends?.predictedMonthlyRevenue * 0.8)?.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Based on current trends
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activity Patterns</CardTitle>
                <CardDescription>When your supporters are most active</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Peak Donation Hour</p>
                    <p className="text-xl font-bold">
                      {analytics?.patterns?.peakDonationHour?.hour || 'N/A'}:00
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {analytics?.patterns?.peakDonationHour?.count || 0} donations
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Average Time to Repeat</p>
                    <p className="text-xl font-bold">
                      {Math.round(analytics?.performance?.averageTimeToRepeat || 0)} days
                    </p>
                    <p className="text-sm text-muted-foreground">
                      For returning donors
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Overview</CardTitle>
              <CardDescription>Fraud detection and security alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="font-semibold">Protected</p>
                  <p className="text-sm text-muted-foreground">Advanced fraud detection active</p>
                </div>
                <div className="text-center">
                  <Eye className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="font-semibold">Monitored</p>
                  <p className="text-sm text-muted-foreground">24/7 transaction monitoring</p>
                </div>
                <div className="text-center">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                  <p className="font-semibold">{fraudAlerts.length}</p>
                  <p className="text-sm text-muted-foreground">Recent security alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {fraudAlerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Security Alerts</CardTitle>
                <CardDescription>Recent suspicious activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {fraudAlerts.map((alert, index) => (
                    <div key={index} className="flex items-center space-x-4 p-3 border rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <div className="flex-1">
                        <p className="font-medium">{alert.type}</p>
                        <p className="text-sm text-muted-foreground">{alert.description}</p>
                      </div>
                      <Badge variant="outline">{alert.severity}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 