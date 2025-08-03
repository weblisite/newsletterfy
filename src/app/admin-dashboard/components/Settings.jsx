"use client";
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FaUser, FaLock, FaBell } from 'react-icons/fa';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profileSettings, setProfileSettings] = useState({
    fullName: '',
    email: '',
    timezone: 'UTC',
    language: 'en'
  });

  const [securitySettings, setSecuritySettings] = useState({
    currentPassword: '',
    newPassword: '',
    twoFactorEnabled: false,
    sessionTimeout: 30
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    newsletterUpdates: true,
    securityAlerts: true,
    marketingEmails: false,
    weeklyDigest: true
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings');
      
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      
      // Update state with fetched settings
      setProfileSettings({
        fullName: data.full_name || '',
        email: data.email || '',
        timezone: data.timezone || 'UTC',
        language: data.language || 'en'
      });

      setSecuritySettings({
        currentPassword: '',
        newPassword: '',
        twoFactorEnabled: data.two_factor_enabled || false,
        sessionTimeout: data.session_timeout || 30
      });

      setNotificationSettings({
        emailNotifications: data.email_notifications ?? true,
        newsletterUpdates: data.newsletter_updates ?? true,
        securityAlerts: data.security_alerts ?? true,
        marketingEmails: data.marketing_emails ?? false,
        weeklyDigest: data.weekly_digest ?? true
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: profileSettings.fullName,
          email: profileSettings.email,
          timezone: profileSettings.timezone,
          language: profileSettings.language
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile settings');
      }

      toast.success('Profile settings updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSecurityUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          two_factor_enabled: securitySettings.twoFactorEnabled,
          session_timeout: securitySettings.sessionTimeout
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update security settings');
      }

      toast.success('Security settings updated successfully');
      setSecuritySettings(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: ''
      }));
    } catch (error) {
      console.error('Error updating security:', error);
      toast.error('Failed to update security settings');
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_notifications: notificationSettings.emailNotifications,
          newsletter_updates: notificationSettings.newsletterUpdates,
          security_alerts: notificationSettings.securityAlerts,
          marketing_emails: notificationSettings.marketingEmails,
          weekly_digest: notificationSettings.weeklyDigest
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update notification settings');
      }

      toast.success('Notification settings updated successfully');
    } catch (error) {
      console.error('Error updating notifications:', error);
      toast.error('Failed to update notification settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Settings Navigation */}
      <div className="flex space-x-4 mb-6">
            <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'profile'
              ? 'bg-cyan-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <FaUser className="mr-2" />
              Profile
            </button>
            <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'security'
              ? 'bg-cyan-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <FaLock className="mr-2" />
              Security
            </button>
            <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'notifications'
              ? 'bg-cyan-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <FaBell className="mr-2" />
              Notifications
            </button>
        </div>

      {/* Profile Settings */}
      {activeTab === 'profile' && (
        <form onSubmit={handleProfileUpdate} className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Profile Settings</h2>
          <div className="space-y-4">
            <div className="floating-input-container">
                  <input
                    type="text"
                id="full-name"
                className="floating-input"
                value={profileSettings.fullName}
                onChange={(e) => setProfileSettings(prev => ({ ...prev, fullName: e.target.value }))}
                required
              />
              <label htmlFor="full-name" className="floating-label">Full Name</label>
                </div>

            <div className="floating-input-container">
                  <input
                    type="email"
                id="email"
                className="floating-input"
                    value={profileSettings.email}
                onChange={(e) => setProfileSettings(prev => ({ ...prev, email: e.target.value }))}
                required
              />
              <label htmlFor="email" className="floating-label">Email Address</label>
                </div>

            <div className="floating-input-container">
                  <select
                id="timezone"
                className="floating-input"
                    value={profileSettings.timezone}
                onChange={(e) => setProfileSettings(prev => ({ ...prev, timezone: e.target.value }))}
                required
              >
                <option value="UTC">UTC</option>
                <option value="EST">EST</option>
                <option value="PST">PST</option>
                <option value="GMT">GMT</option>
                  </select>
              <label htmlFor="timezone" className="floating-label">Timezone</label>
                </div>

            <div className="floating-input-container">
                  <select
                id="language"
                className="floating-input"
                    value={profileSettings.language}
                onChange={(e) => setProfileSettings(prev => ({ ...prev, language: e.target.value }))}
                required
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
              <label htmlFor="language" className="floating-label">Language</label>
                </div>
              </div>

                <button
                  type="submit"
            disabled={saving}
            className="mt-6 px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:bg-gray-400"
                >
            {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </form>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <form onSubmit={handleSecurityUpdate} className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Security Settings</h2>
          <div className="space-y-4">
            <div className="floating-input-container">
              <input
                type="password"
                id="current-password"
                className="floating-input"
                value={securitySettings.currentPassword}
                onChange={(e) => setSecuritySettings(prev => ({ ...prev, currentPassword: e.target.value }))}
              />
              <label htmlFor="current-password" className="floating-label">Current Password</label>
            </div>

            <div className="floating-input-container">
              <input
                type="password"
                id="new-password"
                className="floating-input"
                value={securitySettings.newPassword}
                onChange={(e) => setSecuritySettings(prev => ({ ...prev, newPassword: e.target.value }))}
              />
              <label htmlFor="new-password" className="floating-label">New Password</label>
            </div>

            <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                id="two-factor"
                className="w-4 h-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                      checked={securitySettings.twoFactorEnabled}
                onChange={(e) => setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: e.target.checked }))}
              />
              <label htmlFor="two-factor" className="text-gray-700">Enable Two-Factor Authentication</label>
                </div>

            <div className="floating-input-container">
                  <input
                    type="number"
                id="session-timeout"
                className="floating-input"
                    value={securitySettings.sessionTimeout}
                onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                min="1"
                max="1440"
              />
              <label htmlFor="session-timeout" className="floating-label">Session Timeout (minutes)</label>
            </div>
                </div>

                  <button
            type="submit"
            disabled={saving}
            className="mt-6 px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:bg-gray-400"
                  >
            {saving ? 'Saving...' : 'Save Changes'}
                  </button>
        </form>
      )}

      {/* Notification Settings */}
      {activeTab === 'notifications' && (
        <form onSubmit={handleNotificationUpdate} className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Notification Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <h3 className="text-gray-800 font-medium">Email Notifications</h3>
                <p className="text-gray-500 text-sm">Receive notifications via email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={notificationSettings.emailNotifications}
                  onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
              </label>
                </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <h3 className="text-gray-800 font-medium">Newsletter Updates</h3>
                <p className="text-gray-500 text-sm">Get notified about newsletter performance</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={notificationSettings.newsletterUpdates}
                  onChange={(e) => setNotificationSettings(prev => ({ ...prev, newsletterUpdates: e.target.checked }))}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <h3 className="text-gray-800 font-medium">Security Alerts</h3>
                <p className="text-gray-500 text-sm">Get notified about security events</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={notificationSettings.securityAlerts}
                  onChange={(e) => setNotificationSettings(prev => ({ ...prev, securityAlerts: e.target.checked }))}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
              </label>
          </div>

            <div className="flex items-center justify-between py-3">
                  <div>
                <h3 className="text-gray-800 font-medium">Marketing Emails</h3>
                <p className="text-gray-500 text-sm">Receive marketing and promotional emails</p>
                  </div>
              <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                  className="sr-only peer"
                  checked={notificationSettings.marketingEmails}
                  onChange={(e) => setNotificationSettings(prev => ({ ...prev, marketingEmails: e.target.checked }))}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                  </label>
                </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <h3 className="text-gray-800 font-medium">Weekly Digest</h3>
                <p className="text-gray-500 text-sm">Receive weekly summary reports</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={notificationSettings.weeklyDigest}
                  onChange={(e) => setNotificationSettings(prev => ({ ...prev, weeklyDigest: e.target.checked }))}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-6 px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:bg-gray-400"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      )}
    </div>
  );
} 