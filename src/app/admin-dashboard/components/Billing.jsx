"use client";
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FaCreditCard, FaHistory } from 'react-icons/fa';

  const plans = [
    {
    name: 'Basic',
    price: 29,
      features: [
      'Up to 1,000 subscribers',
      'Basic analytics',
      'Email support',
      'API access'
    ],
    priceId: 'price_basic'
  },
  {
    name: 'Pro',
    price: 79,
      features: [
      'Up to 10,000 subscribers',
      'Advanced analytics',
      'Priority support',
      'API access',
      'Custom domain'
    ],
    priceId: 'price_pro'
  },
  {
    name: 'Enterprise',
    price: 199,
      features: [
      'Unlimited subscribers',
      'Advanced analytics',
      'Premium support',
      'API access',
      'Custom domain',
      'Dedicated account manager'
    ],
    priceId: 'price_enterprise'
  }
];

export default function Billing() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryDate: '',
    cvv: '',
    saveCard: false
  });
  const [paymentHistory, setPaymentHistory] = useState([]);

  useEffect(() => {
    fetchBillingInfo();
  }, []);

  const fetchBillingInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/billing');
      
      if (!response.ok) {
        throw new Error('Failed to fetch billing information');
      }

      const data = await response.json();
      
      setCurrentPlan(data.subscription);
      setPaymentHistory(data.paymentHistory || []);
    } catch (error) {
      console.error('Error fetching billing info:', error);
      toast.error('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = async (plan) => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/billing', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: plan.name,
          priceId: plan.priceId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update subscription');
      }

      const data = await response.json();
      setCurrentPlan(data);
      toast.success('Subscription updated successfully');
      setShowPaymentForm(false);
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast.error('Failed to update subscription');
    } finally {
      setSaving(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await fetch('/api/admin/billing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethod
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add payment method');
      }

      toast.success('Payment method added successfully');
      setShowPaymentForm(false);
      setPaymentMethod({
        cardNumber: '',
        cardholderName: '',
        expiryDate: '',
        cvv: '',
        saveCard: false
      });
    } catch (error) {
      console.error('Error adding payment method:', error);
      toast.error('Failed to add payment method');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Current Plan */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Current Plan</h2>
            <div className="flex items-center justify-between">
              <div>
            <p className="text-lg font-medium text-gray-900">{currentPlan?.plan || 'No active plan'}</p>
            <p className="text-sm text-gray-500">Next billing date: {
              currentPlan?.current_period_end 
                ? new Date(currentPlan.current_period_end).toLocaleDateString()
                : 'N/A'
            }</p>
              </div>
          <button
            onClick={() => setShowPaymentForm(true)}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
          >
            Change Plan
              </button>
        </div>
      </div>

      {/* Payment Form */}
      {showPaymentForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Payment Method</h2>
            <FaCreditCard className="text-cyan-600 text-xl" />
          </div>
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="floating-input-container">
              <input
                type="text"
                id="card-number"
                className="floating-input"
                value={paymentMethod.cardNumber}
                onChange={(e) => setPaymentMethod(prev => ({ ...prev, cardNumber: e.target.value }))}
                required
                maxLength="19"
                pattern="\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}"
              />
              <label htmlFor="card-number" className="floating-label">Card Number</label>
            </div>

            <div className="floating-input-container">
              <input
                type="text"
                id="cardholder-name"
                className="floating-input"
                value={paymentMethod.cardholderName}
                onChange={(e) => setPaymentMethod(prev => ({ ...prev, cardholderName: e.target.value }))}
                required
              />
              <label htmlFor="cardholder-name" className="floating-label">Cardholder Name</label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="floating-input-container">
                <input
                  type="text"
                  id="expiry-date"
                  className="floating-input"
                  value={paymentMethod.expiryDate}
                  onChange={(e) => setPaymentMethod(prev => ({ ...prev, expiryDate: e.target.value }))}
                  required
                  maxLength="5"
                  pattern="\d{2}/\d{2}"
                  placeholder="MM/YY"
                />
                <label htmlFor="expiry-date" className="floating-label">Expiry Date</label>
              </div>

              <div className="floating-input-container">
                <input
                  type="text"
                  id="cvv"
                  className="floating-input"
                  value={paymentMethod.cvv}
                  onChange={(e) => setPaymentMethod(prev => ({ ...prev, cvv: e.target.value }))}
                  required
                  maxLength="4"
                  pattern="\d{3,4}"
                />
                <label htmlFor="cvv" className="floating-label">CVV</label>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="save-card"
                className="w-4 h-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                checked={paymentMethod.saveCard}
                onChange={(e) => setPaymentMethod(prev => ({ ...prev, saveCard: e.target.checked }))}
              />
              <label htmlFor="save-card" className="text-sm text-gray-700">Save card for future payments</label>
        </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowPaymentForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:bg-gray-400"
              >
                {saving ? 'Saving...' : 'Save Payment Method'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Available Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {plans.map((plan) => (
          <div key={plan.name} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{plan.name}</h3>
            <p className="text-3xl font-bold text-gray-900 mb-4">${plan.price}<span className="text-sm font-normal text-gray-500">/month</span></p>
            <ul className="space-y-2 mb-6">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
              onClick={() => handlePlanChange(plan)}
              disabled={saving || currentPlan?.plan === plan.name}
              className={`w-full px-4 py-2 rounded-lg transition-colors ${
                currentPlan?.plan === plan.name
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-cyan-600 text-white hover:bg-cyan-700'
              }`}
            >
              {currentPlan?.plan === plan.name ? 'Current Plan' : 'Select Plan'}
                </button>
              </div>
            ))}
          </div>

      {/* Payment History */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Payment History</h2>
          <FaHistory className="text-cyan-600 text-xl" />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
              <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paymentHistory.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(payment.created_at).toLocaleDateString()}
                    </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${payment.amount.toFixed(2)}
                    </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.plan}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      payment.status === 'succeeded'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                        {payment.status}
                      </span>
                    </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-600 hover:text-cyan-800">
                    <a href={payment.invoice_url} target="_blank" rel="noopener noreferrer">
                      View Invoice
                    </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      </div>
    </div>
  );
} 