"use client";
import React from 'react';

export default function Integrations() {
  const [integrations] = React.useState({
    email: [
      {
        id: "sendgrid",
        name: "SendGrid",
        description: "Email delivery service",
        connected: true,
        icon: "envelope",
        status: "active",
        lastSync: "2024-01-15 14:30",
      },
      {
        id: "mailchimp",
        name: "Mailchimp",
        description: "Email marketing platform",
        connected: false,
        icon: "envelope-open-text",
        status: "disconnected",
        lastSync: null,
      },
    ],
    payment: [
      {
        id: "polar",
        name: "Polar.sh",
        description: "Modern payment processing with subscriptions & one-time payments",
        connected: true,
        icon: "credit-card",
        status: "active",
        lastSync: new Date().toISOString().split('T')[0] + " " + new Date().toTimeString().split(' ')[0],
      },
      {
        id: "paystack",
        name: "Paystack",
        description: "Payment gateway",
        connected: true,
        icon: "money-bill-wave",
        status: "active",
        lastSync: "2024-01-15 15:45",
      },
    ],
    analytics: [
      {
        id: "google_analytics",
        name: "Google Analytics",
        description: "Web analytics service",
        connected: true,
        icon: "chart-line",
        status: "active",
        lastSync: "2024-01-15 13:20",
      },
      {
        id: "mixpanel",
        name: "Mixpanel",
        description: "Product analytics",
        connected: false,
        icon: "chart-bar",
        status: "disconnected",
        lastSync: null,
      },
    ],
  });

  const handleConnect = (serviceId) => {
    // Handle connection logic
    alert(`Connecting to ${serviceId}...`);
  };

  const handleDisconnect = (serviceId) => {
    // Handle disconnection logic
    alert(`Disconnecting from ${serviceId}...`);
  };

  const handleSync = (serviceId) => {
    // Handle sync logic
    alert(`Syncing with ${serviceId}...`);
  };

  const renderIntegrationCard = (integration) => (
    <div
      key={integration.id}
      className="bg-white rounded-lg shadow-md p-6"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              integration.connected
                ? "bg-blue-100 text-blue-600"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            <i className={`fas fa-${integration.icon} text-xl`}></i>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {integration.name}
            </h3>
            <p className="text-sm text-gray-500">
              {integration.description}
            </p>
          </div>
        </div>
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            integration.status === "active"
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {integration.status}
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {integration.lastSync ? (
            <>
              <i className="fas fa-sync-alt mr-1"></i>
              Last synced: {integration.lastSync}
            </>
          ) : (
            "Not connected"
          )}
        </div>
        <div className="space-x-2">
          {integration.connected ? (
            <>
              <button
                onClick={() => handleSync(integration.id)}
                className="px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
              >
                <i className="fas fa-sync-alt mr-1"></i>
                Sync
              </button>
              <button
                onClick={() => handleDisconnect(integration.id)}
                className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={() => handleConnect(integration.id)}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Connect
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-fadeIn p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Email Services
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {integrations.email.map(renderIntegrationCard)}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Payment Gateways
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {integrations.payment.map(renderIntegrationCard)}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Analytics Tools
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {integrations.analytics.map(renderIntegrationCard)}
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            Need help with integrations?
          </h3>
          <p className="text-blue-600 mb-4">
            Our documentation provides detailed guides for setting up each
            integration. If you need additional assistance, our support
            team is here to help.
          </p>
          <div className="space-x-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <i className="fas fa-book mr-2"></i>
              View Documentation
            </button>
            <button className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
              <i className="fas fa-headset mr-2"></i>
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 