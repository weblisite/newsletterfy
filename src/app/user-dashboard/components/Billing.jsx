'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Plan definitions (this would ideally be imported from a shared file)
const PLAN_FEATURES = {
  Free: {
    name: 'Free',
    price: 0,
    maxSubscribers: 1000,
    maxEmailsPerMonth: 1000,
    features: {
      newsletters: 1,
      analytics: 'Basic',
      support: 'Community',
      monetization: ['Donations'],
      customDomain: false,
      brandingRemoval: false,
      automation: false,
      segmentation: false,
      crossPromotions: false,
      api: false
    }
  },
  Pro: {
    name: 'Pro',
    price: 29,
    maxSubscribers: 5000,
    maxEmailsPerMonth: 25000,
    features: {
      newsletters: 10,
      analytics: 'Advanced',
      support: 'Email',
      monetization: ['Donations', 'Digital Products', 'Subscriptions', 'Brand Funds'],
      customDomain: true,
      brandingRemoval: true,
      automation: true,
      segmentation: true,
      crossPromotions: true,
      api: false
    }
  },
  Business: {
    name: 'Business',
    price: 89,
    maxSubscribers: 25000,
    maxEmailsPerMonth: 100000,
    features: {
      newsletters: 50,
      analytics: 'Enterprise',
      support: 'Priority',
      monetization: ['All Features', 'Ad Placements'],
      customDomain: true,
      brandingRemoval: true,
      automation: true,
      segmentation: true,
      crossPromotions: true,
      api: true
    }
  },
  Enterprise: {
    name: 'Enterprise',
    price: 299,
    maxSubscribers: 100000,
    maxEmailsPerMonth: -1,
    features: {
      newsletters: -1,
      analytics: 'Custom',
      support: 'Dedicated',
      monetization: ['All Features', 'White-label'],
      customDomain: true,
      brandingRemoval: true,
      automation: true,
      segmentation: true,
      crossPromotions: true,
      api: true
    }
  }
};

const PLAN_TIERS = {
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

export default function Billing({ user }) {
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState('Free');
  const [currentUsage, setCurrentUsage] = useState({
    subscribers: 0,
    emailsSent: 0,
    newsletters: 0
  });
  const [billingHistory, setBillingHistory] = useState([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [paymentMethod, setPaymentMethod] = useState('card');

  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      
      // Fetch current user plan and usage
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan_type, subscriber_count')
        .eq('id', user.id)
        .single();

      if (profile) {
        setCurrentPlan(profile.plan_type || 'Free');
        setCurrentUsage(prev => ({
          ...prev,
          subscribers: profile.subscriber_count || 0
        }));
      }

      // Fetch billing history
      const { data: payments } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setBillingHistory(payments || []);
      
    } catch (error) {
      console.error('Error fetching billing data:', error);
      toast.error('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan, tier) => {
    try {
      const response = await fetch('/api/payments/polar-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_type: plan,
          subscriber_tier: tier.subscribers,
          customer_email: user.email,
          customer_name: user.user_metadata?.full_name || user.email,
          success_url: `${window.location.origin}/user-dashboard?upgrade=success`,
          cancel_url: `${window.location.origin}/user-dashboard`,
          metadata: {
            source: 'dashboard_billing',
            user_id: user.id
          }
        }),
      });

      const data = await response.json();

      if (data.success && data.checkout_url) {
        // Redirect to Polar.sh checkout
        window.location.href = data.checkout_url;
      } else {
        toast.error(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast.error('Failed to process upgrade');
    }
  };

  const PlanCard = ({ planName, planData, isCurrent = false }) => (
    <div className={`rounded-lg border-2 p-6 ${
      isCurrent 
        ? 'border-cyan-500 bg-cyan-50' 
        : 'border-gray-200 bg-white hover:border-gray-300'
    } transition-all duration-200`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">{planName}</h3>
        {isCurrent && (
          <span className="bg-cyan-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            Current Plan
          </span>
        )}
      </div>
      
      <div className="mb-6">
        <span className="text-3xl font-bold text-gray-900">
          ${planData.price}
        </span>
        <span className="text-gray-600">/month</span>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center text-sm">
          <i className="fas fa-users text-cyan-500 w-5 mr-2"></i>
          <span>{planData.maxSubscribers === -1 ? 'Unlimited' : planData.maxSubscribers.toLocaleString()} subscribers</span>
        </div>
        <div className="flex items-center text-sm">
          <i className="fas fa-envelope text-cyan-500 w-5 mr-2"></i>
          <span>{planData.maxEmailsPerMonth === -1 ? 'Unlimited' : planData.maxEmailsPerMonth.toLocaleString()} emails/month</span>
        </div>
        <div className="flex items-center text-sm">
          <i className="fas fa-newspaper text-cyan-500 w-5 mr-2"></i>
          <span>{planData.features.newsletters === -1 ? 'Unlimited' : planData.features.newsletters} newsletters</span>
        </div>
        <div className="flex items-center text-sm">
          <i className="fas fa-chart-line text-cyan-500 w-5 mr-2"></i>
          <span>{planData.features.analytics} analytics</span>
        </div>
        <div className="flex items-center text-sm">
          <i className="fas fa-headset text-cyan-500 w-5 mr-2"></i>
          <span>{planData.features.support} support</span>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-2">Monetization Features:</h4>
        <div className="space-y-1">
          {planData.features.monetization.map((feature, index) => (
            <div key={index} className="flex items-center text-sm text-gray-600">
              <i className="fas fa-check text-green-500 w-4 mr-2"></i>
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {planData.features.customDomain && (
          <div className="flex items-center text-sm text-gray-600">
            <i className="fas fa-globe text-green-500 w-4 mr-2"></i>
            <span>Custom domain</span>
          </div>
        )}
        {planData.features.brandingRemoval && (
          <div className="flex items-center text-sm text-gray-600">
            <i className="fas fa-eye-slash text-green-500 w-4 mr-2"></i>
            <span>Remove Newsletterfy branding</span>
          </div>
        )}
        {planData.features.automation && (
          <div className="flex items-center text-sm text-gray-600">
            <i className="fas fa-robot text-green-500 w-4 mr-2"></i>
            <span>Email automation</span>
          </div>
        )}
        {planData.features.api && (
          <div className="flex items-center text-sm text-gray-600">
            <i className="fas fa-code text-green-500 w-4 mr-2"></i>
            <span>API access</span>
          </div>
        )}
      </div>

      {!isCurrent && (
        <button
          onClick={() => {
            setSelectedPlan(planName);
            setSelectedTier(null);
            setShowUpgradeModal(true);
          }}
          className="w-full mt-6 bg-cyan-500 text-white py-2 px-4 rounded-lg hover:bg-cyan-600 transition-colors"
        >
          Upgrade to {planName}
        </button>
      )}
    </div>
  );

  const UpgradeModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Upgrade to {selectedPlan}</h3>
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          {/* Tier Selection */}
          {(selectedPlan === 'Pro' || selectedPlan === 'Business') && (
            <div className="mb-6">
              <h4 className="font-medium mb-3">Select subscriber tier:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PLAN_TIERS[selectedPlan].map((tier, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedTier(tier)}
                    className={`p-3 border rounded-lg text-left transition-colors ${
                      selectedTier?.subscribers === tier.subscribers
                        ? 'border-cyan-500 bg-cyan-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{tier.subscribers.toLocaleString()} subscribers</div>
                    <div className="text-cyan-600 font-bold">${tier.price}/month</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Payment Method Selection */}
          <div className="mb-6">
            <h4 className="font-medium mb-3">Payment Method:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => setPaymentMethod('card')}
                className={`p-3 border rounded-lg text-center transition-colors ${
                  paymentMethod === 'card'
                    ? 'border-cyan-500 bg-cyan-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <i className="fas fa-credit-card text-2xl mb-2"></i>
                <div className="font-medium">Credit/Debit Card</div>
                <div className="text-sm text-gray-600">Visa, Mastercard</div>
              </button>
              <button
                onClick={() => setPaymentMethod('mpesa')}
                className={`p-3 border rounded-lg text-center transition-colors ${
                  paymentMethod === 'mpesa'
                    ? 'border-cyan-500 bg-cyan-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <i className="fas fa-mobile-alt text-2xl mb-2"></i>
                <div className="font-medium">M-Pesa</div>
                <div className="text-sm text-gray-600">Mobile Money</div>
              </button>
              <button
                onClick={() => setPaymentMethod('bank')}
                className={`p-3 border rounded-lg text-center transition-colors ${
                  paymentMethod === 'bank'
                    ? 'border-cyan-500 bg-cyan-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <i className="fas fa-university text-2xl mb-2"></i>
                <div className="font-medium">Bank Transfer</div>
                <div className="text-sm text-gray-600">Direct Transfer</div>
              </button>
            </div>
          </div>

          {/* Upgrade Summary */}
          {selectedTier && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h4 className="font-medium mb-2">Upgrade Summary:</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Plan:</span>
                  <span className="font-medium">{selectedPlan}</span>
                </div>
                <div className="flex justify-between">
                  <span>Subscribers:</span>
                  <span className="font-medium">{selectedTier.subscribers.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Monthly Cost:</span>
                  <span className="font-medium">${selectedTier.price}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span className="font-medium">
                    {paymentMethod === 'card' && '💳 Card'}
                    {paymentMethod === 'mpesa' && '📱 M-Pesa'}
                    {paymentMethod === 'bank' && '🏦 Bank Transfer'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                const tier = selectedTier || { subscribers: PLAN_FEATURES[selectedPlan].maxSubscribers, price: PLAN_FEATURES[selectedPlan].price };
                handleUpgrade(selectedPlan, tier);
              }}
              disabled={!selectedTier && (selectedPlan === 'Pro' || selectedPlan === 'Business')}
              className="flex-1 bg-cyan-500 text-white py-2 px-4 rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Proceed to Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Billing & Plans</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'overview'
                ? 'bg-cyan-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'plans'
                ? 'bg-cyan-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Plans
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'history'
                ? 'bg-cyan-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Billing History
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Plan */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">Current Plan</h3>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-xl font-bold text-cyan-600">{currentPlan}</h4>
                  <p className="text-gray-600">
                    ${PLAN_FEATURES[currentPlan].price}/month
                  </p>
                </div>
                {currentPlan !== 'Enterprise' && (
                  <button
                    onClick={() => setActiveTab('plans')}
                    className="bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600"
                  >
                    Upgrade Plan
                  </button>
                )}
              </div>

              {/* Usage Stats */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Subscribers</span>
                    <span>{currentUsage.subscribers.toLocaleString()} / {PLAN_FEATURES[currentPlan].maxSubscribers === -1 ? '∞' : PLAN_FEATURES[currentPlan].maxSubscribers.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-cyan-500 h-2 rounded-full"
                      style={{ 
                        width: PLAN_FEATURES[currentPlan].maxSubscribers === -1 
                          ? '20%' 
                          : `${Math.min((currentUsage.subscribers / PLAN_FEATURES[currentPlan].maxSubscribers) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Emails this month</span>
                    <span>{currentUsage.emailsSent.toLocaleString()} / {PLAN_FEATURES[currentPlan].maxEmailsPerMonth === -1 ? '∞' : PLAN_FEATURES[currentPlan].maxEmailsPerMonth.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ 
                        width: PLAN_FEATURES[currentPlan].maxEmailsPerMonth === -1 
                          ? '15%' 
                          : `${Math.min((currentUsage.emailsSent / PLAN_FEATURES[currentPlan].maxEmailsPerMonth) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setActiveTab('plans')}
                  className="w-full bg-cyan-500 text-white p-3 rounded-lg hover:bg-cyan-600 transition-colors"
                >
                  <i className="fas fa-arrow-up mr-2"></i>
                  Upgrade Plan
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className="w-full bg-gray-100 text-gray-700 p-3 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <i className="fas fa-history mr-2"></i>
                  View Billing History
                </button>
              </div>
            </div>

            {/* Next Billing */}
            {currentPlan !== 'Free' && (
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4">Next Billing</h3>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    ${PLAN_FEATURES[currentPlan].price}
                  </div>
                  <div className="text-sm text-gray-600">
                    Due in 15 days
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(PLAN_FEATURES).map(([planName, planData]) => (
            <PlanCard
              key={planName}
              planName={planName}
              planData={planData}
              isCurrent={currentPlan === planName}
            />
          ))}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-lg border">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Billing History</h3>
            {billingHistory.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-receipt text-4xl text-gray-300 mb-4"></i>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No billing history</h4>
                <p className="text-gray-600">Your billing history will appear here once you upgrade to a paid plan.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {billingHistory.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{payment.plan_type} Plan</h4>
                      <p className="text-sm text-gray-600">
                        {new Date(payment.created_at).toLocaleDateString()} • {payment.payment_method}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${payment.amount}</div>
                      <div className={`text-sm ${
                        payment.status === 'active' 
                          ? 'text-green-600' 
                          : payment.status === 'pending'
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}>
                        {payment.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showUpgradeModal && <UpgradeModal />}
    </div>
  );
} 