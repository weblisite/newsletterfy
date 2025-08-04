"use client";
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function Funds() {
  const [balanceStats, setBalanceStats] = useState({
    availableBalance: 0,
    pendingBalance: 0,
    totalSpent: 0,
    totalDeposited: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchFundsData();
  }, []);

  const fetchFundsData = async () => {
    try {
      const response = await fetch('/api/brand/funds');
      if (!response.ok) throw new Error('Failed to fetch funds data');
      
      const data = await response.json();
      setBalanceStats(data.balanceStats || {
        availableBalance: 0,
        pendingBalance: 0,
        totalSpent: 0,
        totalDeposited: 0,
      });
      setTransactions(data.transactions || []);
    } catch (error) {
      toast.error('Failed to load funds data');
      console.error(error);
    }
  };

  const handleAddFunds = async (e) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (parseFloat(amount) < 1) {
      toast.error('Minimum deposit amount is $1.00');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Use new Polar-based deposit system
      const response = await fetch('/api/user/funds/polar-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          customer_email: 'brand@example.com', // TODO: Get from user session
          customer_name: 'Brand Account', // TODO: Get from user session  
          user_id: 'brand_user_id', // TODO: Get from user session
          description: 'Brand account funding'
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
      toast.error(error.message);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Funds Management</h2>
          <p className="text-gray-600">Manage your ad campaign budget</p>
        </div>
        <button
          onClick={() => setShowAddFundsModal(true)}
          className="button-primary inline-flex items-center"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Add Funds
        </button>
      </div>

      {/* Balance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="glass-panel p-6">
          <div className="flex flex-col">
            <p className="text-sm text-gray-600">Available Balance</p>
            <h3 className="text-2xl font-bold text-gray-900">${balanceStats.availableBalance.toLocaleString()}</h3>
            <p className="text-sm text-cyan-600">Ready to use for campaigns</p>
          </div>
        </div>
        <div className="glass-panel p-6">
          <div className="flex flex-col">
            <p className="text-sm text-gray-600">Pending Balance</p>
            <h3 className="text-2xl font-bold text-gray-900">${balanceStats.pendingBalance.toLocaleString()}</h3>
            <p className="text-sm text-yellow-600">Processing payments</p>
          </div>
        </div>
        <div className="glass-panel p-6">
          <div className="flex flex-col">
            <p className="text-sm text-gray-600">Total Spent</p>
            <h3 className="text-2xl font-bold text-gray-900">${balanceStats.totalSpent.toLocaleString()}</h3>
            <p className="text-sm text-gray-600">Lifetime ad spend</p>
          </div>
        </div>
        <div className="glass-panel p-6">
          <div className="flex flex-col">
            <p className="text-sm text-gray-600">Total Deposited</p>
            <h3 className="text-2xl font-bold text-gray-900">${balanceStats.totalDeposited.toLocaleString()}</h3>
            <p className="text-sm text-gray-600">Lifetime deposits</p>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="glass-panel">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h3>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions</h3>
              <p className="mt-1 text-sm text-gray-500">Add funds to start advertising campaigns.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(transaction.created_at || transaction.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          transaction.type === 'deposit' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'}>
                          {transaction.type === 'deposit' ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          transaction.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : transaction.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {transaction.campaign_name || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Funds Modal */}
      {showAddFundsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Add Funds</h3>
                <button
                  onClick={() => setShowAddFundsModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleAddFunds}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount
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
                    />
                  </div>
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
                          <p>• Funds added instantly to your account</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddFundsModal(false)}
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
                      `Add $${amount || '0.00'} to Account`
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}