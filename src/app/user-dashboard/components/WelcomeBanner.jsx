'use client';

import React, { useState, useEffect } from 'react';

export default function WelcomeBanner({ userPlan = 'Free', onDismiss }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-hide after 8 seconds
    const timer = setTimeout(() => {
      handleDismiss();
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  if (!isVisible) return null;

  const planColors = {
    Free: 'from-gray-500 to-gray-600',
    Pro: 'from-cyan-500 to-blue-600',
    Business: 'from-purple-500 to-indigo-600',
    Enterprise: 'from-yellow-500 to-orange-600'
  };

  const planEmojis = {
    Free: '🎉',
    Pro: '🚀',
    Business: '💼',
    Enterprise: '👑'
  };

  const planMessages = {
    Free: {
      title: "Welcome to Newsletterfy!",
      subtitle: "Start building your audience with our free plan",
      features: ["1,000 subscribers", "Basic analytics", "Email support"]
    },
    Pro: {
      title: "Welcome to Pro!",
      subtitle: "You're now ready to monetize and grow",
      features: ["Advanced analytics", "Email automation", "Monetization tools"]
    },
    Business: {
      title: "Welcome to Business!",
      subtitle: "Scale your newsletter with enterprise features",
      features: ["Priority support", "API access", "Ad placements"]
    },
    Enterprise: {
      title: "Welcome to Enterprise!",
      subtitle: "Unlimited power for your newsletter empire",
      features: ["Dedicated support", "White-label", "Custom integrations"]
    }
  };

  const message = planMessages[userPlan] || planMessages.Free;

  return (
    <div className={`relative overflow-hidden rounded-lg bg-gradient-to-r ${planColors[userPlan]} p-6 text-white shadow-lg mb-6`}>
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-4xl">{planEmojis[userPlan]}</div>
            <div>
              <h3 className="text-xl font-bold">{message.title}</h3>
              <p className="text-blue-100">{message.subtitle}</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {message.features.map((feature, index) => (
            <div key={index} className="flex items-center text-sm">
              <i className="fas fa-check-circle mr-2 text-green-300"></i>
              <span>{feature}</span>
            </div>
          ))}
        </div>
        
        <div className="mt-6 flex space-x-3">
          <button
            onClick={() => {
              // Switch to newsletters tab to get started
              window.location.href = '/user-dashboard?tab=newsletters';
            }}
            className="bg-white text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Create Your First Newsletter
          </button>
          
          {userPlan === 'Free' && (
            <button
              onClick={() => {
                window.location.href = '/user-dashboard?tab=billing';
              }}
              className="border border-white text-white px-4 py-2 rounded-lg hover:bg-white hover:text-gray-900 transition-colors font-medium"
            >
              Upgrade Plan
            </button>
          )}
          
          <button
            onClick={() => {
              window.location.href = '/user-dashboard?tab=monetization';
            }}
            className="border border-white text-white px-4 py-2 rounded-lg hover:bg-white hover:text-gray-900 transition-colors font-medium"
          >
            Explore Monetization
          </button>
        </div>
      </div>
      
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 -mt-4 -mr-16 opacity-20">
        <div className="text-8xl transform rotate-12">
          {userPlan === 'Free' && '📧'}
          {userPlan === 'Pro' && '⚡'}
          {userPlan === 'Business' && '📈'}
          {userPlan === 'Enterprise' && '🏆'}
        </div>
      </div>
    </div>
  );
} 