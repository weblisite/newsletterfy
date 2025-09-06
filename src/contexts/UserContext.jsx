'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession, useUser as useBetterAuthUser } from '@/lib/auth-client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const UserContext = createContext({});

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [platformSubscription, setPlatformSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);

  // Use Better-Auth hooks
  const { data: session, isPending: sessionPending } = useSession();
  const { data: betterAuthUser, isPending: userPending } = useBetterAuthUser();
  
  const supabase = createClientComponentClient();

  // Fetch user profile and subscription data
  const fetchUserData = async (authUser) => {
    try {
      if (!authUser) {
        setUserProfile(null);
        setPlatformSubscription(null);
        return;
      }

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching user profile:', profileError);
      } else {
        setUserProfile(profile);
      }

      // Fetch platform subscription
      const { data: subscription, error: subscriptionError } = await supabase
        .from('platform_subscriptions')
        .select('*')
        .eq('user_id', authUser.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (subscriptionError && subscriptionError.code !== 'PGRST116') {
        console.error('Error fetching platform subscription:', subscriptionError);
        // Set default free plan if no subscription found
        setPlatformSubscription({
          plan_type: 'Free',
          subscriber_limit: 1000,
          status: 'active',
          amount: 0,
          payment_status: 'active'
        });
      } else {
        setPlatformSubscription(subscription);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // Initialize auth state with Better-Auth
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Use Better-Auth session data
        if (session?.user) {
          setUser(session.user);
          await fetchUserData(session.user);
        } else {
          setUser(null);
          setUserProfile(null);
          setPlatformSubscription(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setAuthLoading(sessionPending);
        setLoading(sessionPending || userPending);
      }
    };

    initializeAuth();
  }, [session, sessionPending, userPending]);

  // Refresh user data (useful after payments)
  const refreshUserData = async () => {
    if (user) {
      setLoading(true);
      await fetchUserData(user);
      setLoading(false);
    }
  };

  // Get plan limits based on subscription
  const getPlanLimits = () => {
    const planType = platformSubscription?.plan_type || 'Free';
    const subscriberLimit = platformSubscription?.subscriber_limit || 1000;

    const limits = {
      Free: {
        newsletters: 1,
        emailsPerMonth: 5000,
        subscribers: 1000,
        features: ['basic_editor', 'templates', 'analytics', 'tips_donations', 'affiliate_program']
      },
      Pro: {
        newsletters: 'unlimited',
        emailsPerMonth: 'unlimited',
        subscribers: subscriberLimit,
        features: [
          'advanced_editor', 'premium_templates', 'paid_subscriptions', 
          'digital_products', 'cross_promotions', 'sponsored_ads', 
          'ab_testing', 'custom_branding', 'email_automation'
        ]
      },
      Business: {
        newsletters: 'unlimited',
        emailsPerMonth: 'unlimited',
        subscribers: subscriberLimit,
        features: [
          'custom_domain', 'dedicated_manager', 'premium_ad_network',
          'advanced_sponsorship_tools', 'api_access', 'advanced_segmentation',
          'custom_integrations', 'sso_authentication', 'priority_support'
        ]
      },
      Enterprise: {
        newsletters: 'unlimited',
        emailsPerMonth: 'unlimited',
        subscribers: 'unlimited',
        features: [
          'unlimited_everything', 'dedicated_support', 'custom_integrations',
          'sla_agreement', 'phone_support', 'custom_development',
          'enterprise_security', 'advanced_analytics', 'white_label',
          'custom_training'
        ]
      }
    };

    return limits[planType] || limits.Free;
  };

  // Check if user has access to a feature
  const hasFeature = (feature) => {
    const limits = getPlanLimits();
    return limits.features.includes(feature);
  };

  // Sign out function
  const signOut = async () => {
    try {
      // Import signOut from auth-client
      const { signOut: betterAuthSignOut } = await import('@/lib/auth-client');
      await betterAuthSignOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    // Auth state
    user,
    userProfile,
    platformSubscription,
    loading,
    authLoading,
    
    // Functions
    refreshUserData,
    signOut,
    
    // Plan utilities
    getPlanLimits,
    hasFeature,
    
    // Computed values
    isAuthenticated: !!user,
    planType: platformSubscription?.plan_type || 'Free',
    subscriberLimit: platformSubscription?.subscriber_limit || 1000,
    isFreePlan: (platformSubscription?.plan_type || 'Free') === 'Free',
    isProPlan: (platformSubscription?.plan_type || 'Free') === 'Pro',
    isBusinessPlan: (platformSubscription?.plan_type || 'Free') === 'Business',
    isEnterprisePlan: (platformSubscription?.plan_type || 'Free') === 'Enterprise'
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;