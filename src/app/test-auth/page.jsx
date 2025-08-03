'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function TestAuthPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkAuth = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      console.log('Current user:', user);
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testProPlan = () => {
    const planData = {
      type: 'Pro',
      subscribers: 5000,
      price: 49
    };
    
    const planParams = new URLSearchParams({
      plan: planData.type,
      tier: planData.subscribers.toString(),
      price: planData.price.toString()
    });
    
    if (user) {
      window.location.href = `/auth/payment?${planParams.toString()}`;
    } else {
      localStorage.setItem('selectedPlan', JSON.stringify(planData));
      window.location.href = `/auth/signup?${planParams.toString()}`;
    }
  };

  const testFreePlan = () => {
    const planData = {
      type: 'Free',
      subscribers: 1000,
      price: 0
    };
    
    if (user) {
      window.location.href = '/user-dashboard';
    } else {
      const planParams = new URLSearchParams({
        plan: planData.type,
        tier: planData.subscribers.toString(),
        price: planData.price.toString()
      });
      localStorage.setItem('selectedPlan', JSON.stringify(planData));
      window.location.href = `/auth/signup?${planParams.toString()}`;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Authentication & Payment Flow Test
          </h1>

          <div className="space-y-6">
            {/* Auth Status */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Authentication Status</h2>
              <div className="flex items-center space-x-4">
                <button
                  onClick={checkAuth}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? 'Checking...' : 'Check Auth'}
                </button>
                {user && (
                  <button
                    onClick={logout}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Logout
                  </button>
                )}
              </div>
              
              <div className="mt-4">
                {user ? (
                  <div className="text-green-600">
                    ✅ Authenticated as: {user.email}
                  </div>
                ) : (
                  <div className="text-red-600">
                    ❌ Not authenticated
                  </div>
                )}
              </div>
            </div>

            {/* Plan Tests */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-4">Test Plan Selection</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Free Plan Test */}
                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="font-semibold text-gray-900">Free Plan</h3>
                  <p className="text-gray-600 text-sm">1,000 subscribers - $0/month</p>
                  <button
                    onClick={testFreePlan}
                    className="mt-3 w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Test Free Plan
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    {user ? 'Will go to dashboard' : 'Will go to signup → dashboard'}
                  </p>
                </div>

                {/* Pro Plan Test */}
                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="font-semibold text-gray-900">Pro Plan</h3>
                  <p className="text-gray-600 text-sm">5,000 subscribers - $49/month</p>
                  <button
                    onClick={testProPlan}
                    className="mt-3 w-full px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600"
                  >
                    Test Pro Plan
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    {user ? 'Will go to payment' : 'Will go to signup → payment'}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="text-center space-x-4">
              <a
                href="/"
                className="inline-block px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                ← Back to Home
              </a>
              <a
                href="/auth/signup"
                className="inline-block px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600"
              >
                Go to Signup
              </a>
              <a
                href="/auth/login"
                className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Go to Login
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 