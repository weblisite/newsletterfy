'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function SubscriptionSuccess() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [error, setError] = useState(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const paymentId = searchParams.get('id');
    const reference = searchParams.get('ref');

    if (paymentId || reference) {
      // Verify payment status
      verifyPayment(paymentId, reference);
    } else {
      setError('Payment reference not found');
      setLoading(false);
    }
  }, [searchParams]);

  const verifyPayment = async (paymentId, reference) => {
    try {
      const response = await fetch('/api/subscriptions/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payment_id: paymentId, reference }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSubscription(data.subscription);
      } else {
        setError(data.error || 'Payment verification failed');
      }
    } catch (err) {
      setError('Failed to verify payment');
    } finally {
      setLoading(false);
    }
  };

  const goToDashboard = () => {
    window.location.href = '/user-dashboard?welcome=true&newSubscription=true';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full mx-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Verifying Your Payment
          </h2>
          <p className="text-gray-600">
            Please wait while we confirm your subscription...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full mx-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-times text-2xl text-red-600"></i>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Payment Failed
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-cyan-500 text-white px-6 py-3 rounded-lg hover:bg-cyan-600 transition duration-300"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = '/support'}
              className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition duration-300"
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full mx-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-check text-2xl text-green-600"></i>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          🎉 Welcome to Newsletterfy!
        </h2>
        
        <p className="text-gray-600 mb-6">
          Your subscription has been activated successfully.
        </p>

        {subscription && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
            <h3 className="font-semibold text-gray-800 mb-2">Subscription Details:</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="font-medium">Plan:</span> {subscription.plan_type}</p>
              <p><span className="font-medium">Subscriber Limit:</span> {subscription.subscriber_limit?.toLocaleString()}</p>
              <p><span className="font-medium">Amount:</span> ${subscription.amount} {subscription.currency}</p>
              <p><span className="font-medium">Payment Method:</span> 
                {subscription.payment_method === 'mpesa' && ' 📱 M-Pesa'}
                {subscription.payment_method === 'card' && ' 💳 Card'}
                {subscription.payment_method === 'bank' && ' 🏦 Bank Transfer'}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={goToDashboard}
            className="w-full bg-cyan-500 text-white px-6 py-3 rounded-lg hover:bg-cyan-600 transition duration-300 font-semibold"
          >
            Go to Dashboard
          </button>
          
          <p className="text-xs text-gray-500">
            You can now access all features included in your plan
          </p>
        </div>
      </div>
    </div>
  );
} 