"use client";
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function AffiliateProgram({ affiliateReferrals = [], affiliateLinks = [], onClose }) {
  const [newLink, setNewLink] = useState({
    name: '',
    code: '',
    description: '',
    category: ''
  });
  const [showNewLinkForm, setShowNewLinkForm] = useState(false);

  const handleNewLinkSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/monetization/affiliate-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLink),
      });

      if (!response.ok) throw new Error('Failed to create affiliate link');
      
      toast.success('Affiliate link created successfully');
      setNewLink({ name: '', code: '', description: '', category: '' });
      setShowNewLinkForm(false);
    } catch (error) {
      toast.error('Failed to create affiliate link');
      console.error(error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success('Copied to clipboard!'))
      .catch(() => toast.error('Failed to copy'));
  };

  const deleteLink = async (linkId) => {
    if (!confirm('Are you sure you want to delete this affiliate link?')) return;

    try {
      const response = await fetch(`/api/monetization/affiliate-links/${linkId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete affiliate link');
      toast.success('Affiliate link deleted successfully');
    } catch (error) {
      toast.error('Failed to delete affiliate link');
      console.error(error);
    }
  };

  // Calculate total earnings and other stats
  const totalReferrals = affiliateReferrals.length;
  const totalCommission = affiliateReferrals.reduce((sum, ref) => sum + ref.commission, 0);
  const totalClicks = affiliateLinks.reduce((sum, link) => sum + link.clicks, 0);
  const conversionRate = totalClicks ? ((totalReferrals / totalClicks) * 100).toFixed(1) : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Affiliate Program</h3>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>

      {/* Performance Overview */}
      <div className="mb-8 bg-gray-50 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Performance Overview</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500">Total Referrals</p>
            <p className="text-2xl font-bold text-gray-900">{totalReferrals}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500">Total Commission</p>
            <p className="text-2xl font-bold text-green-600">${totalCommission.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500">Total Clicks</p>
            <p className="text-2xl font-bold text-cyan-600">{totalClicks}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500">Conversion Rate</p>
            <p className="text-2xl font-bold text-purple-600">{conversionRate}%</p>
          </div>
        </div>
      </div>

      {/* Affiliate Links Management */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-medium text-gray-900">Your Affiliate Links</h4>
          <button
            onClick={() => setShowNewLinkForm(!showNewLinkForm)}
            className="text-cyan-600 hover:text-cyan-700 text-sm font-medium"
          >
            <i className="fas fa-plus mr-1"></i>
            Create New Link
          </button>
        </div>

        {/* New Link Form */}
        {showNewLinkForm && (
          <form onSubmit={handleNewLinkSubmit} className="mb-6 bg-gray-50 p-6 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link Name
                </label>
                <input
                  type="text"
                  value={newLink.name}
                  onChange={(e) => setNewLink({...newLink, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                  required
                  placeholder="e.g., Newsletter Promotion"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Code (Optional)
                </label>
                <input
                  type="text"
                  value={newLink.code}
                  onChange={(e) => setNewLink({...newLink, code: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="e.g., NEWSLETTER50"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={newLink.description}
                onChange={(e) => setNewLink({...newLink, description: e.target.value})}
                className="w-full px-3 py-2 border rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                rows="2"
                required
                placeholder="Brief description of this affiliate link"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={newLink.category}
                onChange={(e) => setNewLink({...newLink, category: e.target.value})}
                className="w-full px-3 py-2 border rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                required
              >
                <option value="">Select a category</option>
                <option value="newsletter">Newsletter</option>
                <option value="social">Social Media</option>
                <option value="blog">Blog</option>
                <option value="website">Website</option>
                <option value="other">Other</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-cyan-600 text-white px-4 py-2 rounded-md hover:bg-cyan-700 transition-colors"
            >
              Create Affiliate Link
            </button>
          </form>
        )}

        {/* Links Table */}
        <div className="bg-white rounded-lg border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Link Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clicks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conversions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {affiliateLinks.map((link) => (
                  <tr key={link.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {link.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <span className="mr-2">{link.url}</span>
                        <button
                          onClick={() => copyToClipboard(link.url)}
                          className="text-cyan-600 hover:text-cyan-800"
                        >
                          <i className="fas fa-copy"></i>
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {link.clicks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {link.conversions}
                      <span className="text-gray-500 ml-1">
                        ({((link.conversions / link.clicks) * 100 || 0).toFixed(1)}%)
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-green-600">
                        ${(link.revenue || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button 
                        onClick={() => deleteLink(link.id)}
                        className="text-red-600 hover:text-red-800 mr-3"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Referrals */}
      <div className="mb-8">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Recent Referrals</h4>
        <div className="bg-white rounded-lg border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {affiliateReferrals.map((referral) => (
                  <tr key={referral.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {referral.referredUser}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {referral.plan}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${referral.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-green-600">
                        ${referral.commission.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        referral.status === 'paid' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {referral.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(referral.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Marketing Resources */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Marketing Resources</h4>
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h5 className="font-medium text-gray-900 mb-2">1. Your Default Referral Link</h5>
            <p className="text-sm text-gray-600">
              Share your unique referral link with your audience:
            </p>
            <div className="mt-2 p-3 bg-gray-50 rounded flex items-center justify-between">
              <code className="text-sm font-mono">
                {`${process.env.NEXT_PUBLIC_BASE_URL}/signup?ref=${affiliateLinks[0]?.code || ''}`}
              </code>
              <button
                onClick={() => copyToClipboard(`${process.env.NEXT_PUBLIC_BASE_URL}/signup?ref=${affiliateLinks[0]?.code || ''}`)}
                className="text-cyan-600 hover:text-cyan-800"
              >
                <i className="fas fa-copy"></i>
              </button>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h5 className="font-medium text-gray-900 mb-2">2. Promotional Materials</h5>
            <p className="text-sm text-gray-600">
              Download banners, logos, and other marketing materials to promote Newsletterfy.
            </p>
            <div className="mt-2 space-y-2">
              <button className="flex items-center text-cyan-600 hover:text-cyan-800 text-sm">
                <i className="fas fa-download mr-2"></i>
                Download Media Kit
              </button>
              <button className="flex items-center text-cyan-600 hover:text-cyan-800 text-sm">
                <i className="fas fa-download mr-2"></i>
                Download Brand Guidelines
              </button>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h5 className="font-medium text-gray-900 mb-2">3. Commission Structure</h5>
            <p className="text-sm text-gray-600">
              Earn 20% recurring commission on all referred Newsletterfy platform subscriptions. Commissions are paid monthly for as long as your referred users maintain their paid subscription.
            </p>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              <li className="flex items-center">
                <i className="fas fa-check text-green-500 mr-2"></i>
                20% recurring commission on referred platform subscriptions
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-green-500 mr-2"></i>
                Monthly payouts for active subscriptions
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-green-500 mr-2"></i>
                Commission continues until subscriber cancels
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-green-500 mr-2"></i>
                Real-time tracking and reporting
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 