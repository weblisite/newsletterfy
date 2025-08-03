'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Payment state
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [user, setUser] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [paymentData, setPaymentData] = useState({
    email: '',
    phone: ''
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get current user
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // User not authenticated, redirect to login
        router.push('/auth/login');
        return;
      }
      
      setUser(user);
      setPaymentData(prev => ({
        ...prev,
        email: user.email
      }));
    };

    getCurrentUser();

    // Get plan from URL params
    const planFromUrl = searchParams.get('plan');
    const tierFromUrl = searchParams.get('tier');
    const priceFromUrl = searchParams.get('price');
    
    if (planFromUrl && tierFromUrl && priceFromUrl) {
      setSelectedPlan({
        type: planFromUrl,
        subscribers: parseInt(tierFromUrl),
        price: parseFloat(priceFromUrl)
      });
    } else {
      // No plan selected, redirect to pricing
      router.push('/#pricing');
    }
  }, [searchParams, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validatePayment = () => {
    if (!paymentData.email) {
      setError('Email is required');
      return false;
    }

    if (paymentMethod === 'mpesa' && !paymentData.phone) {
      setError('Phone number is required for M-Pesa payments');
      return false;
    }

    if (paymentMethod === 'mpesa' && !paymentData.phone.match(/^254\d{9}$/)) {
      setError('Please enter a valid M-Pesa number (254XXXXXXXXX)');
      return false;
    }

    return true;
  };

  const handlePayment = async () => {
    setError('');
    
    if (!validatePayment()) {
      return;
    }

    if (!selectedPlan || !user) {
      setError('Missing plan or user information');
      return;
    }

    setLoading(true);

    try {
      // Use Polar checkout API
      const response = await fetch('/api/payments/polar-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_type: selectedPlan.type,
          subscriber_tier: selectedPlan.subscribers,
          customer_email: paymentData.email,
          customer_name: user.user_metadata?.full_name || user.email,
          success_url: `${window.location.origin}/user-dashboard?newSubscription=true`,
          cancel_url: `${window.location.origin}/auth/payment?plan=${selectedPlan.type}&tier=${selectedPlan.subscribers}&price=${selectedPlan.price}`,
          metadata: {
            payment_method: paymentMethod,
            original_currency: paymentMethod === 'mpesa' ? 'KES' : 'USD'
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment initialization failed');
      }

      if (data.success && data.checkout_url) {
        // Redirect to Polar checkout
        window.location.href = data.checkout_url;
      } else {
        throw new Error('Invalid payment response');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError(error.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedPlan || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <i className="fas fa-envelope-open-text text-3xl text-cyan-500 mr-2"></i>
            <span className="text-2xl font-bold text-cyan-500">Newsletterfy</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Subscription</h1>
          <p className="text-gray-600 mt-2">Choose your payment method and complete your {selectedPlan.type} plan subscription</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Plan Summary */}
          <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{selectedPlan.type} Plan</h2>
                <p className="text-cyan-100">
                  Up to {selectedPlan.subscribers.toLocaleString()} subscribers
                </p>
                <div className="mt-2 flex items-center">
                  <span className="text-3xl font-bold">${selectedPlan.price}</span>
                  <span className="text-cyan-100 ml-2">/month</span>
                </div>
              </div>
              <div className="text-6xl opacity-50">
                💳
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="p-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Payment Method Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Payment Method</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Credit/Debit Card */}
                <div
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentMethod === 'card'
                      ? 'border-cyan-500 bg-cyan-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">💳</div>
                    <h4 className="font-medium text-gray-900">Credit/Debit Card</h4>
                    <p className="text-sm text-gray-600">Visa, Mastercard</p>
                  </div>
                </div>

                {/* M-Pesa */}
                <div
                  onClick={() => setPaymentMethod('mpesa')}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentMethod === 'mpesa'
                      ? 'border-cyan-500 bg-cyan-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">📱</div>
                    <h4 className="font-medium text-gray-900">M-Pesa</h4>
                    <p className="text-sm text-gray-600">Mobile Money</p>
                  </div>
                </div>

                {/* Bank Transfer */}
                <div
                  onClick={() => setPaymentMethod('bank')}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentMethod === 'bank'
                      ? 'border-cyan-500 bg-cyan-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">🏦</div>
                    <h4 className="font-medium text-gray-900">Bank Transfer</h4>
                    <p className="text-sm text-gray-600">Direct Deposit</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={paymentData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  readOnly
                />
              </div>

              {paymentMethod === 'mpesa' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    M-Pesa Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={paymentData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="254712345678"
                    required
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Enter your M-Pesa number in format 254XXXXXXXXX
                  </p>
                </div>
              )}
            </div>

            {/* Payment Summary */}
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Subscription ({selectedPlan.type})</span>
                <span className="font-semibold">${selectedPlan.price}/month</span>
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                <span className="font-semibold text-gray-900">Total Due Today</span>
                <span className="font-bold text-lg text-cyan-600">${selectedPlan.price}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.push('/#pricing')}
                className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition duration-300 font-medium"
              >
                Change Plan
              </button>
              <button
                onClick={handlePayment}
                disabled={loading}
                className="flex-1 bg-cyan-500 text-white py-3 px-4 rounded-lg hover:bg-cyan-600 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  `Pay $${selectedPlan.price} with ${paymentMethod === 'card' ? 'Card' : paymentMethod === 'mpesa' ? 'M-Pesa' : 'Bank'}`
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>🔒 Your payment is secured by Polar.sh. We don't store your payment information.</p>
        </div>
      </div>
    </div>
  );
} 