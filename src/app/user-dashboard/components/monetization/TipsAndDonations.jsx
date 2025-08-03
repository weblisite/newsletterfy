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
import { Plus, X } from 'lucide-react';

export default function TipsAndDonations({ user, onClose }) {
  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalDonations: 0,
    totalAmount: 0,
    userShare: 0,
    platformFee: 0,
    uniqueDonors: 0
  });
  const [tiers, setTiers] = useState([]);
  const [showNewTierForm, setShowNewTierForm] = useState(false);
  const [newTier, setNewTier] = useState({
    name: '',
    amount: '',
    description: '',
    perks: [''],
    status: 'active'
  });

  useEffect(() => {
    fetchDonations();
    fetchTiers();
  }, []);

  const fetchDonations = async () => {
    try {
      const res = await fetch('/api/monetization/donations');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDonations(data.donations);
      setAnalytics(data.analytics);
    } catch (error) {
      toast.error('Failed to fetch donations');
      console.error(error);
    }
  };

  const fetchTiers = async () => {
    try {
      const res = await fetch('/api/monetization/donation-tiers');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTiers(data.tiers);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch donation tiers');
      console.error(error);
      setLoading(false);
    }
  };

  const handleNewTierSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/monetization/donation-tiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTier)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setTiers([...tiers, data.tier]);
      setNewTier({ name: '', amount: '', description: '', perks: [''], status: 'active' });
      setShowNewTierForm(false);
      toast.success('Donation tier created successfully');
    } catch (error) {
      toast.error('Failed to create donation tier');
      console.error(error);
    }
  };

  const handleTierStatusChange = async (tierId, newStatus) => {
    try {
      const res = await fetch('/api/monetization/donation-tiers', {
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

  const addPerk = () => {
    setNewTier({ ...newTier, perks: [...newTier.perks, ''] });
  };

  const removePerk = (index) => {
    const updatedPerks = newTier.perks.filter((_, i) => i !== index);
    setNewTier({ ...newTier, perks: updatedPerks });
  };

  const updatePerk = (index, value) => {
    const updatedPerks = [...newTier.perks];
    updatedPerks[index] = value;
    setNewTier({ ...newTier, perks: updatedPerks });
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
        <h2 className="text-3xl font-bold tracking-tight">Tips & Donations</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Status Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-blue-800">
              🎉 Tips & Donations System Ready!
            </h3>
            <div className="mt-1 text-sm text-blue-700">
              <p>Your donation system is fully set up! Supporters can visit your donation page to support you. Donation sections are automatically added to your newsletters.</p>
              <div className="mt-2">
                <a 
                  href={`/donate/${user?.id || 'creator'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                >
                  📄 View Your Donation Page →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Analytics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalDonations}</div>
              <p className="text-xs text-muted-foreground">Lifetime donations received</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${analytics.totalAmount.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Total value received</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Share</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${analytics.userShare.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">80% of total donations</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Donors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.uniqueDonors}</div>
              <p className="text-xs text-muted-foreground">Individual supporters</p>
            </CardContent>
          </Card>
        </div>

        {/* Donation Tiers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Donation Tiers</CardTitle>
              <CardDescription>Create and manage your donation tiers</CardDescription>
            </div>
            <Button onClick={() => setShowNewTierForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Tier
            </Button>
          </CardHeader>
          <CardContent>
            {showNewTierForm && (
              <form onSubmit={handleNewTierSubmit} className="space-y-4 mb-6 p-4 border rounded-lg bg-muted/50">
                <Input
                  placeholder="Tier Name"
                  value={newTier.name}
                  onChange={(e) => setNewTier({ ...newTier, name: e.target.value })}
                  required
                />
                <Input
                  type="number"
                  placeholder="Amount ($)"
                  value={newTier.amount}
                  onChange={(e) => setNewTier({ ...newTier, amount: e.target.value })}
                  required
                  min="1"
                  step="0.01"
                />
                <Textarea
                  placeholder="Description"
                  value={newTier.description}
                  onChange={(e) => setNewTier({ ...newTier, description: e.target.value })}
                />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Perks</p>
                  {newTier.perks.map((perk, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Perk description"
                        value={perk}
                        onChange={(e) => updatePerk(index, e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removePerk(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addPerk}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Perk
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
                  <Button type="submit">Create Tier</Button>
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
                    <CardDescription>${tier.amount}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{tier.description}</p>
                    {tier.perks?.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Perks:</p>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {tier.perks.map((perk, index) => (
                            <li key={index} className="text-muted-foreground">{perk}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <span className="text-sm">Active</span>
                      <Switch
                        checked={tier.status === 'active'}
                        onCheckedChange={(checked) =>
                          handleTierStatusChange(tier.id, checked ? 'active' : 'inactive')
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Donations */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Donations</CardTitle>
            <CardDescription>Your most recent donations and tips</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {donations.map((donation) => (
                <Card key={donation.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">
                        {donation.donor_id 
                          ? `${donation.donor_id.slice(0, 8)}... donated $${donation.amount}`
                          : donation.supporter 
                            ? `${donation.supporter} donated $${donation.amount}`
                            : `Anonymous supporter donated $${donation.amount}`
                        }
                      </p>
                      {donation.message && (
                        <p className="text-sm text-muted-foreground mt-1">{donation.message}</p>
                      )}
                      {donation.donation_tier && (
                        <Badge variant="outline" className="mt-2">
                          {donation.donation_tier.name}
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {new Date(donation.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm font-medium text-green-600 mt-1">
                        Your share: ${(donation.amount * 0.8).toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {donations.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No donations received yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 