// Plan definitions with features and limits
export const PLAN_FEATURES = {
  Free: {
    name: 'Free',
    price: 0,
    maxSubscribers: 1000,
    maxNewsletters: 1,
    maxEmailsPerMonth: 1000,
    analytics: 'basic',
    support: 'community',
    monetization: {
      donations: true,
      digitalProducts: false,
      subscriptions: false,
      brandFunds: false,
      ads: false
    },
    customization: {
      templates: ['basic'],
      customDomain: false,
      brandingRemoval: false
    },
    features: {
      emailEditor: true,
      subscriberManagement: true,
      basicAnalytics: true,
      socialSharing: true,
      mobileApp: false,
      api: false,
      webhooks: false,
      automation: false,
      segmentation: false,
      crossPromotions: false
    },
    limits: {
      storageGB: 1,
      teamMembers: 1,
      integrations: 0
    }
  },
  
  Pro: {
    name: 'Pro',
    price: 29,
    maxSubscribers: 5000,
    maxNewsletters: 10,
    maxEmailsPerMonth: 25000,
    analytics: 'advanced',
    support: 'email',
    monetization: {
      donations: true,
      digitalProducts: true,
      subscriptions: true,
      brandFunds: true,
      ads: false
    },
    customization: {
      templates: ['basic', 'professional'],
      customDomain: true,
      brandingRemoval: true
    },
    features: {
      emailEditor: true,
      subscriberManagement: true,
      basicAnalytics: true,
      advancedAnalytics: true,
      socialSharing: true,
      mobileApp: true,
      api: false,
      webhooks: true,
      automation: true,
      segmentation: true,
      crossPromotions: true
    },
    limits: {
      storageGB: 10,
      teamMembers: 3,
      integrations: 5
    }
  },
  
  Business: {
    name: 'Business',
    price: 89,
    maxSubscribers: 25000,
    maxNewsletters: 50,
    maxEmailsPerMonth: 100000,
    analytics: 'enterprise',
    support: 'priority',
    monetization: {
      donations: true,
      digitalProducts: true,
      subscriptions: true,
      brandFunds: true,
      ads: true
    },
    customization: {
      templates: ['basic', 'professional', 'premium'],
      customDomain: true,
      brandingRemoval: true
    },
    features: {
      emailEditor: true,
      subscriberManagement: true,
      basicAnalytics: true,
      advancedAnalytics: true,
      enterpriseAnalytics: true,
      socialSharing: true,
      mobileApp: true,
      api: true,
      webhooks: true,
      automation: true,
      segmentation: true,
      crossPromotions: true
    },
    limits: {
      storageGB: 100,
      teamMembers: 10,
      integrations: 20
    }
  },
  
  Enterprise: {
    name: 'Enterprise',
    price: 299,
    maxSubscribers: 100000,
    maxNewsletters: -1, // Unlimited
    maxEmailsPerMonth: -1, // Unlimited
    analytics: 'custom',
    support: 'dedicated',
    monetization: {
      donations: true,
      digitalProducts: true,
      subscriptions: true,
      brandFunds: true,
      ads: true
    },
    customization: {
      templates: ['basic', 'professional', 'premium', 'custom'],
      customDomain: true,
      brandingRemoval: true
    },
    features: {
      emailEditor: true,
      subscriberManagement: true,
      basicAnalytics: true,
      advancedAnalytics: true,
      enterpriseAnalytics: true,
      customReporting: true,
      socialSharing: true,
      mobileApp: true,
      api: true,
      webhooks: true,
      automation: true,
      segmentation: true,
      crossPromotions: true,
      whiteLabel: true
    },
    limits: {
      storageGB: -1, // Unlimited
      teamMembers: -1, // Unlimited
      integrations: -1 // Unlimited
    }
  }
};

// Plan pricing tiers for different subscriber counts
export const PLAN_TIERS = {
  Pro: [
    { subscribers: 1000, price: 29 },
    { subscribers: 5000, price: 49 },
    { subscribers: 10000, price: 69 },
    { subscribers: 25000, price: 119 },
    { subscribers: 50000, price: 149 },
    { subscribers: 75000, price: 199 },
    { subscribers: 100000, price: 249 }
  ],
  Business: [
    { subscribers: 1000, price: 89 },
    { subscribers: 5000, price: 129 },
    { subscribers: 10000, price: 149 },
    { subscribers: 25000, price: 199 },
    { subscribers: 50000, price: 249 },
    { subscribers: 75000, price: 279 },
    { subscribers: 100000, price: 299 }
  ]
};

// Helper functions
export const getPlanFeatures = (planType) => {
  return PLAN_FEATURES[planType] || PLAN_FEATURES.Free;
};

export const hasFeature = (planType, featureName) => {
  const plan = getPlanFeatures(planType);
  return plan.features[featureName] || false;
};

export const hasMonetizationFeature = (planType, feature) => {
  const plan = getPlanFeatures(planType);
  return plan.monetization[feature] || false;
};

export const getUsageLimit = (planType, limitType) => {
  const plan = getPlanFeatures(planType);
  const limit = plan.limits[limitType] || plan[limitType];
  return limit === -1 ? 'Unlimited' : limit;
};

export const checkLimit = (planType, limitType, currentUsage) => {
  const limit = getUsageLimit(planType, limitType);
  if (limit === 'Unlimited') return { allowed: true, remaining: 'Unlimited' };
  
  const remaining = Math.max(0, limit - currentUsage);
  return {
    allowed: currentUsage < limit,
    remaining,
    limit,
    percentage: (currentUsage / limit) * 100
  };
};

export const getNextPlan = (currentPlan) => {
  const planOrder = ['Free', 'Pro', 'Business', 'Enterprise'];
  const currentIndex = planOrder.indexOf(currentPlan);
  
  if (currentIndex < planOrder.length - 1) {
    return planOrder[currentIndex + 1];
  }
  
  return null;
};

export const formatPrice = (price) => {
  return price === 0 ? 'Free' : `$${price}/month`;
};

export const formatLimit = (limit) => {
  return limit === -1 ? 'Unlimited' : limit.toLocaleString();
}; 