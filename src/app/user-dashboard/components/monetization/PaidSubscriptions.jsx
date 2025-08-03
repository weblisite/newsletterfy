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
import { Plus, X, Users, DollarSign, Newspaper, ArrowUpRight } from 'lucide-react';

export default function PaidSubscriptions({ onClose }) {
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalSubscribers: 0,
    monthlyRevenue: 0,
    userShare: 0,
    platformFee: 0,
    activeTiers: 0
  });
  const [tiers, setTiers] = useState([]);
  const [showNewTierForm, setShowNewTierForm] = useState(false);
  const [newTier, setNewTier] = useState({
    name: '',
    price: '',
    description: '',
    features: [''],
    status: 'active',
    billingPeriod: 'monthly'
  });

  useEffect(() => {
    fetchSubscriptions();
    fetchTiers();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch('/api/monetization/subscriptions');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSubscriptions(data.subscriptions);
      setAnalytics(data.analytics);
    } catch (error) {
      toast.error('Failed to fetch subscriptions');
      console.error(error);
    }
  };

  const fetchTiers = async () => {
    try {
      const res = await fetch('/api/monetization/subscription-tiers');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTiers(data.tiers);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch subscription tiers');
      console.error(error);
      setLoading(false);
    }
  };

  const handleNewTierSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/monetization/subscription-tiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTier)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setTiers([...tiers, data.tier]);
      setNewTier({
        name: '',
        price: '',
        description: '',
        features: [''],
        status: 'active',
        billingPeriod: 'monthly'
      });
      setShowNewTierForm(false);
      toast.success('Subscription tier created successfully');
    } catch (error) {
      toast.error('Failed to create subscription tier');
      console.error(error);
    }
  };

  const handleTierStatusChange = async (tierId, newStatus) => {
    try {
      const res = await fetch('/api/monetization/subscription-tiers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tierId, status: newStatus })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setTiers(tiers.map(tier => 
        tier.id === tierId ? { ...tier, status: newStatus } : tier
      ));
      toast.success('Tier status updated successfully');
    } catch (error) {
      toast.error('Failed to update tier status');
      console.error(error);
    }
  };

  const addFeature = () => {
    setNewTier({ ...newTier, features: [...newTier.features, ''] });
  };

  const removeFeature = (index) => {
    const updatedFeatures = newTier.features.filter((_, i) => i !== index);
    setNewTier({ ...newTier, features: updatedFeatures });
  };

  const updateFeature = (index, value) => {
    const updatedFeatures = [...newTier.features];
    updatedFeatures[index] = value;
    setNewTier({ ...newTier, features: updatedFeatures });
  };

  const viewSubscribers = async (tierId) => {
    // Implement subscriber list view functionality
    toast.success('Viewing subscribers... (To be implemented)');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center py-16">
          <div className="h-8 w-8 animate-spin mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-background">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Paid Subscriptions</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Analytics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalSubscribers}</div>
              <p className="text-xs text-muted-foreground">Active paid subscribers</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${analytics.monthlyRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Recurring revenue</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Share</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${analytics.userShare.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">80% of subscription revenue</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tiers</CardTitle>
              <Newspaper className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.activeTiers}</div>
              <p className="text-xs text-muted-foreground">Subscription plans</p>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Tiers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Subscription Tiers</CardTitle>
              <CardDescription>Create and manage your subscription plans</CardDescription>
            </div>
            <Button onClick={() => setShowNewTierForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Plan
            </Button>
          </CardHeader>
          <CardContent>
            {showNewTierForm && (
              <form onSubmit={handleNewTierSubmit} className="space-y-4 mb-6 p-4 border rounded-lg bg-muted/50">
                <Input
                  placeholder="Plan Name"
                  value={newTier.name}
                  onChange={(e) => setNewTier({ ...newTier, name: e.target.value })}
                  required
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    type="number"
                    placeholder="Price ($)"
                    value={newTier.price}
                    onChange={(e) => setNewTier({ ...newTier, price: e.target.value })}
                    required
                    min="1"
                    step="0.01"
                  />
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={newTier.billingPeriod}
                    onChange={(e) => setNewTier({ ...newTier, billingPeriod: e.target.value })}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <Textarea
                  placeholder="Description"
                  value={newTier.description}
                  onChange={(e) => setNewTier({ ...newTier, description: e.target.value })}
                />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Features</p>
                  {newTier.features.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Feature description"
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removeFeature(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addFeature}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Feature
                  </Button>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewTierForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Create Plan</Button>
                </div>
              </form>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {tiers.map((tier) => (
                <Card key={tier.id} className="relative">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{tier.name}</CardTitle>
                      <Badge variant={tier.status === 'active' ? 'success' : 'secondary'}>
                        {tier.status}
                      </Badge>
                    </div>
                    <CardDescription>
                      ${tier.price}/{tier.billingPeriod}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{tier.description}</p>
                    {tier.features?.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Features:</p>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {tier.features.map((feature, index) => (
                            <li key={index} className="text-muted-foreground">{feature}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">Active</span>
                        <Switch
                          checked={tier.status === 'active'}
                          onCheckedChange={(checked) =>
                            handleTierStatusChange(tier.id, checked ? 'active' : 'inactive')
                          }
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewSubscribers(tier.id)}
                      >
                        View Subscribers
                        <ArrowUpRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Subscriptions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Subscriptions</CardTitle>
            <CardDescription>Your latest subscription activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subscriptions.map((subscription) => (
                <Card key={subscription.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">
                        {subscription.subscriber_id.slice(0, 8)}... subscribed to {subscription.tier_name}
                      </p>
                      <Badge variant="outline" className="mt-2">
                        ${subscription.amount}/{subscription.billing_period}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {new Date(subscription.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm font-medium text-green-600 mt-1">
                        Your share: ${(subscription.amount * 0.8).toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {subscriptions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No subscriptions yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 