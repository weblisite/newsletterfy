"use client";
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function Settings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [brandProfile, setBrandProfile] = useState({
    name: 'Acme Corporation',
    website: 'https://www.acme.com',
    logo: '/images/brand-logo.png',
    description: 'Leading provider of innovative solutions for businesses worldwide.',
    industry: 'Technology',
    contactEmail: 'advertising@acme.com',
    contactPhone: '+1 (555) 123-4567',
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: {
      campaignUpdates: true,
      performanceReports: true,
      budgetAlerts: true,
      newsletterOpportunities: true,
    },
    autoRenewCampaigns: false,
    defaultBudget: 1000,
    targetNiches: ['Tech', 'Business', 'Innovation'],
    preferredPaymentMethod: 'credit_card',
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    lastPasswordChange: '2024-01-15',
    loginHistory: [
      {
        date: '2024-02-15 14:30:00',
        ip: '192.168.1.1',
        location: 'New York, USA',
        device: 'Chrome on Windows',
      },
      {
        date: '2024-02-14 09:15:00',
        ip: '192.168.1.2',
        location: 'New York, USA',
        device: 'Safari on macOS',
      },
    ],
  });

  const industries = [
    'Technology',
    'Finance',
    'Healthcare',
    'Education',
    'Retail',
    'Manufacturing',
    'Media',
    'Entertainment',
    'Travel',
    'Food & Beverage',
  ];

  const availableNiches = [
    'Tech',
    'Business',
    'Innovation',
    'Finance',
    'Marketing',
    'Startups',
    'AI & ML',
    'Cybersecurity',
    'E-commerce',
    'Digital Marketing',
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/brand/settings');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch settings');
      }
      const data = await response.json();
      setBrandProfile(data.profile);
      setPreferences(data.preferences);
      setSecuritySettings(data.security);
      setIsLoading(false);
    } catch (error) {
      toast.error(error.message);
      console.error(error);
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const response = await fetch('/api/brand/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: brandProfile }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
      }
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.message);
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreferencesUpdate = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const response = await fetch('/api/brand/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update preferences');
      }
      toast.success('Preferences updated successfully');
    } catch (error) {
      toast.error(error.message);
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSecurityUpdate = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const response = await fetch('/api/brand/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ security: securitySettings }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update security settings');
      }
      toast.success('Security settings updated successfully');
    } catch (error) {
      toast.error(error.message);
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('logo', file);
      const response = await fetch('/api/brand/settings/logo', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload logo');
      }
      const data = await response.json();
      setBrandProfile({
        ...brandProfile,
        logo: data.logo_url,
      });
      toast.success('Logo uploaded successfully');
    } catch (error) {
      toast.error(error.message);
      console.error(error);
    }
  };

  const toggleNiche = (niche) => {
    setPreferences(prev => ({
      ...prev,
      targetNiches: prev.targetNiches.includes(niche)
        ? prev.targetNiches.filter(n => n !== niche)
        : [...prev.targetNiches, niche],
    }));
  };

  return (
    <div className="animate-fadeIn">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Settings</h2>
        <p className="text-gray-600">Manage your brand profile and preferences</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Brand Profile */}
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Brand Profile</h3>
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0">
                <div className="relative h-24 w-24">
                  <img
                    src={brandProfile.logo}
                    alt="Brand logo"
                    className="h-24 w-24 rounded-lg object-cover"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white opacity-0 hover:opacity-100 transition-opacity cursor-pointer rounded-lg"
                  >
                    Change
                  </label>
                  <input
                    id="logo-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleLogoUpload}
                  />
                </div>
              </div>
              <div className="flex-grow space-y-4">
                <div className="floating-input-container">
                  <input
                    type="text"
                    id="brand-name"
                    value={brandProfile.name}
                    onChange={(e) => setBrandProfile({ ...brandProfile, name: e.target.value })}
                    className="floating-input"
                    placeholder=" "
                  />
                  <label htmlFor="brand-name" className="floating-label">Brand Name</label>
                </div>
                <div className="floating-input-container">
                  <input
                    type="url"
                    id="brand-website"
                    value={brandProfile.website}
                    onChange={(e) => setBrandProfile({ ...brandProfile, website: e.target.value })}
                    className="floating-input"
                    placeholder=" "
                  />
                  <label htmlFor="brand-website" className="floating-label">Website</label>
                </div>
              </div>
            </div>

            <div className="floating-input-container">
              <textarea
                id="brand-description"
                value={brandProfile.description}
                onChange={(e) => setBrandProfile({ ...brandProfile, description: e.target.value })}
                rows={3}
                className="floating-input floating-textarea"
                placeholder=" "
              />
              <label htmlFor="brand-description" className="floating-label">Description</label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Industry
                </label>
                <select
                  value={brandProfile.industry}
                  onChange={(e) => setBrandProfile({ ...brandProfile, industry: e.target.value })}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 rounded-md"
                >
                  {industries.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={brandProfile.contactEmail}
                  onChange={(e) => setBrandProfile({ ...brandProfile, contactEmail: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={brandProfile.contactPhone}
                  onChange={(e) => setBrandProfile({ ...brandProfile, contactPhone: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
              >
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* Preferences */}
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Preferences</h3>
          <form onSubmit={handlePreferencesUpdate} className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-4">Email Notifications</h4>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    id="campaign-updates"
                    type="checkbox"
                    checked={preferences.emailNotifications.campaignUpdates}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      emailNotifications: {
                        ...preferences.emailNotifications,
                        campaignUpdates: e.target.checked,
                      },
                    })}
                    className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
                  />
                  <label htmlFor="campaign-updates" className="ml-2 text-sm text-gray-700">
                    Campaign updates and performance alerts
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="performance-reports"
                    type="checkbox"
                    checked={preferences.emailNotifications.performanceReports}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      emailNotifications: {
                        ...preferences.emailNotifications,
                        performanceReports: e.target.checked,
                      },
                    })}
                    className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
                  />
                  <label htmlFor="performance-reports" className="ml-2 text-sm text-gray-700">
                    Weekly performance reports
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="budget-alerts"
                    type="checkbox"
                    checked={preferences.emailNotifications.budgetAlerts}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      emailNotifications: {
                        ...preferences.emailNotifications,
                        budgetAlerts: e.target.checked,
                      },
                    })}
                    className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
                  />
                  <label htmlFor="budget-alerts" className="ml-2 text-sm text-gray-700">
                    Budget alerts and spending notifications
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="newsletter-opportunities"
                    type="checkbox"
                    checked={preferences.emailNotifications.newsletterOpportunities}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      emailNotifications: {
                        ...preferences.emailNotifications,
                        newsletterOpportunities: e.target.checked,
                      },
                    })}
                    className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
                  />
                  <label htmlFor="newsletter-opportunities" className="ml-2 text-sm text-gray-700">
                    New newsletter opportunities in your target niches
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Default Campaign Budget
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    value={preferences.defaultBudget}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      defaultBudget: parseFloat(e.target.value),
                    })}
                    className="focus:ring-cyan-500 focus:border-cyan-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                    placeholder="0.00"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">USD</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Niches
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableNiches.map((niche) => (
                    <button
                      key={niche}
                      type="button"
                      onClick={() => toggleNiche(niche)}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        preferences.targetNiches.includes(niche)
                          ? 'bg-cyan-100 text-cyan-800'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {niche}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="auto-renew"
                  type="checkbox"
                  checked={preferences.autoRenewCampaigns}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    autoRenewCampaigns: e.target.checked,
                  })}
                  className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
                />
                <label htmlFor="auto-renew" className="ml-2 text-sm text-gray-700">
                  Automatically renew successful campaigns
                </label>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
              >
                {isSaving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </form>
        </div>

        {/* Security Settings */}
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Security Settings</h3>
          <form onSubmit={handleSecurityUpdate} className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Two-Factor Authentication</h4>
                <p className="text-sm text-gray-500">
                  Add an extra layer of security to your account
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSecuritySettings({
                  ...securitySettings,
                  twoFactorEnabled: !securitySettings.twoFactorEnabled,
                })}
                className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 ${
                  securitySettings.twoFactorEnabled ? 'bg-cyan-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                    securitySettings.twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-4">Recent Login Activity</h4>
              <div className="bg-white shadow overflow-hidden rounded-md">
                <ul className="divide-y divide-gray-200">
                  {securitySettings.loginHistory.map((login, index) => (
                    <li key={index} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{login.device}</p>
                          <p className="text-sm text-gray-500">{login.location}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-900">{login.date}</p>
                          <p className="text-sm text-gray-500">{login.ip}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Password</h4>
              <p className="text-sm text-gray-500 mb-4">
                Last changed: {securitySettings.lastPasswordChange}
              </p>
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
              >
                Change Password
              </button>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
              >
                {isSaving ? 'Saving...' : 'Save Security Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 