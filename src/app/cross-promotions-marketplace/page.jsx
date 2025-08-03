"use client";
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FaSearch, FaFilter, FaNewspaper, FaUsers, FaDollarSign, FaChartLine } from 'react-icons/fa';

export default function CrossPromotionsMarketplace() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [promotions, setPromotions] = useState([]);
  const [filters, setFilters] = useState({
    niche: '',
    minPrice: '',
    maxPrice: '',
    search: ''
  });

  useEffect(() => {
    fetchPromotions();
  }, [filters]);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.niche) queryParams.append('niche', filters.niche);
      if (filters.minPrice) queryParams.append('minPrice', filters.minPrice);
      if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice);
      if (filters.search) queryParams.append('search', filters.search);

      const response = await fetch(`/api/marketplace/cross-promotions?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch promotions');
      }

      const data = await response.json();
      setPromotions(data.promotions);
    } catch (error) {
      console.error('Error fetching promotions:', error);
      toast.error('Failed to load promotions');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (promotionId) => {
    try {
      setSaving(true);
      const response = await fetch('/api/marketplace/cross-promotions/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ promotionId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to apply for promotion');
      }

      toast.success('Application submitted successfully');
    } catch (error) {
      console.error('Error applying for promotion:', error);
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Cross-Promotions Marketplace</h1>
        <p className="mt-2 text-lg text-gray-600">
          Find and collaborate with other newsletter creators to grow your audience
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Active Promotions
            </h3>
            <FaNewspaper className="text-2xl text-cyan-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {promotions.filter(p => p.status === 'active').length}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Available opportunities
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Total Reach
            </h3>
            <FaUsers className="text-2xl text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {promotions.reduce((sum, p) => sum + (p.newsletter_subscribers || 0), 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Combined subscribers
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Avg. Price/Sub
            </h3>
            <FaDollarSign className="text-2xl text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${(promotions.reduce((sum, p) => sum + parseFloat(p.price_per_subscriber), 0) / promotions.length || 0).toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Per subscriber
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Success Rate
            </h3>
            <FaChartLine className="text-2xl text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {((promotions.filter(p => p.status === 'completed' && p.success).length / 
              promotions.filter(p => p.status === 'completed').length) * 100 || 0).toFixed(1)}%
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Successful promotions
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="floating-input-container">
            <div className="relative">
              <FaSearch className="absolute left-3 top-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="floating-input pl-10"
                placeholder=" "
              />
              <label className="floating-label">Search promotions</label>
            </div>
          </div>

          <div className="floating-input-container">
            <select
              value={filters.niche}
              onChange={(e) => setFilters({ ...filters, niche: e.target.value })}
              className="floating-input"
            >
              <option value="">All Niches</option>
              <option value="tech">Technology</option>
              <option value="business">Business</option>
              <option value="finance">Finance</option>
              <option value="health">Health & Wellness</option>
              <option value="lifestyle">Lifestyle</option>
              <option value="culture">Culture</option>
              <option value="education">Education</option>
              <option value="other">Other</option>
            </select>
            <label className="floating-label">Newsletter Niche</label>
          </div>

          <div className="floating-input-container">
            <div className="relative">
              <span className="absolute left-3 top-4 text-gray-400">$</span>
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                className="floating-input pl-7"
                placeholder=" "
                min="0"
                step="0.01"
              />
              <label className="floating-label">Min Price/Sub</label>
            </div>
          </div>

          <div className="floating-input-container">
            <div className="relative">
              <span className="absolute left-3 top-4 text-gray-400">$</span>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                className="floating-input pl-7"
                placeholder=" "
                min="0"
                step="0.01"
              />
              <label className="floating-label">Max Price/Sub</label>
            </div>
          </div>
        </div>
      </div>

      {/* Promotions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promotions.map((promotion) => (
          <div key={promotion.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {promotion.newsletter_name}
                  </h3>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-cyan-100 text-cyan-800">
                    {promotion.target_niche}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    ${parseFloat(promotion.price_per_subscriber).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">per subscriber</p>
                </div>
              </div>

              <p className="text-gray-600 mb-4 line-clamp-2">
                {promotion.description}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-gray-500">Daily Budget</p>
                  <p className="font-semibold">${parseFloat(promotion.daily_budget).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Total Budget</p>
                  <p className="font-semibold">${parseFloat(promotion.total_budget).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Subscribers</p>
                  <p className="font-semibold">{promotion.newsletter_subscribers?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Avg. Open Rate</p>
                  <p className="font-semibold">{promotion.open_rate}%</p>
                </div>
              </div>

              <button
                onClick={() => handleApply(promotion.id)}
                disabled={saving}
                className="w-full px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply for Promotion
              </button>
            </div>
          </div>
        ))}
      </div>

      {promotions.length === 0 && !loading && (
        <div className="text-center py-12">
          <FaNewspaper className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No promotions found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your filters to find more opportunities
          </p>
        </div>
      )}
    </div>
  );
} 