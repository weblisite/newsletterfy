"use client";

// Prevent static generation for this page since it requires authentication
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Eye, 
  MousePointer, 
  DollarSign, 
  Plus,
  BarChart3,
  Target,
  Users,
  Calendar,
  Settings as SettingsIcon
} from 'lucide-react';
import CampaignCreation from './components/CampaignCreation';
import CampaignManagement from './components/CampaignManagement';
import BrandAnalytics from './components/BrandAnalytics';
import BrandSettings from './components/BrandSettings';

export default function BrandDashboard() {
  const [loading, setLoading] = useState(true);
  const [brandProfile, setBrandProfile] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalSpent: 0,
    totalImpressions: 0,
    totalClicks: 0,
    averageCTR: 0,
    activeCampaigns: 0,
    pendingApprovals: 0
  });
  const [funds, setFunds] = useState({
    balance: 0,
    totalDeposited: 0,
    totalSpent: 0
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [showCampaignCreation, setShowCampaignCreation] = useState(false);

  useEffect(() => {
    fetchBrandData();
  }, []);

  const fetchBrandData = async () => {
    try {
      setLoading(true);
      
      // Fetch brand profile and data
      const [profileRes, campaignsRes, analyticsRes, fundsRes] = await Promise.all([
        fetch('/api/brand/profile'),
        fetch('/api/brand/campaigns'),
        fetch('/api/brand/analytics'),
        fetch('/api/brand/funds')
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setBrandProfile(profileData.brand);
      }

      if (campaignsRes.ok) {
        const campaignsData = await campaignsRes.json();
        setCampaigns(campaignsData.campaigns);
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
      }

      if (fundsRes.ok) {
        const fundsData = await fundsRes.json();
        setFunds(fundsData);
      }
    } catch (error) {
      toast.error('Failed to load brand dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCampaignCreated = (newCampaign) => {
    setCampaigns([newCampaign, ...campaigns]);
    setShowCampaignCreation(false);
    toast.success('Campaign created successfully!');
    fetchBrandData(); // Refresh data
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center py-16">
          <div className="h-8 w-8 animate-spin mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full"></div>
          <p className="text-gray-600">Loading your brand dashboard...</p>
        </div>
      </div>
    );
  }

  if (!brandProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center py-16 max-w-md">
          <h2 className="text-2xl font-bold mb-4">Welcome to Brand Dashboard</h2>
          <p className="text-gray-600 mb-6">
            You need to set up your brand profile to start creating sponsored ad campaigns.
          </p>
          <Button onClick={() => setActiveTab('settings')} className="w-full">
            Set Up Brand Profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              {brandProfile.logo_url && (
                <img 
                  src={brandProfile.logo_url} 
                  alt={brandProfile.brand_name}
                  className="h-12 w-12 rounded-lg object-cover"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {brandProfile.brand_name}
                </h1>
                <p className="text-gray-600">{brandProfile.industry}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Available Balance</p>
                <p className="text-xl font-bold text-green-600">
                  ${funds.balance.toFixed(2)}
                </p>
              </div>
              <Button 
                onClick={() => setShowCampaignCreation(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Campaign
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Analytics Cards */}
            <div className="grid gap-6 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${analytics.totalSpent.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">Campaign spending</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Impressions</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalImpressions.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Total ad views</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Clicks</CardTitle>
                  <MousePointer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalClicks.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Total clicks</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average CTR</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.averageCTR.toFixed(2)}%</div>
                  <p className="text-xs text-muted-foreground">Click-through rate</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Campaigns */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Campaigns</CardTitle>
                <CardDescription>Your latest sponsored ad campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                {campaigns.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
                    <p className="text-gray-600 mb-4">Create your first sponsored ad campaign to reach newsletter audiences.</p>
                    <Button onClick={() => setShowCampaignCreation(true)}>
                      Create Your First Campaign
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {campaigns.slice(0, 5).map((campaign) => (
                      <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h4 className="font-medium">{campaign.campaign_name}</h4>
                            <p className="text-sm text-gray-600">{campaign.ad_title}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Badge variant={
                            campaign.status === 'active' ? 'default' : 
                            campaign.status === 'pending' ? 'secondary' : 
                            'outline'
                          }>
                            {campaign.status}
                          </Badge>
                          <div className="text-right">
                            <p className="text-sm font-medium">${campaign.spent.toFixed(2)}</p>
                            <p className="text-xs text-gray-600">spent</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns">
            <CampaignManagement 
              campaigns={campaigns} 
              onCampaignUpdate={fetchBrandData}
            />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <BrandAnalytics 
              campaigns={campaigns}
              analytics={analytics}
            />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <BrandSettings 
              brandProfile={brandProfile}
              onProfileUpdate={(updatedProfile) => {
                setBrandProfile(updatedProfile);
                toast.success('Brand profile updated successfully');
              }}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Campaign Creation Modal */}
      {showCampaignCreation && (
        <CampaignCreation
          onClose={() => setShowCampaignCreation(false)}
          onCampaignCreated={handleCampaignCreated}
          brandProfile={brandProfile}
          availableBalance={funds.balance}
        />
      )}
    </div>
  );
} 