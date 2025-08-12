"use client";

// Prevent static generation for this page since it requires authentication
export const dynamic = 'force-dynamic';

import React, { useState } from "react";
import Users from "./components/Users";
import Newsletters from "./components/Newsletters";
import Ads from "./components/Ads";
import Analytics from "./components/Analytics";
import Billing from "./components/Billing";
import Funds from "./components/Funds";
import Integrations from "./components/Integrations";
import Settings from "./components/Settings";
import PayoutManagement from '@/components/admin/PayoutManagement';
import PayoutAnalytics from '@/components/admin/PayoutAnalytics';
import EmailProviderSettings from './components/EmailProviderSettings';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("payouts");

  const tabs = [
    { id: 'payouts', label: 'Payout Management', icon: 'fas fa-money-bill-wave' },
    { id: 'payout-analytics', label: 'Payout Analytics', icon: 'fas fa-chart-pie' },
    { id: 'users', label: 'Users', icon: 'fas fa-users' },
    { id: 'newsletters', label: 'Newsletters', icon: 'fas fa-newspaper' },
    { id: 'ads', label: 'Ads', icon: 'fas fa-ad' },
    { id: 'analytics', label: 'Analytics', icon: 'fas fa-chart-line' },
    { id: 'billing', label: 'Billing', icon: 'fas fa-file-invoice-dollar' },
    { id: 'funds', label: 'Funds', icon: 'fas fa-wallet' },
    { id: 'integrations', label: 'Integrations', icon: 'fas fa-plug' },
    { id: 'email-settings', label: 'Email Settings', icon: 'fas fa-envelope' },
    { id: 'settings', label: 'Settings', icon: 'fas fa-cog' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "users":
        return <Users />;
      case "newsletters":
        return <Newsletters />;
      case "ads":
        return <Ads />;
      case "analytics":
        return <Analytics />;
      case "billing":
        return <Billing />;
      case "funds":
        return <Funds />;
      case "integrations":
        return <Integrations />;
      case "email-settings":
        return <EmailProviderSettings />;
      case "settings":
        return <Settings />;
      case "payouts":
        return <PayoutManagement />;
      case "payout-analytics":
        return <PayoutAnalytics />;
      default:
        return <Users />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-cyan-50">
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Dashboard Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">Admin Dashboard</h1>
              <p className="text-gray-600">Manage your platform and users</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="button-primary inline-flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Generate Report
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="glass-panel p-6 hover-scale">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <h3 className="text-2xl font-bold text-gray-900">12.4K</h3>
                  <p className="text-sm text-green-600">+8% from last month</p>
                </div>
                <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="glass-panel p-6 hover-scale">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <h3 className="text-2xl font-bold text-gray-900">$89.5K</h3>
                  <p className="text-sm text-green-600">+15% from last month</p>
                </div>
                <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="glass-panel p-6 hover-scale">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Newsletters</p>
                  <h3 className="text-2xl font-bold text-gray-900">1,248</h3>
                  <p className="text-sm text-green-600">+12% from last month</p>
                </div>
                <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="glass-panel p-6 hover-scale">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Payouts</p>
                  <h3 className="text-2xl font-bold text-gray-900">$24.8K</h3>
                  <p className="text-sm text-yellow-600">32 requests</p>
                </div>
                <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Main Navigation */}
          <div className="glass-panel mb-8">
            <nav className="flex flex-wrap p-2">
              {tabs.map(tab => (
                  <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-white text-cyan-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  } mr-1 mb-1`}
                >
                  <i className={`${tab.icon} mr-2`}></i>
                  {tab.label}
                                  </button>
              ))}
            </nav>
                      </div>

          {/* Main Content Area */}
          <div className="glass-panel">
            <div className="p-6">
              {renderContent()}
            </div>
          </div>
                                  </div>
                                </div>
    </div>
  );
}
