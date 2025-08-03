import { createClient } from '@supabase/supabase-js';
import { getPlanFeatures, hasFeature, hasMonetizationFeature, checkLimit } from './plans';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export class PlanChecker {
  constructor(userPlan = 'Free') {
    this.userPlan = userPlan;
    this.planFeatures = getPlanFeatures(userPlan);
  }

  // Check if user can access a feature
  canAccessFeature(featureName) {
    return hasFeature(this.userPlan, featureName);
  }

  // Check if user can access monetization features
  canAccessMonetization(feature) {
    return hasMonetizationFeature(this.userPlan, feature);
  }

  // Check usage limits
  async checkUsageLimit(limitType, currentUsage) {
    return checkLimit(this.userPlan, limitType, currentUsage);
  }

  // Get plan restrictions with user-friendly messages
  getRestrictions() {
    const features = this.planFeatures.features;
    const monetization = this.planFeatures.monetization;
    
    const restrictions = {
      features: [],
      monetization: [],
      limits: []
    };

    // Feature restrictions
    if (!features.api) restrictions.features.push('API Access');
    if (!features.webhooks) restrictions.features.push('Webhooks');
    if (!features.automation) restrictions.features.push('Email Automation');
    if (!features.segmentation) restrictions.features.push('Subscriber Segmentation');
    if (!features.crossPromotions) restrictions.features.push('Cross Promotions');
    if (!features.mobileApp) restrictions.features.push('Mobile App');

    // Monetization restrictions
    if (!monetization.digitalProducts) restrictions.monetization.push('Digital Products');
    if (!monetization.subscriptions) restrictions.monetization.push('Paid Subscriptions');
    if (!monetization.brandFunds) restrictions.monetization.push('Brand Funds');
    if (!monetization.ads) restrictions.monetization.push('Ad Placements');

    // Limits
    const limits = this.planFeatures.limits;
    if (limits.teamMembers !== -1) {
      restrictions.limits.push(`Team Members: ${limits.teamMembers}`);
    }
    if (limits.integrations !== -1) {
      restrictions.limits.push(`Integrations: ${limits.integrations}`);
    }
    if (limits.storageGB !== -1) {
      restrictions.limits.push(`Storage: ${limits.storageGB}GB`);
    }

    return restrictions;
  }

  // Get upgrade suggestions
  getUpgradeSuggestions() {
    if (this.userPlan === 'Free') {
      return {
        nextPlan: 'Pro',
        benefits: [
          'Up to 5,000 subscribers',
          'Digital product sales',
          'Email automation',
          'Advanced analytics',
          'Custom domain',
          'Remove Newsletterfy branding'
        ]
      };
    } else if (this.userPlan === 'Pro') {
      return {
        nextPlan: 'Business',
        benefits: [
          'Up to 25,000 subscribers',
          'Ad placement monetization',
          'Enterprise analytics',
          'API access',
          'Priority support',
          'Up to 10 team members'
        ]
      };
    } else if (this.userPlan === 'Business') {
      return {
        nextPlan: 'Enterprise',
        benefits: [
          'Unlimited subscribers',
          'White-label solution',
          'Custom reporting',
          'Dedicated support',
          'Unlimited team members',
          'Custom integrations'
        ]
      };
    }
    
    return null;
  }

  // Create plan enforcement component
  createPlanGate(featureName, fallbackComponent = null) {
    return {
      canAccess: this.canAccessFeature(featureName),
      planRequired: this.getRequiredPlanForFeature(featureName),
      fallback: fallbackComponent
    };
  }

  getRequiredPlanForFeature(featureName) {
    const plans = ['Free', 'Pro', 'Business', 'Enterprise'];
    
    for (const plan of plans) {
      if (hasFeature(plan, featureName)) {
        return plan;
      }
    }
    
    return 'Enterprise';
  }
}

// React hook for plan checking
export const usePlanChecker = (userPlan) => {
  return new PlanChecker(userPlan);
};

// Higher-order component for plan gating
export const withPlanGate = (WrappedComponent, requiredFeature, requiredPlan = 'Pro') => {
  return function PlanGatedComponent(props) {
    const { userPlan = 'Free' } = props;
    const planChecker = new PlanChecker(userPlan);
    
    if (!planChecker.canAccessFeature(requiredFeature)) {
      return (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-lock text-2xl text-gray-400"></i>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {requiredPlan} Plan Required
          </h3>
          <p className="text-gray-600 mb-4">
            This feature requires a {requiredPlan} subscription or higher.
          </p>
          <button
            onClick={() => window.location.href = '/user-dashboard?tab=billing'}
            className="bg-cyan-500 text-white px-6 py-2 rounded-lg hover:bg-cyan-600 transition duration-300"
          >
            Upgrade Now
          </button>
        </div>
      );
    }
    
    return <WrappedComponent {...props} />;
  };
};

// Plan usage warning component
export const PlanUsageWarning = ({ planType, usageType, currentUsage, showUpgrade = true }) => {
  const planChecker = new PlanChecker(planType);
  const usage = planChecker.checkUsageLimit(usageType, currentUsage);
  
  if (usage.percentage < 80) return null;
  
  const isNearLimit = usage.percentage >= 80 && usage.percentage < 95;
  const isAtLimit = usage.percentage >= 95;
  
  return (
    <div className={`p-3 rounded-lg border ${
      isAtLimit 
        ? 'bg-red-50 border-red-200 text-red-800' 
        : 'bg-yellow-50 border-yellow-200 text-yellow-800'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <i className={`fas ${isAtLimit ? 'fa-exclamation-triangle' : 'fa-warning'} mr-2`}></i>
          <span className="text-sm font-medium">
            {isAtLimit ? 'Limit Reached' : 'Approaching Limit'}
          </span>
        </div>
        {showUpgrade && (
          <button
            onClick={() => window.location.href = '/user-dashboard?tab=billing'}
            className="text-xs bg-white px-2 py-1 rounded hover:bg-gray-50 transition"
          >
            Upgrade
          </button>
        )}
      </div>
      <p className="text-xs mt-1">
        {usage.remaining === 0 
          ? `You've reached your ${usageType} limit`
          : `${usage.remaining} ${usageType} remaining of ${usage.limit}`
        }
      </p>
    </div>
  );
}; 