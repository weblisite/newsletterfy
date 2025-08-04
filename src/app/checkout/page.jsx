'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { upgradePlan } from '@/lib/auth-client';

export default function CheckoutPage() {
  const { data: session, isLoading } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  
  // Get plan details from URL params
  const planType = searchParams.get('plan');
  const subscriberTier = parseInt(searchParams.get('tier'));
  
  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isLoading && !session?.user) {
      const currentUrl = encodeURIComponent(window.location.href);
      router.push(`/auth/login?redirect=${currentUrl}`);
      return;
    }
    
    // Validate plan parameters
    if (!planType || !subscriberTier || !['Pro', 'Business'].includes(planType)) {
      router.push('/pricing');
      return;
    }
  }, [session, isLoading, planType, subscriberTier, router]);

  const handleStartTrial = async () => {
    if (!session?.user) return;
    
    setIsProcessing(true);
    setError('');
    
    try {
      await upgradePlan(planType, subscriberTier);
    } catch (err) {
      setError(err.message || 'Failed to start trial');
      setIsProcessing(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated or invalid params
  if (!session?.user || !planType || !subscriberTier) {
    return null;
  }

  const planPrices = {
    'Pro': {
      1000: 29, 5000: 49, 10000: 69, 25000: 119, 50000: 149, 75000: 199, 100000: 249
    },
    'Business': {
      1000: 89, 5000: 129, 10000: 149, 25000: 199, 50000: 249, 75000: 279, 100000: 299
    }
  };

  const monthlyPrice = planPrices[planType]?.[subscriberTier] || 0;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <i className="fas fa-envelope-open-text text-3xl text-cyan-500 mr-2"></i>
            <span className="text-2xl font-bold text-cyan-500">Newsletterfy</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Complete Your Subscription</h2>
          <p className="text-gray-600 mt-2">
            Welcome, {session.user.name || session.user.email}!
          </p>
        </div>

        {/* Plan Details */}
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-6 mb-6">
          <div className="text-center">
            <h3 className="text-xl font-bold text-cyan-900">{planType} Plan</h3>
            <p className="text-cyan-700 mt-1">
              Up to {subscriberTier.toLocaleString()} subscribers
            </p>
            <div className="mt-4">
              <span className="text-3xl font-bold text-cyan-900">${monthlyPrice}</span>
              <span className="text-cyan-600 ml-1">/month</span>
            </div>
          </div>
        </div>

        {/* Plan Benefits */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Your {planType} Plan Includes:</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center">
              <i className="fas fa-check text-green-500 mr-2"></i>
              Full access to all {planType} plan features
            </li>
            <li className="flex items-center">
              <i className="fas fa-check text-green-500 mr-2"></i>
              Up to {subscriberTier.toLocaleString()} subscribers
            </li>
            <li className="flex items-center">
              <i className="fas fa-check text-green-500 mr-2"></i>
              Unlimited newsletter sends
            </li>
            <li className="flex items-center">
              <i className="fas fa-check text-green-500 mr-2"></i>
              Premium templates and editor
            </li>
            <li className="flex items-center">
              <i className="fas fa-check text-green-500 mr-2"></i>
              Advanced analytics and insights
            </li>
            {planType === 'Business' && (
              <>
                <li className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-2"></i>
                  Custom domain and branding
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-2"></i>
                  Dedicated account manager
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Payment Terms */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <i className="fas fa-info-circle text-blue-600 mt-0.5 mr-2"></i>
            <div className="text-sm text-blue-800">
              <p className="font-medium">Subscription Terms:</p>
              <p className="mt-1">
                • Monthly billing at ${monthlyPrice}/month<br/>
                • Cancel anytime from your dashboard<br/>
                • Full access to all {planType} features<br/>
                • Secure payment processing via Polar.sh
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Start Trial Button */}
        <button
          onClick={handleStartTrial}
          disabled={isProcessing}
          className="w-full bg-cyan-500 text-white py-3 px-4 rounded-lg hover:bg-cyan-600 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {isProcessing ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </div>
          ) : (
            `Subscribe to ${planType} - $${monthlyPrice}/month`
          )}
        </button>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By starting your trial, you agree to our{' '}
            <a href="/terms-of-service" className="text-cyan-600 hover:text-cyan-500">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy-policy" className="text-cyan-600 hover:text-cyan-500">
              Privacy Policy
            </a>
          </p>
        </div>

        {/* Back to Pricing */}
        <div className="mt-4 text-center">
          <button
            onClick={() => router.push('/pricing')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to Pricing
          </button>
        </div>
      </div>
    </div>
  );
}