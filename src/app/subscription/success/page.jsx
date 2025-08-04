'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SubscriptionSuccess() {
  const [countdown, setCountdown] = useState(5);
  const router = useRouter();

  useEffect(() => {
    // Start countdown to redirect to dashboard
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push('/user-dashboard?welcome=true&subscription=success');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const goToDashboard = () => {
    router.push('/user-dashboard?welcome=true&subscription=success');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full mx-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-check text-2xl text-green-600"></i>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          🎉 Payment Successful!
        </h2>
        
        <p className="text-gray-600 mb-4">
          Your subscription has been processed successfully. 
        </p>

        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <p className="text-sm text-blue-800">
            <i className="fas fa-info-circle mr-2"></i>
            Your account is being activated in real-time via Polar webhooks.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={goToDashboard}
            className="w-full bg-cyan-500 text-white px-6 py-3 rounded-lg hover:bg-cyan-600 transition duration-300 font-semibold"
          >
            Go to Dashboard Now
          </button>
          
          <p className="text-sm text-gray-500">
            Redirecting automatically in {countdown} seconds...
          </p>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-left">
          <h3 className="font-semibold text-gray-800 mb-2">What's Next?</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>✅ Access all your plan features</li>
            <li>✅ Create and send newsletters</li>
            <li>✅ Manage your subscribers</li>
            <li>✅ View analytics and reports</li>
          </ul>
        </div>
      </div>
    </div>
  );
}