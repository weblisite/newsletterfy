"use client";
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function EmailProviderSettings() {
  const [providerStatus, setProviderStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [testingProvider, setTestingProvider] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingSwitchProvider, setPendingSwitchProvider] = useState(null);
  const [testEmail, setTestEmail] = useState(process.env.NEXT_PUBLIC_TEST_EMAIL || '');

  // Load provider status on component mount
  useEffect(() => {
    loadProviderStatus();
  }, []);

  /**
   * Load current provider status from API
   */
  const loadProviderStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/email-provider/status');
      
      if (!response.ok) {
        throw new Error('Failed to load provider status');
      }
      
      const data = await response.json();
      setProviderStatus(data);
    } catch (error) {
      console.error('Error loading provider status:', error);
      toast.error('Failed to load email provider status');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle provider switch with confirmation
   */
  const handleProviderSwitch = (newProvider) => {
    if (switching || newProvider === providerStatus?.activeProvider) return;
    
    setPendingSwitchProvider(newProvider);
    setShowConfirmDialog(true);
  };

  /**
   * Confirm and execute provider switch
   */
  const confirmProviderSwitch = async () => {
    if (!pendingSwitchProvider) return;
    
    setSwitching(true);
    setShowConfirmDialog(false);
    
    try {
      const response = await fetch('/api/admin/email-provider/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: pendingSwitchProvider })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(`Successfully switched to ${pendingSwitchProvider === 'sendgrid' ? 'SendGrid' : 'Elastic Email'}`);
        await loadProviderStatus(); // Reload status
      } else {
        toast.error(result.error || 'Failed to switch provider');
      }
    } catch (error) {
      console.error('Provider switch error:', error);
      toast.error('Error switching email provider');
    } finally {
      setSwitching(false);
      setPendingSwitchProvider(null);
    }
  };

  /**
   * Cancel provider switch
   */
  const cancelProviderSwitch = () => {
    setShowConfirmDialog(false);
    setPendingSwitchProvider(null);
  };

  /**
   * Test email provider
   */
  const testProvider = async (providerId) => {
    if (!testEmail) {
      toast.error('Please enter a test email address');
      return;
    }

    setTestingProvider(providerId);
    
    try {
      const response = await fetch('/api/admin/email-provider/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          provider: providerId,
          testEmail: testEmail
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(`${providerId === 'sendgrid' ? 'SendGrid' : 'Elastic Email'} test email sent successfully!`);
      } else {
        toast.error(result.error || 'Test email failed');
      }
    } catch (error) {
      console.error('Test email error:', error);
      toast.error('Error sending test email');
    } finally {
      setTestingProvider(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded-lg mb-6 w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-48 bg-gray-200 rounded-lg"></div>
            <div className="h-48 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  const getProviderDisplayName = (providerId) => {
    return providerId === 'sendgrid' ? 'SendGrid' : 'Elastic Email';
  };

  const getProviderIcon = (providerId) => {
    return providerId === 'sendgrid' ? '📧' : '⚡';
  };

  const getProviderColor = (providerId, isActive) => {
    if (isActive) {
      return 'border-green-500 bg-green-50';
    }
    return 'border-gray-200 bg-gray-50 hover:bg-gray-100';
  };

  const getStatusColor = (isActive, isHealthy) => {
    if (isActive && isHealthy) return 'bg-green-500 text-white';
    if (isActive && !isHealthy) return 'bg-red-500 text-white';
    if (!isActive && isHealthy) return 'bg-blue-500 text-white';
    return 'bg-gray-400 text-white';
  };

  const getStatusText = (providerId, provider) => {
    if (providerId === providerStatus?.activeProvider) {
      return provider?.health?.healthy ? 'ACTIVE' : 'ACTIVE (UNHEALTHY)';
    }
    return provider?.health?.healthy ? 'STANDBY' : 'STANDBY (ERROR)';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Email Provider Settings</h3>
          <p className="text-gray-600 mt-1">Manage your email service providers and switch between them</p>
        </div>
        <button
          onClick={loadProviderStatus}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          🔄 Refresh Status
        </button>
      </div>

      {/* Test Email Input */}
      <div className="glass-panel p-4">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Test Email Address:</label>
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="admin@yourdomain.com"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Provider Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {providerStatus?.providers && Object.entries(providerStatus.providers).map(([providerId, provider]) => (
          <div
            key={providerId}
            className={`p-6 border-2 rounded-lg transition-all ${getProviderColor(providerId, provider.isActive)}`}
          >
            {/* Provider Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getProviderIcon(providerId)}</span>
                <h4 className="text-xl font-semibold">{getProviderDisplayName(providerId)}</h4>
              </div>
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(provider.isActive, provider.health?.healthy)}`}>
                {getStatusText(providerId, provider)}
              </span>
            </div>

            {/* Provider Details */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Configuration:</span>
                <span className={`text-sm font-medium ${provider.configured ? 'text-green-600' : 'text-red-600'}`}>
                  {provider.configured ? '✅ Configured' : '❌ Not Configured'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Health:</span>
                <span className={`text-sm font-medium ${provider.health?.healthy ? 'text-green-600' : 'text-red-600'}`}>
                  {provider.health?.healthy ? '✅ Healthy' : '❌ Unhealthy'}
                </span>
              </div>

              {provider.health?.lastCheck && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Last Check:</span>
                  <span className="text-sm text-gray-500">
                    {new Date(provider.health.lastCheck).toLocaleString()}
                  </span>
                </div>
              )}

              {provider.health?.responseTime && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Response Time:</span>
                  <span className="text-sm text-gray-500">{provider.health.responseTime}ms</span>
                </div>
              )}
            </div>

            {/* Provider Features */}
            {provider.features && (
              <div className="mb-6">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Features:</h5>
                <div className="flex flex-wrap gap-1">
                  {provider.features.slice(0, 3).map((feature, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              {/* Switch Button */}
              <button
                onClick={() => handleProviderSwitch(providerId)}
                disabled={switching || provider.isActive || !provider.configured}
                className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  provider.isActive
                    ? 'bg-green-500 text-white cursor-not-allowed'
                    : provider.configured
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {switching && pendingSwitchProvider === providerId ? (
                  '🔄 Switching...'
                ) : provider.isActive ? (
                  '✓ Currently Active'
                ) : provider.configured ? (
                  `Switch to ${getProviderDisplayName(providerId)}`
                ) : (
                  'Not Configured'
                )}
              </button>

              {/* Test Button */}
              <button
                onClick={() => testProvider(providerId)}
                disabled={testingProvider === providerId || !provider.configured || !testEmail}
                className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  provider.configured && testEmail
                    ? 'bg-purple-500 text-white hover:bg-purple-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {testingProvider === providerId ? (
                  '🧪 Testing...'
                ) : (
                  `🧪 Send Test Email`
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Fallback Settings */}
      <div className="glass-panel p-6">
        <h4 className="text-lg font-semibold mb-4">Fallback Settings</h4>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              Automatic fallback is {providerStatus?.fallbackEnabled ? 'enabled' : 'disabled'}.
              {providerStatus?.fallbackEnabled 
                ? ' If the active provider fails, emails will automatically be sent using the standby provider.'
                : ' Emails will only be sent using the active provider.'
              }
            </p>
          </div>
          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
            providerStatus?.fallbackEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {providerStatus?.fallbackEnabled ? '✅ Enabled' : '❌ Disabled'}
          </span>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Provider Switch</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to switch to <strong>{getProviderDisplayName(pendingSwitchProvider)}</strong>? 
              This will immediately route all new emails through the selected provider.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={confirmProviderSwitch}
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Yes, Switch Provider
              </button>
              <button
                onClick={cancelProviderSwitch}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Loading Overlay */}
      {switching && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="text-gray-700">Switching email provider...</span>
          </div>
        </div>
      )}
    </div>
  );
}