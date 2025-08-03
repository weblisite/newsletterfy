"use client";
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';

export default function Funds() {
  const [isLoading, setIsLoading] = useState(true);
  const [showAddMethodModal, setShowAddMethodModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [newMethod, setNewMethod] = useState({
    type: 'bank_transfer',
    accountNumber: '',
    accountName: '',
    bankName: '',
    routingNumber: '',
  });

  const [balanceStats, setBalanceStats] = useState({
    availableBalance: 0,
    pendingBalance: 0,
    totalEarnings: 0,
    withdrawnAmount: 0,
  });

  const [transactions, setTransactions] = useState([]);
  const [withdrawalMethods, setWithdrawalMethods] = useState([]);

  // Fetch initial data
  useEffect(() => {
    fetchFundsData();
  }, []);

  const fetchFundsData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/funds');
      if (!response.ok) throw new Error('Failed to fetch funds data');
      
      const data = await response.json();
      setBalanceStats(data.balanceStats || {
        availableBalance: 0,
        pendingBalance: 0,
        totalEarnings: 0,
        withdrawnAmount: 0,
      });
      setTransactions(data.transactions || []);
      setWithdrawalMethods(data.withdrawalMethods || []);
    } catch (error) {
      toast.error('Failed to load funds data');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportTransactions = () => {
    try {
      const ws = XLSX.utils.json_to_sheet(transactions);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Transactions");
      XLSX.writeFile(wb, "transactions_export.xlsx");
      toast.success('Transactions exported successfully');
    } catch (error) {
      toast.error('Failed to export transactions');
    }
  };

  const handleAddWithdrawalMethod = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/funds/withdrawal-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMethod),
      });

      if (!response.ok) throw new Error('Failed to add withdrawal method');
      
      const method = await response.json();
      setWithdrawalMethods([...withdrawalMethods, method]);
      setShowAddMethodModal(false);
      setNewMethod({
        type: 'bank_transfer',
        accountNumber: '',
        accountName: '',
        bankName: '',
        routingNumber: '',
      });
      toast.success('Withdrawal method added successfully');
    } catch (error) {
      toast.error('Failed to add withdrawal method');
      console.error(error);
    }
  };

  const handleWithdrawFunds = async (e) => {
    e.preventDefault();
    try {
      if (!selectedMethod) {
        toast.error('Please select a withdrawal method');
        return;
      }

      const amount = parseFloat(withdrawAmount);
      if (isNaN(amount) || amount <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }

      if (amount > (balanceStats?.availableBalance || 0)) {
        toast.error('Insufficient funds');
        return;
      }

      const response = await fetch('/api/funds/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          methodId: selectedMethod.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process withdrawal');
      }

      const transaction = await response.json();
      setTransactions([transaction, ...transactions]);
      setBalanceStats({
        ...balanceStats,
        availableBalance: (balanceStats?.availableBalance || 0) - amount,
        withdrawnAmount: (balanceStats?.withdrawnAmount || 0) + amount,
      });

      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setSelectedMethod(null);
      toast.success('Withdrawal initiated successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to process withdrawal');
      console.error(error);
    }
  };

  const handleSetDefaultMethod = async (methodId) => {
    try {
      const response = await fetch('/api/funds/withdrawal-methods', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ methodId }),
      });

      if (!response.ok) throw new Error('Failed to update withdrawal method');

      setWithdrawalMethods(
        withdrawalMethods.map(method => ({
          ...method,
          isDefault: method.id === methodId,
        }))
      );
      toast.success('Default withdrawal method updated');
    } catch (error) {
      toast.error('Failed to update withdrawal method');
      console.error(error);
    }
  };

  const handleDeleteMethod = async (methodId) => {
    try {
      const response = await fetch(`/api/funds/withdrawal-methods?id=${methodId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete withdrawal method');

      setWithdrawalMethods(
        withdrawalMethods.filter(method => method.id !== methodId)
      );
      toast.success('Withdrawal method removed');
    } catch (error) {
      toast.error('Failed to delete withdrawal method');
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Available Balance
            </h3>
            <i className="fas fa-wallet text-2xl text-green-500"></i>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${(balanceStats?.availableBalance || 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Ready to withdraw
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Pending Balance
            </h3>
            <i className="fas fa-clock text-2xl text-yellow-500"></i>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${(balanceStats?.pendingBalance || 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Processing
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Total Earnings
            </h3>
            <i className="fas fa-chart-line text-2xl text-cyan-500"></i>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${(balanceStats?.totalEarnings || 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Lifetime earnings
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Withdrawn
            </h3>
            <i className="fas fa-money-bill-wave text-2xl text-cyan-400"></i>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${(balanceStats?.withdrawnAmount || 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Total withdrawn
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                Recent Transactions
              </h2>
              <button 
                onClick={handleExportTransactions}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <i className="fas fa-download mr-2"></i>
                Export
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Newsletter
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {transaction.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            transaction.type === "withdrawal"
                              ? "bg-red-100 text-red-800"
                              : transaction.type === "subscription"
                              ? "bg-cyan-100 text-cyan-800"
                              : "bg-cyan-100 text-cyan-800"
                          }`}
                        >
                          {transaction.type.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <span
                          className={
                            transaction.amount < 0
                              ? "text-red-600"
                              : "text-green-600"
                          }
                        >
                          ${Math.abs(transaction.amount).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            transaction.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {transaction.newsletter || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                Withdrawal Methods
              </h2>
              <button 
                onClick={() => setShowAddMethodModal(true)}
                className="text-cyan-500 hover:text-cyan-600"
              >
                <i className="fas fa-plus-circle"></i>
              </button>
            </div>

            <div className="space-y-4">
              {withdrawalMethods.map((method) => (
                <div
                  key={method.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <i
                        className={`fas fa-${
                          method.id === "bank_transfer"
                            ? "university"
                            : method.id
                        } text-gray-400 text-xl mr-3`}
                      ></i>
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {method.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {method.accountNumber}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!method.isDefault && (
                        <button
                          onClick={() => handleSetDefaultMethod(method.id)}
                          className="text-cyan-500 hover:text-cyan-600"
                          title="Set as default"
                        >
                          <i className="fas fa-star"></i>
                        </button>
                      )}
                      {method.isDefault && (
                        <span className="px-2 py-1 bg-cyan-100 text-cyan-800 rounded-full text-xs">
                          Default
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteMethod(method.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete method"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <button 
                onClick={() => setShowWithdrawModal(true)}
                className="w-full px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
              >
                <i className="fas fa-money-bill-wave mr-2"></i>
                Withdraw Funds
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Withdrawal Method Modal */}
      {showAddMethodModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Add Withdrawal Method</h3>
              <button onClick={() => setShowAddMethodModal(false)} className="text-gray-500 hover:text-gray-700">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleAddWithdrawalMethod} className="space-y-4">
              <div className="floating-input-container">
                <select
                  id="method-type"
                  value={newMethod.type}
                  onChange={(e) => setNewMethod({ ...newMethod, type: e.target.value })}
                  className="floating-input modern-select"
                  placeholder=" "
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="paypal">PayPal</option>
                </select>
                <label htmlFor="method-type" className="floating-label">Method Type</label>
              </div>

              {newMethod.type === 'bank_transfer' ? (
                <>
                  <div className="floating-input-container">
                    <input
                      type="text"
                      id="account-name"
                      required
                      className="floating-input"
                      value={newMethod.accountName}
                      onChange={(e) => setNewMethod({ ...newMethod, accountName: e.target.value })}
                      placeholder=" "
                    />
                    <label htmlFor="account-name" className="floating-label">Account Name</label>
                  </div>
                  <div className="floating-input-container">
                    <input
                      type="text"
                      id="bank-name"
                      required
                      className="floating-input"
                      value={newMethod.bankName}
                      onChange={(e) => setNewMethod({ ...newMethod, bankName: e.target.value })}
                      placeholder=" "
                    />
                    <label htmlFor="bank-name" className="floating-label">Bank Name</label>
                  </div>
                  <div className="floating-input-container">
                    <input
                      type="text"
                      id="account-number"
                      required
                      className="floating-input"
                      value={newMethod.accountNumber}
                      onChange={(e) => setNewMethod({ ...newMethod, accountNumber: e.target.value })}
                      placeholder=" "
                    />
                    <label htmlFor="account-number" className="floating-label">Account Number</label>
                  </div>
                  <div className="floating-input-container">
                    <input
                      type="text"
                      id="routing-number"
                      required
                      className="floating-input"
                      value={newMethod.routingNumber}
                      onChange={(e) => setNewMethod({ ...newMethod, routingNumber: e.target.value })}
                      placeholder=" "
                    />
                    <label htmlFor="routing-number" className="floating-label">Routing Number</label>
                  </div>
                </>
              ) : (
                <div className="floating-input-container">
                  <input
                    type="email"
                    id="paypal-email"
                    required
                    className="floating-input"
                    value={newMethod.accountNumber}
                    onChange={(e) => setNewMethod({ ...newMethod, accountNumber: e.target.value })}
                    placeholder=" "
                  />
                  <label htmlFor="paypal-email" className="floating-label">PayPal Email</label>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-cyan-500 text-white py-2 px-4 rounded-md hover:bg-cyan-600"
              >
                Add Method
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Funds Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Withdraw Funds</h3>
              <button onClick={() => setShowWithdrawModal(false)} className="text-gray-500 hover:text-gray-700">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleWithdrawFunds} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    max={balanceStats.availableBalance}
                    className="focus:ring-cyan-500 focus:border-cyan-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Withdrawal Method</label>
                <select
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                  value={selectedMethod?.id || ''}
                  onChange={(e) => setSelectedMethod(withdrawalMethods.find(m => m.id === e.target.value))}
                >
                  <option value="">Select a method</option>
                  {withdrawalMethods.map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.name} ({method.accountNumber})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-cyan-500 text-white py-2 px-4 rounded-md hover:bg-cyan-600"
              >
                Withdraw
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 