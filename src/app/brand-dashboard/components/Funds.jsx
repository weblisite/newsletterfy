"use client";
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function Funds() {
  const [isLoading, setIsLoading] = useState(true);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [amount, setAmount] = useState('');
  const [savedCards, setSavedCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [newCard, setNewCard] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryDate: '',
    cvv: '',
    saveCard: true
  });

  const [balanceStats, setBalanceStats] = useState({
    availableBalance: 5280,
    pendingBalance: 0,
    totalSpent: 12450,
    totalBudget: 17730,
  });

  const [transactions, setTransactions] = useState([
    {
      id: 1,
      type: 'deposit',
      amount: 5000,
      status: 'completed',
      date: '2024-01-15',
      method: 'Credit Card (**** 4242)',
      description: 'Funds added'
    },
    {
      id: 2,
      type: 'ad_spend',
      amount: -320,
      status: 'completed',
      date: '2024-01-20',
      method: 'Automatic',
      description: 'Summer Sale Promotion'
    },
    {
      id: 3,
      type: 'deposit',
      amount: 1000,
      status: 'completed',
      date: '2024-02-05',
      method: 'Credit Card (**** 4242)',
      description: 'Funds added'
    },
    {
      id: 4,
      type: 'ad_spend',
      amount: -400,
      status: 'completed',
      date: '2024-02-10',
      method: 'Automatic',
      description: 'Summer Sale Promotion'
    },
  ]);

  // Fetch initial data
  useEffect(() => {
    fetchFundsData();
  }, []);

  const fetchFundsData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/brand/funds');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch funds data');
      }
      const data = await response.json();
      setBalanceStats(data.balanceStats);
      setTransactions(data.transactions);
      setSavedCards(data.savedCards);
      setIsLoading(false);
    } catch (error) {
      toast.error(error.message);
      console.error(error);
      setIsLoading(false);
    }
  };

  const handleAddFunds = async (e) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (paymentMethod === 'credit_card' && !selectedCard && (
      !newCard.cardNumber || !newCard.cardholderName || !newCard.expiryDate || !newCard.cvv
    )) {
      toast.error('Please fill in all card details');
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await fetch('/api/brand/funds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          paymentMethod,
          cardId: selectedCard,
          newCard: paymentMethod === 'credit_card' && !selectedCard ? newCard : undefined
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add funds');
      }

      // Reset form
      setAmount('');
      setSelectedCard(null);
      setNewCard({
        cardNumber: '',
        cardholderName: '',
        expiryDate: '',
        cvv: '',
        saveCard: true
      });
      
      setShowAddFundsModal(false);
      toast.success(`$${parseFloat(amount).toFixed(2)} added to your account`);
      
      // Refresh funds data
      fetchFundsData();
    } catch (error) {
      toast.error(error.message);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    
    // Add spaces for readability
    let formattedValue = '';
    for (let i = 0; i < value.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formattedValue += ' ';
      }
      formattedValue += value[i];
    }
    
    setNewCard({...newCard, cardNumber: formattedValue});
  };

  const handleExpiryDateChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    
    // Format as MM/YY
    if (value.length > 2) {
      value = value.slice(0, 2) + '/' + value.slice(2);
    }
    
    setNewCard({...newCard, expiryDate: value});
  };

  const getTransactionStatusClass = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionTypeClass = (type, amount) => {
    if (amount > 0) {
      return 'text-green-600';
    } else {
      return 'text-red-600';
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex justify-between items-center mb-6">
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
            <p className="text-sm text-gray-600">Total Budget</p>
            <h3 className="text-2xl font-bold text-gray-900">${balanceStats.totalBudget.toLocaleString()}</h3>
            <p className="text-sm text-gray-600">Lifetime deposits</p>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="glass-panel overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Transaction History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.method}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTransactionStatusClass(transaction.status)}`}>
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${getTransactionTypeClass(transaction.type, transaction.amount)}`}>
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                      min="10"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      type="button"
                      className={`flex items-center justify-center p-4 border rounded-lg ${
                        paymentMethod === 'card'
                          ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => setPaymentMethod('card')}
                    >
                      💳 Card
                    </button>
                    <button
                      type="button"
                      className={`flex items-center justify-center p-4 border rounded-lg ${
                        paymentMethod === 'mpesa'
                          ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => setPaymentMethod('mpesa')}
                    >
                      📱 M-Pesa
                    </button>
                    <button
                      type="button"
                      className={`flex items-center justify-center p-4 border rounded-lg ${
                        paymentMethod === 'bank'
                          ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => setPaymentMethod('bank')}
                    >
                      🏦 Bank
                    </button>
                  </div>
                </div>

                {paymentMethod === 'credit_card' && (
                  <>
                    {savedCards.length > 0 && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Saved Cards
                        </label>
                        <div className="space-y-2">
                          {savedCards.map((card) => (
                            <div
                              key={card.id}
                              className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer ${
                                selectedCard === card.id
                                  ? 'border-cyan-500 bg-cyan-50'
                                  : 'border-gray-300 hover:bg-gray-50'
                              }`}
                              onClick={() => setSelectedCard(card.id)}
                            >
                              <div className="flex items-center">
                                <div className="mr-3">
                                  {card.brand === 'visa' && <i className="fab fa-cc-visa text-blue-700 text-xl"></i>}
                                  {card.brand === 'mastercard' && <i className="fab fa-cc-mastercard text-red-600 text-xl"></i>}
                                  {card.brand === 'amex' && <i className="fab fa-cc-amex text-blue-500 text-xl"></i>}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{card.cardNumber}</div>
                                  <div className="text-xs text-gray-500">Expires {card.expiryDate}</div>
                                </div>
                              </div>
                              <div className="flex items-center">
                                {card.isDefault && (
                                  <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded mr-2">
                                    Default
                                  </span>
                                )}
                                <input
                                  type="radio"
                                  checked={selectedCard === card.id}
                                  onChange={() => setSelectedCard(card.id)}
                                  className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300"
                                />
                              </div>
                            </div>
                          ))}
                          <div
                            className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer ${
                              selectedCard === null
                                ? 'border-cyan-500 bg-cyan-50'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                            onClick={() => setSelectedCard(null)}
                          >
                            <div className="flex items-center">
                              <div className="mr-3">
                                <i className="fas fa-plus-circle text-gray-400 text-xl"></i>
                              </div>
                              <div className="text-sm font-medium text-gray-900">Use a new card</div>
                            </div>
                            <input
                              type="radio"
                              checked={selectedCard === null}
                              onChange={() => setSelectedCard(null)}
                              className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedCard === null && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Card Number
                          </label>
                          <input
                            type="text"
                            value={newCard.cardNumber}
                            onChange={handleCardNumberChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-cyan-500 focus:border-cyan-500"
                            placeholder="1234 5678 9012 3456"
                            required={paymentMethod === 'credit_card' && selectedCard === null}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cardholder Name
                          </label>
                          <input
                            type="text"
                            value={newCard.cardholderName}
                            onChange={(e) => setNewCard({...newCard, cardholderName: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-cyan-500 focus:border-cyan-500"
                            placeholder="John Smith"
                            required={paymentMethod === 'credit_card' && selectedCard === null}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Expiry Date
                            </label>
                            <input
                              type="text"
                              value={newCard.expiryDate}
                              onChange={handleExpiryDateChange}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-cyan-500 focus:border-cyan-500"
                              placeholder="MM/YY"
                              required={paymentMethod === 'credit_card' && selectedCard === null}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              CVV
                            </label>
                            <input
                              type="text"
                              value={newCard.cvv}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                if (value.length <= 4) {
                                  setNewCard({...newCard, cvv: value});
                                }
                              }}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-cyan-500 focus:border-cyan-500"
                              placeholder="123"
                              required={paymentMethod === 'credit_card' && selectedCard === null}
                            />
                          </div>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="save-card"
                            checked={newCard.saveCard}
                            onChange={(e) => setNewCard({...newCard, saveCard: e.target.checked})}
                            className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
                          />
                          <label htmlFor="save-card" className="ml-2 text-sm text-gray-700">
                            Save this card for future payments
                          </label>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {paymentMethod === 'paypal' && (
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <p className="text-sm text-gray-700 mb-2">
                      You will be redirected to PayPal to complete your payment.
                    </p>
                    <i className="fab fa-paypal text-blue-600 text-4xl"></i>
                  </div>
                )}

                <div className="mt-6">
                  <button
                    type="submit"
                    className="w-full bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 transition-colors"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      `Add ${amount ? `$${parseFloat(amount).toFixed(2)}` : 'Funds'}`
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