'use client';
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useSession } from '@/lib/auth-client';

export default function WalletDepositModal({ isOpen, onClose, onSuccess }) {
  const { user } = useSession();
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDeposit = async (e) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (parseFloat(amount) < 1) {
      toast.error('Minimum deposit amount is $1.00');
      return;
    }

    if (!user) {
      toast.error('Please login to make a deposit');
      return;
    }

    try {
      setIsLoading(true);
      
      // Call new Polar-based deposit API
      const response = await fetch('/api/user/funds/polar-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          customer_email: user.email,
          customer_name: user.name || user.email,
          user_id: user.id,
          description: `Wallet deposit - $${amount}`
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create deposit checkout');
      }

      if (data.success && data.checkout_url) {
        // Redirect to Polar checkout
        window.location.href = data.checkout_url;
      } else {
        throw new Error('Invalid deposit response');
      }

    } catch (error) {
      console.error('Deposit error:', error);
      toast.error(error.message || 'Failed to process deposit');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Add Funds to Wallet</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              disabled={isLoading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleDeposit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deposit Amount
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">$</span>
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="0.00"
                  min="1"
                  step="0.01"
                  required
                  disabled={isLoading}
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Minimum deposit: $1.00
              </p>
            </div>

            <div className="mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Secure Payment with Polar
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>• Payments processed securely by Polar.sh</p>
                      <p>• Supports all major credit/debit cards</p>
                      <p>• Funds added instantly to your wallet</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  `Add $${amount || '0.00'} to Wallet`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}