"use client";
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Eye, MousePointer, TrendingUp, Target, Calendar, Gift, Edit } from 'lucide-react';
import SponsoredAdOpportunities from './SponsoredAdOpportunities';

export default function SponsoredAds({ sponsoredAds, onClose, onPushToNewsletter }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [earnings, setEarnings] = useState([]);
  const [availableOpportunities, setAvailableOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSponsoredAdsData();
  }, []);

  const fetchSponsoredAdsData = async () => {
    try {
      setLoading(true);
      
      // Fetch publisher ad earnings
      const earningsResponse = await fetch('/api/publisher/ad-earnings');
      if (earningsResponse.ok) {
        const earningsData = await earningsResponse.json();
        setEarnings(earningsData.earnings || []);
      }

      // Fetch available sponsored ad opportunities
      const opportunitiesResponse = await fetch('/api/sponsored-ads/opportunities');
      if (opportunitiesResponse.ok) {
        const opportunitiesData = await opportunitiesResponse.json();
        setAvailableOpportunities(opportunitiesData.opportunities || []);
      }
    } catch (error) {
      console.error('Error fetching sponsored ads data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePushToNewsletter = (adContent) => {
    if (onPushToNewsletter) {
      onPushToNewsletter(adContent);
    }
  };

  const totalEarnings = earnings.reduce((sum, earning) => sum + earning.net_amount, 0);
  const totalClicks = earnings.reduce((sum, earning) => sum + earning.clicks, 0);
  const averageEarningPerClick = totalClicks > 0 ? totalEarnings / totalClicks : 0;

  const TabButton = ({ id, label, count }) => (
    <button
      className={`px-4 py-2 rounded-lg transition-colors relative ${
        activeTab === id
          ? 'bg-cyan-500 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
      onClick={() => setActiveTab(id)}
    >
      {label}
      {count > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Sponsored Ads Management</h3>
        <div className="flex items-center space-x-3">
          {onPushToNewsletter && (
            <button
              onClick={() => handlePushToNewsletter(null)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              <Edit className="h-4 w-4 mr-2 inline" />
              Go to Newsletter
            </button>
          )}
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 mb-6">
        <TabButton id="overview" label="Overview" count={0} />
        <TabButton id="opportunities" label="Opportunities" count={availableOpportunities.length} />
        <TabButton id="earnings" label="Earnings" count={0} />
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalEarnings.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">80% revenue share</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalClicks}</div>
                <p className="text-xs text-muted-foreground">All campaigns</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Earnings/Click</CardTitle>
                <MousePointer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${averageEarningPerClick.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Per click revenue</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Opportunities</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{availableOpportunities.length}</div>
                <p className="text-xs text-muted-foreground">Available to accept</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Campaigns */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Campaign Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {earnings.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No earnings yet</h3>
                  <p className="text-gray-600 mb-4">You'll see your sponsored ad earnings here once you start accepting opportunities.</p>
                  {availableOpportunities.length > 0 && (
                    <button
                      onClick={() => setActiveTab('opportunities')}
                      className="px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                    >
                      View Available Opportunities
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {earnings.slice(0, 5).map((earning) => (
                    <div key={earning.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Campaign #{earning.campaign_id.substring(0, 8)}</p>
                        <p className="text-sm text-gray-600">{earning.clicks} clicks • {earning.impressions} impressions</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">${earning.net_amount.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">Net earnings (80% share)</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Opportunities Tab */}
      {activeTab === 'opportunities' && (
        <SponsoredAdOpportunities 
          opportunities={availableOpportunities}
          onRefresh={fetchSponsoredAdsData}
          onPushToNewsletter={handlePushToNewsletter}
        />
      )}

      {/* Earnings Tab */}
      {activeTab === 'earnings' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              {earnings.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No earnings data</h3>
                  <p className="text-gray-600 mb-4">Your sponsored ad earnings will appear here once you accept opportunities and start promoting ads.</p>
                  {availableOpportunities.length > 0 && (
                    <button
                      onClick={() => setActiveTab('opportunities')}
                      className="px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                    >
                      View Available Opportunities
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {earnings.map((earning) => (
                    <div key={earning.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium">Campaign #{earning.campaign_id.substring(0, 8)}</h4>
                          <p className="text-sm text-gray-600">{new Date(earning.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">${earning.net_amount.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">Net (80% share)</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Clicks</p>
                          <p className="font-medium">{earning.clicks}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Impressions</p>
                          <p className="font-medium">{earning.impressions}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">CTR</p>
                          <p className="font-medium">{(earning.clicks / earning.impressions * 100).toFixed(2)}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}