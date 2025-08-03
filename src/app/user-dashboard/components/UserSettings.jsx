"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FaCog, FaBell, FaEnvelope, FaLock, FaNewspaper } from 'react-icons/fa';
import { Switch } from '@/components/ui/switch';

export default function UserSettings() {
  const [activeTab, setActiveTab] = useState('email');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // State for email preferences
  const [emailPreferences, setEmailPreferences] = useState({
    marketingEmails: true,
    newsletterUpdates: true,
    productUpdates: true,
    securityAlerts: true,
    digestFrequency: 'weekly',
  });

  // State for newsletter settings
  const [newsletterSettings, setNewsletterSettings] = useState({
    defaultTemplate: '',
    defaultSenderName: '',
    defaultSenderEmail: '',
    defaultReplyTo: '',
    autoSaveInterval: 5,
    schedulingPreference: 'immediate',
    defaultSendTime: '',
    defaultTestEmails: [],
  });

  // State for notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    desktopNotifications: true,
    subscriberAlerts: true,
    performanceAlerts: true,
    securityAlerts: true,
    marketingAlerts: true,
    quietHoursStart: '',
    quietHoursEnd: '',
  });

  // State for security settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    twoFactorMethod: 'email',
    loginNotifications: true,
    ipWhitelist: [],
    passwordExpiryDays: 90,
    sessionTimeout: 30,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      
      const data = await response.json();
      
      setEmailPreferences(data.emailPreferences || emailPreferences);
      setNewsletterSettings(data.newsletterSettings || newsletterSettings);
      setNotificationSettings(data.notificationSettings || notificationSettings);
      setSecuritySettings(data.securitySettings || securitySettings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailPreferences,
          newsletterSettings,
          notificationSettings,
          securitySettings,
        }),
      });

      if (!response.ok) throw new Error('Failed to save settings');
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-6 bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Settings Navigation */}
      <div className="flex space-x-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('email')}
          className={`flex items-center px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'email'
              ? 'border-cyan-500 text-cyan-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FaEnvelope className="mr-2" />
          Email Preferences
        </button>
        <button
          onClick={() => setActiveTab('newsletter')}
          className={`flex items-center px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'newsletter'
              ? 'border-cyan-500 text-cyan-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FaNewspaper className="mr-2" />
          Newsletter Settings
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'notifications'
              ? 'border-cyan-500 text-cyan-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FaBell className="mr-2" />
          Notifications
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'security'
              ? 'border-cyan-500 text-cyan-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FaLock className="mr-2" />
          Security
        </button>
      </div>

      {/* Email Preferences */}
      {activeTab === 'email' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Email Preferences</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Marketing Emails</h3>
                  <p className="text-sm text-gray-500">Receive promotional emails and updates</p>
                </div>
                <Switch
                  checked={emailPreferences.marketingEmails}
                  onCheckedChange={(checked) =>
                    setEmailPreferences((prev) => ({ ...prev, marketingEmails: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Newsletter Updates</h3>
                  <p className="text-sm text-gray-500">Updates about your newsletter performance</p>
                </div>
                <Switch
                  checked={emailPreferences.newsletterUpdates}
                  onCheckedChange={(checked) =>
                    setEmailPreferences((prev) => ({ ...prev, newsletterUpdates: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Product Updates</h3>
                  <p className="text-sm text-gray-500">New features and improvements</p>
                </div>
                <Switch
                  checked={emailPreferences.productUpdates}
                  onCheckedChange={(checked) =>
                    setEmailPreferences((prev) => ({ ...prev, productUpdates: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Security Alerts</h3>
                  <p className="text-sm text-gray-500">Important security notifications</p>
                </div>
                <Switch
                  checked={emailPreferences.securityAlerts}
                  onCheckedChange={(checked) =>
                    setEmailPreferences((prev) => ({ ...prev, securityAlerts: checked }))
                  }
                />
              </div>

              <div>
                <label className="block font-medium mb-2">Digest Frequency</label>
                <select
                  value={emailPreferences.digestFrequency}
                  onChange={(e) =>
                    setEmailPreferences((prev) => ({ ...prev, digestFrequency: e.target.value }))
                  }
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Newsletter Settings */}
      {activeTab === 'newsletter' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Newsletter Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-2">Default Template</label>
                <select
                  value={newsletterSettings.defaultTemplate}
                  onChange={(e) =>
                    setNewsletterSettings((prev) => ({ ...prev, defaultTemplate: e.target.value }))
                  }
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="">Select a template</option>
                  <option value="minimal">Minimal</option>
                  <option value="modern">Modern</option>
                  <option value="classic">Classic</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-2">Default Sender Name</label>
                <input
                  type="text"
                  value={newsletterSettings.defaultSenderName}
                  onChange={(e) =>
                    setNewsletterSettings((prev) => ({ ...prev, defaultSenderName: e.target.value }))
                  }
                  className="w-full p-2 border rounded-lg"
                  placeholder="Your Name"
                />
              </div>

              <div>
                <label className="block font-medium mb-2">Default Sender Email</label>
                <input
                  type="email"
                  value={newsletterSettings.defaultSenderEmail}
                  onChange={(e) =>
                    setNewsletterSettings((prev) => ({ ...prev, defaultSenderEmail: e.target.value }))
                  }
                  className="w-full p-2 border rounded-lg"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block font-medium mb-2">Default Reply-To Email</label>
                <input
                  type="email"
                  value={newsletterSettings.defaultReplyTo}
                  onChange={(e) =>
                    setNewsletterSettings((prev) => ({ ...prev, defaultReplyTo: e.target.value }))
                  }
                  className="w-full p-2 border rounded-lg"
                  placeholder="replies@email.com"
                />
              </div>

              <div>
                <label className="block font-medium mb-2">Auto-Save Interval (minutes)</label>
                <input
                  type="number"
                  value={newsletterSettings.autoSaveInterval}
                  onChange={(e) =>
                    setNewsletterSettings((prev) => ({
                      ...prev,
                      autoSaveInterval: parseInt(e.target.value),
                    }))
                  }
                  className="w-full p-2 border rounded-lg"
                  min="1"
                  max="60"
                />
              </div>

              <div>
                <label className="block font-medium mb-2">Scheduling Preference</label>
                <select
                  value={newsletterSettings.schedulingPreference}
                  onChange={(e) =>
                    setNewsletterSettings((prev) => ({
                      ...prev,
                      schedulingPreference: e.target.value,
                    }))
                  }
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="immediate">Send Immediately</option>
                  <option value="scheduled">Schedule for Later</option>
                  <option value="timezone-adjusted">Adjust for Timezone</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-2">Default Send Time</label>
                <input
                  type="time"
                  value={newsletterSettings.defaultSendTime}
                  onChange={(e) =>
                    setNewsletterSettings((prev) => ({ ...prev, defaultSendTime: e.target.value }))
                  }
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Settings */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Notification Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Email Notifications</h3>
                  <p className="text-sm text-gray-500">Receive notifications via email</p>
                </div>
                <Switch
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationSettings((prev) => ({ ...prev, emailNotifications: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Push Notifications</h3>
                  <p className="text-sm text-gray-500">Receive push notifications</p>
                </div>
                <Switch
                  checked={notificationSettings.pushNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationSettings((prev) => ({ ...prev, pushNotifications: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Desktop Notifications</h3>
                  <p className="text-sm text-gray-500">Show notifications on desktop</p>
                </div>
                <Switch
                  checked={notificationSettings.desktopNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationSettings((prev) => ({ ...prev, desktopNotifications: checked }))
                  }
                />
              </div>

              <div>
                <h3 className="font-medium mb-2">Quiet Hours</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={notificationSettings.quietHoursStart}
                      onChange={(e) =>
                        setNotificationSettings((prev) => ({
                          ...prev,
                          quietHoursStart: e.target.value,
                        }))
                      }
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">End Time</label>
                    <input
                      type="time"
                      value={notificationSettings.quietHoursEnd}
                      onChange={(e) =>
                        setNotificationSettings((prev) => ({
                          ...prev,
                          quietHoursEnd: e.target.value,
                        }))
                      }
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Security Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-500">Add an extra layer of security</p>
                </div>
                <Switch
                  checked={securitySettings.twoFactorEnabled}
                  onCheckedChange={(checked) =>
                    setSecuritySettings((prev) => ({ ...prev, twoFactorEnabled: checked }))
                  }
                />
              </div>

              {securitySettings.twoFactorEnabled && (
                <div>
                  <label className="block font-medium mb-2">2FA Method</label>
                  <select
                    value={securitySettings.twoFactorMethod}
                    onChange={(e) =>
                      setSecuritySettings((prev) => ({ ...prev, twoFactorMethod: e.target.value }))
                    }
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="email">Email</option>
                    <option value="authenticator">Authenticator App</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Login Notifications</h3>
                  <p className="text-sm text-gray-500">Get notified of new login attempts</p>
                </div>
                <Switch
                  checked={securitySettings.loginNotifications}
                  onCheckedChange={(checked) =>
                    setSecuritySettings((prev) => ({ ...prev, loginNotifications: checked }))
                  }
                />
              </div>

              <div>
                <label className="block font-medium mb-2">Session Timeout (minutes)</label>
                <input
                  type="number"
                  value={securitySettings.sessionTimeout}
                  onChange={(e) =>
                    setSecuritySettings((prev) => ({
                      ...prev,
                      sessionTimeout: parseInt(e.target.value),
                    }))
                  }
                  className="w-full p-2 border rounded-lg"
                  min="5"
                  max="240"
                />
              </div>

              <div>
                <label className="block font-medium mb-2">Password Expiry (days)</label>
                <input
                  type="number"
                  value={securitySettings.passwordExpiryDays}
                  onChange={(e) =>
                    setSecuritySettings((prev) => ({
                      ...prev,
                      passwordExpiryDays: parseInt(e.target.value),
                    }))
                  }
                  className="w-full p-2 border rounded-lg"
                  min="30"
                  max="365"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:bg-gray-400"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
} 