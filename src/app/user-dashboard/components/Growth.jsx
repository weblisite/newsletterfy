"use client";
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const Growth = () => {
  const [promotions, setPromotions] = useState([]);
  const [newsletters, setNewsletters] = useState([]);
  const [funds, setFunds] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [newPromotion, setNewPromotion] = useState({
    title: '',
    description: '',
    newsletter_id: '',
    pricePerSubscriber: '',
    dailyBudget: '',
    totalBudget: '',
    targetNiche: 'general',
    startDate: '',
    endDate: ''
  });

  // Fetch all data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchPromotions(),
        fetchNewsletters(),
        fetchFunds()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPromotions = async () => {
    try {
      const response = await fetch('/api/user/cross-promotions');
      const data = await response.json();
      if (response.ok) {
        setPromotions(data.promotions);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error fetching promotions:', error);
      toast.error('Failed to load promotions');
    }
  };

  const fetchNewsletters = async () => {
    try {
      const response = await fetch('/api/user/newsletters');
      const data = await response.json();
      if (response.ok) {
        setNewsletters(data.newsletters);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error fetching newsletters:', error);
      // Don't show error toast for newsletters as they might not exist yet
      setNewsletters([]);
    }
  };

  const fetchFunds = async () => {
    try {
      const response = await fetch('/api/user/funds');
      const data = await response.json();
      if (response.ok) {
        setFunds(data.funds);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error fetching funds:', error);
      // Set default funds for development
      setFunds({ balance: 5000, total_earned: 2000, total_spent: 1000 });
    }
  };

  const handleCreatePromotion = async (e) => {
    e.preventDefault();
    
    // Validate funds
    if (funds && parseFloat(newPromotion.totalBudget) > funds.balance) {
      toast.error(`Insufficient funds. Your balance is $${funds.balance}`);
      return;
    }

    try {
      const response = await fetch('/api/user/cross-promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPromotion)
      });

      const data = await response.json();
      if (response.ok) {
        toast.success('✅ Cross-promotion created successfully!');
        setPromotions([data.promotion, ...promotions]);
        setNewPromotion({
          title: '',
          description: '',
          newsletter_id: '',
          pricePerSubscriber: '',
          dailyBudget: '',
          totalBudget: '',
          targetNiche: 'general',
          startDate: '',
          endDate: ''
        });
        setShowCreateForm(false);
        
        // Refresh funds after spending
        fetchFunds();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error creating promotion:', error);
      toast.error(error.message || 'Failed to create promotion');
    }
  };

  const handleStatusUpdate = async (promotionId, newStatus) => {
    try {
      const response = await fetch('/api/user/cross-promotions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: promotionId, status: newStatus })
      });

      const data = await response.json();
      if (response.ok) {
        setPromotions(promotions.map(p => 
          p.id === promotionId ? { ...p, status: newStatus } : p
        ));
        toast.success(`Promotion ${newStatus} successfully`);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error updating promotion:', error);
      toast.error('Failed to update promotion status');
    }
  };

  const handleQuickCreateNewsletter = async () => {
    const name = prompt('Enter newsletter name:');
    if (!name) return;

    try {
      const response = await fetch('/api/user/newsletters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newsletter_name: name,
          description: 'Created for cross-promotion',
          subscriber_count: 0,
          niche: newPromotion.targetNiche
        })
      });

      const data = await response.json();
      if (response.ok) {
        setNewsletters([data.newsletter, ...newsletters]);
        setNewPromotion({ ...newPromotion, newsletter_id: data.newsletter.id });
        toast.success('Newsletter created successfully!');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error creating newsletter:', error);
      toast.error('Failed to create newsletter');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
          <p className="mt-2 text-gray-600">Loading growth data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Funds Display */}
      <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Newsletter Growth Hub</h2>
            <p className="text-cyan-100">Grow your audience through cross-promotions</p>
          </div>
          {funds && (
            <div className="text-right">
              <div className="text-2xl font-bold">${funds.balance?.toFixed(2) || '0.00'}</div>
              <div className="text-sm text-cyan-100">Available Balance</div>
              <div className="text-xs text-cyan-200">
                Earned: ${funds.total_earned?.toFixed(2) || '0.00'} | 
                Spent: ${funds.total_spent?.toFixed(2) || '0.00'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-cyan-600 text-white px-6 py-2 rounded-lg hover:bg-cyan-700 transition-colors"
        >
          + Create Cross-Promotion
        </button>
        <a
          href="/cross-promotions-marketplace"
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          🛍️ Browse Marketplace
        </a>
      </div>

      {/* Create Promotion Form */}
      {showCreateForm && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Create New Cross-Promotion</h3>
            <button 
              onClick={() => setShowCreateForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleCreatePromotion} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Promotion Title
                </label>
                <input
                  type="text"
                  value={newPromotion.title}
                  onChange={(e) => setNewPromotion({...newPromotion, title: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="e.g., Tech Weekly Newsletter"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Associated Newsletter
                </label>
                <div className="flex space-x-2">
                  <select
                    value={newPromotion.newsletter_id}
                    onChange={(e) => setNewPromotion({...newPromotion, newsletter_id: e.target.value})}
                    className="flex-1 px-3 py-2 border rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                  >
                    <option value="">Select a newsletter</option>
                    {newsletters.map(newsletter => (
                      <option key={newsletter.id} value={newsletter.id}>
                        {newsletter.newsletter_name} ({newsletter.subscriber_count} subs)
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleQuickCreateNewsletter}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    title="Create new newsletter"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={newPromotion.description}
                onChange={(e) => setNewPromotion({...newPromotion, description: e.target.value})}
                className="w-full px-3 py-2 border rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                rows="3"
                placeholder="Describe your newsletter and target audience..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price per Subscriber
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newPromotion.pricePerSubscriber}
                  onChange={(e) => setNewPromotion({...newPromotion, pricePerSubscriber: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="2.50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Daily Budget
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newPromotion.dailyBudget}
                  onChange={(e) => setNewPromotion({...newPromotion, dailyBudget: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="100.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Budget
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newPromotion.totalBudget}
                  onChange={(e) => setNewPromotion({...newPromotion, totalBudget: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="1000.00"
                  required
                />
                {funds && parseFloat(newPromotion.totalBudget) > funds.balance && (
                  <p className="text-red-500 text-sm mt-1">
                    Insufficient funds (Available: ${funds.balance})
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Niche
                </label>
                <select
                  value={newPromotion.targetNiche}
                  onChange={(e) => setNewPromotion({...newPromotion, targetNiche: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                  required
                >
                  <option value="general">General</option>
                  <option value="tech">Technology</option>
                  <option value="business">Business</option>
                  <option value="finance">Finance</option>
                  <option value="health">Health & Fitness</option>
                  <option value="lifestyle">Lifestyle</option>
                  <option value="education">Education</option>
                  <option value="entertainment">Entertainment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={newPromotion.startDate}
                  onChange={(e) => setNewPromotion({...newPromotion, startDate: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={newPromotion.endDate}
                  onChange={(e) => setNewPromotion({...newPromotion, endDate: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700"
                disabled={funds && parseFloat(newPromotion.totalBudget) > funds.balance}
              >
                Create Promotion
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Promotions List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Your Cross-Promotions</h3>
        </div>

        {promotions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No cross-promotions yet. Create your first one to get started!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {promotions.map((promotion) => (
              <div key={promotion.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-lg font-medium">{promotion.title}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        promotion.status === 'active' ? 'bg-green-100 text-green-800' :
                        promotion.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {promotion.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-1">{promotion.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <div className="text-sm text-gray-500">Price/Subscriber</div>
                        <div className="font-medium">${promotion.price_per_subscriber}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Budget Spent</div>
                        <div className="font-medium">${promotion.spent || 0} / ${promotion.total_budget}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Subscribers Gained</div>
                        <div className="font-medium">{promotion.subscribers_gained || 0}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Target Niche</div>
                        <div className="font-medium capitalize">{promotion.target_niche}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    {promotion.status === 'active' ? (
                      <button
                        onClick={() => handleStatusUpdate(promotion.id, 'paused')}
                        className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
                      >
                        Pause
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusUpdate(promotion.id, 'active')}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Resume
                      </button>
                    )}
                    <button
                      onClick={() => handleStatusUpdate(promotion.id, 'ended')}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      End
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Growth; 