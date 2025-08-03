"use client";
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function CrossPromotions({ crossPromotions, onClose }) {
  const [activeTab, setActiveTab] = useState('marketplace');
  const [applications, setApplications] = useState([]);
  const [availableOpportunities, setAvailableOpportunities] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchApplications();
    fetchAvailableOpportunities();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/cross-promotions/applications');
      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    }
  };

  const fetchAvailableOpportunities = async () => {
    try {
      const response = await fetch('/api/cross-promotions/marketplace');
      if (response.ok) {
        const data = await response.json();
        setAvailableOpportunities(data.opportunities || []);
      }
    } catch (error) {
      console.error('Failed to fetch marketplace opportunities:', error);
    }
  };

  const applyToOpportunity = async (opportunityId) => {
    setLoading(true);
    try {
      const response = await fetch('/api/cross-promotions/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunity_id: opportunityId })
      });

      if (response.ok) {
        toast.success('Application submitted successfully!');
        fetchApplications();
        fetchAvailableOpportunities();
      } else {
        throw new Error('Failed to submit application');
      }
    } catch (error) {
      toast.error('Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const TabButton = ({ id, label, count = null }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
        activeTab === id
          ? 'bg-cyan-500 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {label}
      {count !== null && (
        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
          activeTab === id ? 'bg-cyan-400' : 'bg-gray-300'
        }`}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Cross-Promotions Management</h3>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        <TabButton 
          id="marketplace" 
          label="Browse Marketplace" 
          count={availableOpportunities.length} 
        />
        <TabButton 
          id="applications" 
          label="My Applications" 
          count={applications.length} 
        />
        <TabButton 
          id="active" 
          label="Active Promotions" 
          count={crossPromotions.filter(p => p.status === 'active').length} 
        />
        <TabButton 
          id="analytics" 
          label="Performance Analytics" 
        />
      </div>

      {/* Marketplace Tab */}
      {activeTab === 'marketplace' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-medium text-gray-900">Available Cross-Promotion Opportunities</h4>
            <button
              onClick={fetchAvailableOpportunities}
              className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
            >
              <i className="fas fa-sync-alt mr-2"></i>
              Refresh
            </button>
          </div>

          {availableOpportunities.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <i className="fas fa-bullhorn text-4xl text-gray-400 mb-4"></i>
              <h5 className="text-lg font-medium text-gray-900 mb-2">No Opportunities Available</h5>
              <p className="text-gray-600">Check back later for new cross-promotion opportunities.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {availableOpportunities.map((opportunity) => (
                <div key={opportunity.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-1">{opportunity.newsletter_name}</h5>
                      <p className="text-sm text-gray-600">{opportunity.description}</p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                      ${opportunity.revenue_per_click}/click
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-600">Subscribers</p>
                      <p className="font-medium">{opportunity.subscribers?.toLocaleString() || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Category</p>
                      <p className="font-medium">{opportunity.category || 'General'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Budget</p>
                      <p className="font-medium">${opportunity.budget || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Duration</p>
                      <p className="font-medium">{opportunity.duration || 'Ongoing'}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => applyToOpportunity(opportunity.id)}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Applying...' : 'Apply Now'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Applications Tab */}
      {activeTab === 'applications' && (
        <div className="space-y-6">
          <h4 className="text-lg font-medium text-gray-900">My Applications</h4>
          
          {applications.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <i className="fas fa-file-alt text-4xl text-gray-400 mb-4"></i>
              <h5 className="text-lg font-medium text-gray-900 mb-2">No Applications Yet</h5>
              <p className="text-gray-600 mb-4">You haven't applied to any cross-promotion opportunities.</p>
              <button
                onClick={() => setActiveTab('marketplace')}
                className="px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
              >
                Browse Marketplace
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {['pending', 'approved', 'rejected'].map(status => (
                <div key={status}>
                  <h5 className="font-medium text-gray-900 mb-3 capitalize">
                    {status} Applications ({applications.filter(app => app.status === status).length})
                  </h5>
                  <div className="space-y-3">
                    {applications.filter(app => app.status === status).map((application) => (
                      <div key={application.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h6 className="font-medium text-gray-900">{application.newsletter_name}</h6>
                            <p className="text-sm text-gray-600 mt-1">{application.description}</p>
                            <div className="flex items-center mt-2 text-sm text-gray-500">
                              <span>Applied: {new Date(application.created_at).toLocaleDateString()}</span>
                              <span className="mx-2">•</span>
                              <span>Budget: ${application.budget}</span>
                            </div>
                          </div>
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            status === 'approved' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {status}
                          </span>
                        </div>
                        {application.admin_notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <strong>Notes:</strong> {application.admin_notes}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Active Promotions Tab */}
      {activeTab === 'active' && (
        <div className="space-y-6">
          <h4 className="text-lg font-medium text-gray-900">Active Cross-Promotions</h4>
          
          {crossPromotions.filter(promo => promo.status === 'active').length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <i className="fas fa-chart-line text-4xl text-gray-400 mb-4"></i>
              <h5 className="text-lg font-medium text-gray-900 mb-2">No Active Promotions</h5>
              <p className="text-gray-600 mb-4">You don't have any active cross-promotions running.</p>
              <button
                onClick={() => setActiveTab('marketplace')}
                className="px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
              >
                Browse Opportunities
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {crossPromotions.filter(promo => promo.status === 'active').map((promo) => (
                <div key={promo.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h5 className="font-semibold text-gray-900">{promo.newsletterName}</h5>
                      <p className="text-sm text-gray-600">{promo.description}</p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                      Active
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-600">Subscribers</p>
                      <p className="font-medium">{promo.subscribers?.toLocaleString() || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Revenue per Click</p>
                      <p className="font-medium">${promo.revenuePerClick?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Clicks</p>
                      <p className="font-medium">{promo.clicks || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Revenue</p>
                      <p className="font-medium text-green-600">${promo.revenue?.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>
                  <div className="mb-4 text-sm text-gray-600">
                    <p>Duration: {promo.startDate || 'N/A'} - {promo.endDate || 'Ongoing'}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                      View Details
                    </button>
                    <button className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
                      Pause
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <h4 className="text-lg font-medium text-gray-900">Performance Analytics</h4>
          
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <i className="fas fa-mouse-pointer text-blue-600"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Total Clicks</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {crossPromotions.reduce((sum, promo) => sum + (promo.clicks || 0), 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <i className="fas fa-dollar-sign text-green-600"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${crossPromotions.reduce((sum, promo) => sum + (promo.revenue || 0), 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-3 bg-cyan-100 rounded-lg">
                  <i className="fas fa-hand-holding-usd text-cyan-600"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Your Share (80%)</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${(crossPromotions.reduce((sum, promo) => sum + (promo.revenue || 0), 0) * 0.8).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <i className="fas fa-chart-line text-purple-600"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Active Promotions</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {crossPromotions.filter(promo => promo.status === 'active').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h5 className="font-medium text-gray-900 mb-4">Revenue Breakdown</h5>
            <div className="space-y-3">
              {crossPromotions.map((promo) => (
                <div key={promo.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{promo.newsletterName || 'Unknown Newsletter'}</p>
                    <p className="text-sm text-gray-600">{promo.clicks || 0} clicks</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">${(promo.revenue || 0).toFixed(2)}</p>
                    <p className="text-sm text-green-600">+${((promo.revenue || 0) * 0.8).toFixed(2)} your share</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h5 className="font-medium text-gray-900 mb-4">Quick Actions</h5>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setActiveTab('marketplace')}
                className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
              >
                <i className="fas fa-search mr-2"></i>
                Find New Opportunities
              </button>
              <button
                onClick={fetchApplications}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <i className="fas fa-sync-alt mr-2"></i>
                Refresh Data
              </button>
              <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                <i className="fas fa-download mr-2"></i>
                Export Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 