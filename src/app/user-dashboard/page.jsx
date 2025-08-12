"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { useUser } from '../../contexts/UserContext';

// Prevent static generation for this page since it requires authentication
export const dynamic = 'force-dynamic';
import Newsletter from "./components/Newsletter";
import Subscribers from "./components/Subscribers";
import Monetization from "./components/Monetization";
import Analysis from "./components/Analysis";
import Growth from "./components/Growth";
import Funds from "./components/Funds";

import UserProfile from "./components/UserProfile";

export default function UserDashboard() {
  const router = useRouter();
  const { 
    user, 
    userProfile, 
    platformSubscription, 
    loading, 
    authLoading, 
    isAuthenticated, 
    planType, 
    subscriberLimit, 
    getPlanLimits,
    refreshUserData 
  } = useUser();
  
  const [activeTab, setActiveTab] = React.useState("newsletters");
  const [showNewsletterEditor, setShowNewsletterEditor] = React.useState(false);
  const [pendingAdContent, setPendingAdContent] = React.useState(null);
  const [showWelcome, setShowWelcome] = React.useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Handle URL parameters for tab switching and welcome messages
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get('tab');
      const welcome = urlParams.get('welcome');
      const newSubscription = urlParams.get('newSubscription');
      
      if (tab) {
        setActiveTab(tab);
      }
      
      if (welcome === 'true' || newSubscription === 'true') {
        setShowWelcome(true);
        // Refresh user data on new subscription
        if (newSubscription === 'true') {
          refreshUserData();
        }
        // Auto-hide welcome message after 5 seconds
        setTimeout(() => setShowWelcome(false), 5000);
      }
      
      // Clear URL parameters after processing
      if (tab || welcome || newSubscription) {
        window.history.replaceState({}, '', '/user-dashboard');
      }
    }
  }, [refreshUserData]);

  // Prepare user data for components
  const userData = user ? {
    id: user.id,
    email: user.email,
    name: userProfile?.full_name || user.user_metadata?.full_name || user.email,
    username: userProfile?.username || user.email.split('@')[0],
    plan: planType,
    subscription: platformSubscription,
    limits: getPlanLimits()
  } : null;

  const handleNewNewsletter = () => {
    setActiveTab("newsletters");
    setShowNewsletterEditor(true);
  };

  const handlePushToNewsletter = (adContent) => {
    setPendingAdContent(adContent);
    // Switch to newsletter tab and open editor
    setActiveTab("newsletters");
    setShowNewsletterEditor(true);
  };

  const handleNewsletterEditorClose = () => {
    setShowNewsletterEditor(false);
    // Clear pending ad content when editor is closed
    setPendingAdContent(null);
  };

  const renderContent = () => {
    if (!userData) return null;
    
    switch (activeTab) {
      case "newsletters":
        return (
          <Newsletter 
            initialShowEditor={showNewsletterEditor} 
            onEditorClose={handleNewsletterEditorClose} 
            user={userData}
            pendingAdContent={pendingAdContent}
          />
        );
      case "subscribers":
        return <Subscribers user={userData} />;
      case "monetization":
        return <Monetization user={userData} onPushToNewsletter={handlePushToNewsletter} />;
      case "analysis":
        return <Analysis user={userData} />;
      case "growth":
        return <Growth user={userData} />;
      case "funds":
        return <Funds user={userData} />;
      case "profile":
        return <UserProfile user={userData} />;
      default:
        return (
          <Newsletter 
            initialShowEditor={showNewsletterEditor} 
            onEditorClose={handleNewsletterEditorClose} 
            user={userData}
            pendingAdContent={pendingAdContent}
          />
        );
    }
  };

  // Show loading spinner while checking authentication
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't render if user is not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

    return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-cyan-50">
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Welcome Message */}
          {showWelcome && (
            <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg flex items-center justify-between">
              <div className="flex items-center">
                <i className="fas fa-check-circle text-xl mr-3"></i>
                <div>
                  <h3 className="font-semibold">Welcome to Newsletterfy!</h3>
                  <p className="text-sm">Your {planType} plan is now active. Start creating amazing newsletters!</p>
                </div>
              </div>
              <button 
                onClick={() => setShowWelcome(false)}
                className="text-green-700 hover:text-green-900"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          )}
          {/* Dashboard Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">Dashboard</h1>
              <div className="flex items-center space-x-4">
                <p className="text-gray-600">Welcome back, {userData?.name}</p>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  planType === 'Free' ? 'bg-gray-100 text-gray-800' :
                  planType === 'Pro' ? 'bg-blue-100 text-blue-800' :
                  planType === 'Business' ? 'bg-purple-100 text-purple-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {planType} Plan • {subscriberLimit === 'unlimited' ? 'Unlimited' : subscriberLimit.toLocaleString()} subscribers
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {pendingAdContent && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded-lg text-sm flex items-center">
                  <i className="fas fa-ad mr-2"></i>
                  Ad content ready for newsletter
                </div>
              )}
              <button
                onClick={handleNewNewsletter}
                className="button-primary inline-flex items-center"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Write Newsletter
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="glass-panel p-6 hover-scale">
              <div className="flex items-center justify-between">
                    <div>
                  <p className="text-sm text-gray-600">Total Subscribers</p>
                  <h3 className="text-2xl font-bold text-gray-900">24.5K</h3>
                  <p className="text-sm text-green-600">+12% from last month</p>
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
                  <p className="text-sm text-gray-600">Avg. Open Rate</p>
                  <h3 className="text-2xl font-bold text-gray-900">68.7%</h3>
                  <p className="text-sm text-green-600">+5% from last month</p>
                        </div>
                <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                        </div>
                      </div>
                    </div>
            <div className="glass-panel p-6 hover-scale">
              <div className="flex items-center justify-between">
                    <div>
                  <p className="text-sm text-gray-600">Revenue</p>
                  <h3 className="text-2xl font-bold text-gray-900">$12.8K</h3>
                  <p className="text-sm text-green-600">+18% from last month</p>
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
                  <p className="text-sm text-gray-600">Engagement</p>
                  <h3 className="text-2xl font-bold text-gray-900">89.2%</h3>
                  <p className="text-sm text-green-600">+7% from last month</p>
                      </div>
                <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                    </div>
                      </div>
                    </div>
                  </div>

          {/* Main Navigation */}
          <div className="glass-panel mb-8">
            <nav className="flex space-x-1 p-2">
                  <button
                onClick={() => setActiveTab("newsletters")}
                className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === "newsletters"
                    ? "bg-white text-cyan-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <i className="fas fa-newspaper mr-2"></i>
                    Newsletters
                  </button>
                  <button
                onClick={() => setActiveTab("subscribers")}
                className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === "subscribers"
                    ? "bg-white text-cyan-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <i className="fas fa-users mr-2"></i>
                Subscribers
                  </button>
                  <button
                onClick={() => setActiveTab("monetization")}
                className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === "monetization"
                    ? "bg-white text-cyan-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <i className="fas fa-dollar-sign mr-2"></i>
                Monetization
                  </button>
                        <button
                onClick={() => setActiveTab("analysis")}
                className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === "analysis"
                    ? "bg-white text-cyan-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <i className="fas fa-chart-line mr-2"></i>
                Analysis
                        </button>
                        <button
                onClick={() => setActiveTab("growth")}
                className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === "growth"
                    ? "bg-white text-cyan-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <i className="fas fa-rocket mr-2"></i>
                Growth
                        </button>
                        <button
                onClick={() => setActiveTab("funds")}
                className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === "funds"
                    ? "bg-white text-cyan-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <i className="fas fa-wallet mr-2"></i>
                Funds
                        </button>

                        <button
                onClick={() => setActiveTab("profile")}
                className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === "profile"
                    ? "bg-white text-cyan-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <i className="fas fa-user mr-2"></i>
                Profile
                        </button>
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
