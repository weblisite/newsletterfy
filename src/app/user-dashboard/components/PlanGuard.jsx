'use client';

import React from 'react';

// Plan feature definitions
const PLAN_FEATURES = {
  Free: {
    monetization: ['donations'],
    maxSubscribers: 1000,
    maxNewsletters: 1,
    features: {
      analytics: 'basic',
      automation: false,
      segmentation: false,
      crossPromotions: false,
      api: false,
      customDomain: false,
      brandingRemoval: false
    }
  },
  Pro: {
    monetization: ['donations', 'digitalProducts', 'subscriptions', 'brandFunds'],
    maxSubscribers: 5000,
    maxNewsletters: 10,
    features: {
      analytics: 'advanced',
      automation: true,
      segmentation: true,
      crossPromotions: true,
      api: false,
      customDomain: true,
      brandingRemoval: true
    }
  },
  Business: {
    monetization: ['donations', 'digitalProducts', 'subscriptions', 'brandFunds', 'ads'],
    maxSubscribers: 25000,
    maxNewsletters: 50,
    features: {
      analytics: 'enterprise',
      automation: true,
      segmentation: true,
      crossPromotions: true,
      api: true,
      customDomain: true,
      brandingRemoval: true
    }
  },
  Enterprise: {
    monetization: ['all'],
    maxSubscribers: -1,
    maxNewsletters: -1,
    features: {
      analytics: 'custom',
      automation: true,
      segmentation: true,
      crossPromotions: true,
      api: true,
      customDomain: true,
      brandingRemoval: true,
      whiteLabel: true
    }
  }
};

export const PlanGuard = ({ 
  userPlan = 'Free', 
  requiredFeature, 
  requiredPlan = 'Pro',
  children,
  fallback = null 
}) => {
  const currentPlanFeatures = PLAN_FEATURES[userPlan] || PLAN_FEATURES.Free;
  
  // Check if user has access to this feature
  const hasAccess = () => {
    if (requiredFeature === 'monetization') {
      return currentPlanFeatures.monetization.includes('all') || 
             currentPlanFeatures.monetization.length > PLAN_FEATURES.Free.monetization.length;
    }
    
    if (requiredFeature in currentPlanFeatures.features) {
      return currentPlanFeatures.features[requiredFeature];
    }
    
    // Default to checking if user has the required plan or higher
    const planHierarchy = ['Free', 'Pro', 'Business', 'Enterprise'];
    const userPlanIndex = planHierarchy.indexOf(userPlan);
    const requiredPlanIndex = planHierarchy.indexOf(requiredPlan);
    
    return userPlanIndex >= requiredPlanIndex;
  };

  if (hasAccess()) {
    return children;
  }

  // Show upgrade prompt if user doesn't have access
  if (fallback) {
    return fallback;
  }

  return (
    <UpgradePrompt requiredPlan={requiredPlan} featureName={requiredFeature} />
  );
};

export const UpgradePrompt = ({ requiredPlan, featureName }) => (
  <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
      <i className="fas fa-lock text-2xl text-gray-400"></i>
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      {requiredPlan} Plan Required
    </h3>
    <p className="text-gray-600 mb-4">
      This {featureName} feature requires a {requiredPlan} subscription or higher.
    </p>
    <div className="flex space-x-3 justify-center">
      <button
        onClick={() => window.location.href = '/user-dashboard?tab=billing'}
        className="bg-cyan-500 text-white px-6 py-2 rounded-lg hover:bg-cyan-600 transition duration-300"
      >
        Upgrade Now
      </button>
      <button
        onClick={() => window.open('/#pricing', '_blank')}
        className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition duration-300"
      >
        Compare Plans
      </button>
    </div>
  </div>
);

export const UsageWarning = ({ userPlan = 'Free', usageType, currentUsage, maxUsage }) => {
  const planFeatures = PLAN_FEATURES[userPlan] || PLAN_FEATURES.Free;
  const limit = maxUsage || planFeatures[`max${usageType.charAt(0).toUpperCase() + usageType.slice(1)}`];
  
  if (limit === -1) return null; // Unlimited
  
  const percentage = (currentUsage / limit) * 100;
  
  if (percentage < 80) return null;
  
  const isNearLimit = percentage >= 80 && percentage < 95;
  const isAtLimit = percentage >= 95;
  
  return (
    <div className={`p-3 rounded-lg border-l-4 ${
      isAtLimit 
        ? 'bg-red-50 border-red-400 text-red-800' 
        : 'bg-yellow-50 border-yellow-400 text-yellow-800'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <i className={`fas ${isAtLimit ? 'fa-exclamation-triangle' : 'fa-warning'} mr-2`}></i>
          <span className="text-sm font-medium">
            {isAtLimit ? `${usageType} Limit Reached` : `Approaching ${usageType} Limit`}
          </span>
        </div>
        <button
          onClick={() => window.location.href = '/user-dashboard?tab=billing'}
          className="text-xs bg-white px-2 py-1 rounded hover:bg-gray-50 transition border"
        >
          Upgrade
        </button>
      </div>
      <p className="text-xs mt-1">
        {isAtLimit 
          ? `You've reached your ${usageType} limit of ${limit.toLocaleString()}`
          : `${currentUsage.toLocaleString()} of ${limit.toLocaleString()} ${usageType} used (${Math.round(percentage)}%)`
        }
      </p>
    </div>
  );
};

export const PlanBadge = ({ userPlan = 'Free' }) => {
  const badgeColors = {
    Free: 'bg-gray-100 text-gray-800',
    Pro: 'bg-cyan-100 text-cyan-800',
    Business: 'bg-purple-100 text-purple-800',
    Enterprise: 'bg-yellow-100 text-yellow-800'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeColors[userPlan]}`}>
      {userPlan} Plan
    </span>
  );
};

export const FeatureList = ({ userPlan = 'Free', showUpgrade = false }) => {
  const planFeatures = PLAN_FEATURES[userPlan] || PLAN_FEATURES.Free;
  
  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Your Plan Features</h3>
        <PlanBadge userPlan={userPlan} />
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Subscribers</span>
          <span className="font-medium">
            {planFeatures.maxSubscribers === -1 ? 'Unlimited' : planFeatures.maxSubscribers.toLocaleString()}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Newsletters</span>
          <span className="font-medium">
            {planFeatures.maxNewsletters === -1 ? 'Unlimited' : planFeatures.maxNewsletters}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Analytics</span>
          <span className="font-medium capitalize">{planFeatures.features.analytics}</span>
        </div>
        
        <div className="border-t pt-3">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Monetization Features:</h4>
          <div className="space-y-1">
            {planFeatures.monetization.map((feature, index) => (
              <div key={index} className="flex items-center text-sm">
                <i className="fas fa-check text-green-500 w-4 mr-2"></i>
                <span className="capitalize">{feature}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="border-t pt-3">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Advanced Features:</h4>
          <div className="space-y-1">
            {Object.entries(planFeatures.features).map(([feature, enabled]) => {
              if (feature === 'analytics') return null;
              return (
                <div key={feature} className="flex items-center text-sm">
                  <i className={`fas ${enabled ? 'fa-check text-green-500' : 'fa-times text-red-500'} w-4 mr-2`}></i>
                  <span className="capitalize">{feature.replace(/([A-Z])/g, ' $1').trim()}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {showUpgrade && userPlan !== 'Enterprise' && (
        <button
          onClick={() => window.location.href = '/user-dashboard?tab=billing'}
          className="w-full mt-4 bg-cyan-500 text-white py-2 px-4 rounded-lg hover:bg-cyan-600 transition-colors"
        >
          Upgrade Plan
        </button>
      )}
    </div>
  );
};

export default PlanGuard; 