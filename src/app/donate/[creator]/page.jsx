"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function DonatePage() {
  const params = useParams();
  const [creator, setCreator] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [processing, setProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    fetchCreatorData();
  }, [params.creator]);

  const fetchCreatorData = async () => {
    try {
      const response = await fetch(`/api/donations/creator/${params.creator}`);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setCreator(data.creator);
      setTiers(data.tiers);
    } catch (error) {
      console.error('Error fetching creator data:', error);
      toast.error('Creator not found');
    } finally {
      setLoading(false);
    }
  };

  const handleDonate = async (e) => {
    e.preventDefault();
    setProcessing(true);

    try {
      const amount = selectedTier ? selectedTier.amount : parseFloat(customAmount);
      
      if (!amount || amount <= 0) {
        throw new Error('Please enter a valid donation amount');
      }

      if (!donorEmail || !donorName) {
        throw new Error('Please enter your name and email');
      }

      if (paymentMethod === 'mpesa' && !phoneNumber) {
        throw new Error('Please enter your M-Pesa phone number');
      }

      const response = await fetch('/api/donations/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          recipient_id: creator.id,
          tier_id: selectedTier?.id,
          message,
          donor_name: donorName,
          donor_email: donorEmail,
          phone_number: phoneNumber,
          payment_method: paymentMethod
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Handle different payment methods
      if (data.payment_method === 'mpesa') {
        toast.success(data.message);
        setShowSuccess(true);
      } else if (data.checkout_url) {
        // Redirect to Polar.sh checkout
        window.location.href = data.checkout_url;
      } else {
        setShowSuccess(true);
        toast.success('Thank you for your donation!');
      }
      
    } catch (error) {
      console.error('Donation error:', error);
      toast.error(error.message || 'Failed to process donation');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Creator Not Found</h1>
          <p className="text-gray-600">The creator you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h1>
            <p className="text-gray-600 mb-6">
              Your donation has been processed successfully. {creator.name || 'The creator'} will be notified of your support.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Return to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">Support {creator.name || 'This Creator'}</h1>
              <p className="text-blue-100">
                Show your appreciation for their amazing newsletter content
              </p>
            </div>
          </div>

          {/* Donation Form */}
          <div className="p-8">
            <form onSubmit={handleDonate} className="space-y-6">
              {/* Donation Amount Selection */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Choose Your Support Level</h3>
                
                {/* Preset Tiers */}
                {tiers.length > 0 && (
                  <div className="grid gap-3 mb-4">
                    {tiers.map((tier) => (
                      <div
                        key={tier.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedTier?.id === tier.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => {
                          setSelectedTier(tier);
                          setCustomAmount('');
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{tier.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{tier.description}</p>
                            {tier.perks?.length > 0 && (
                              <ul className="text-sm text-gray-500 mt-2">
                                {tier.perks.map((perk, index) => (
                                  <li key={index}>• {perk}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <span className="text-xl font-bold text-green-600">${tier.amount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Custom Amount */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Or enter a custom amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setSelectedTier(null);
                      }}
                      placeholder="0.00"
                      className="pl-8 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Choose Payment Method</h3>
                <div className="grid gap-3 md:grid-cols-3">
                  <div
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      paymentMethod === 'card'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setPaymentMethod('card')}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">💳</div>
                      <h4 className="font-medium">Credit/Debit Card</h4>
                      <p className="text-sm text-gray-600">Visa, Mastercard, etc.</p>
                    </div>
                  </div>
                  
                  <div
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      paymentMethod === 'mpesa'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setPaymentMethod('mpesa')}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">📱</div>
                      <h4 className="font-medium">M-Pesa</h4>
                      <p className="text-sm text-gray-600">Mobile money</p>
                    </div>
                  </div>
                  
                  <div
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      paymentMethod === 'bank'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setPaymentMethod('bank')}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">🏦</div>
                      <h4 className="font-medium">Bank Transfer</h4>
                      <p className="text-sm text-gray-600">Direct bank payment</p>
                    </div>
                  </div>
                </div>

                {/* Phone Number for M-Pesa */}
                {paymentMethod === 'mpesa' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      M-Pesa Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="254XXXXXXXXX"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Enter your phone number in international format (e.g., 254712345678)
                    </p>
                  </div>
                )}
              </div>

              {/* Donor Information */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Optional Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Leave a message for the creator..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={processing}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  processing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {processing ? 'Processing...' : `Donate $${selectedTier ? selectedTier.amount : customAmount || '0.00'}`}
              </button>

              <p className="text-sm text-gray-500 text-center">
                Payment processing powered by Polar.sh - Supporting all major payment methods
              </p>
            </form>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-4">
            Powered by Newsletterfy
          </p>
          <div className="flex justify-center space-x-6 text-xs text-gray-400">
            <span>🔒 SSL Encrypted</span>
            <span>💳 Multiple Payment Methods</span>
            <span>✅ Verified Platform</span>
          </div>
        </div>
      </div>
    </div>
  );
} 