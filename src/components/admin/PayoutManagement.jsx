import React from 'react';
import { usePayoutManagement } from '@/hooks/usePayoutManagement';

export default function PayoutManagement() {
  const {
    payouts,
    loading,
    error,
    pagination,
    updatePayoutStatus,
    changePage,
    changeLimit,
    refetch
  } = usePayoutManagement();

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updatePayoutStatus(id, newStatus);
      refetch();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-600">
        <p>Error: {error}</p>
        <button
          onClick={refetch}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <table className="min-w-full modern-table">
          <thead>
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-lg">
                ID
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Method
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-lg">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {payouts.map((payout) => (
              <tr key={payout.id} className="hover:bg-gray-50 transition-all duration-200">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {payout.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">${payout.amount.toFixed(2)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium rounded-full capitalize" style={{
                    backgroundColor: {
                      bank_transfer: 'rgba(59, 130, 246, 0.1)',
                      paypal: 'rgba(99, 102, 241, 0.1)',
                      intasend: 'rgba(16, 185, 129, 0.1)',
                      crypto: 'rgba(245, 158, 11, 0.1)'
                    }[payout.payout_method],
                    color: {
                      bank_transfer: 'rgb(59, 130, 246)',
                      paypal: 'rgb(99, 102, 241)',
                      intasend: 'rgb(16, 185, 129)',
                      crypto: 'rgb(245, 158, 11)'
                    }[payout.payout_method]
                  }}>
                    {payout.payout_method.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={payout.status}
                    onChange={(e) => handleStatusChange(payout.id, e.target.value)}
                    className="modern-input text-sm py-1"
                    style={{
                      backgroundColor: {
                        pending: 'rgba(245, 158, 11, 0.1)',
                        processing: 'rgba(59, 130, 246, 0.1)',
                        completed: 'rgba(16, 185, 129, 0.1)',
                        failed: 'rgba(239, 68, 68, 0.1)'
                      }[payout.status],
                      color: {
                        pending: 'rgb(245, 158, 11)',
                        processing: 'rgb(59, 130, 246)',
                        completed: 'rgb(16, 185, 129)',
                        failed: 'rgb(239, 68, 68)'
                      }[payout.status]
                    }}
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(payout.created_at).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(payout.created_at).toLocaleTimeString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  <div className="flex space-x-3">
                    <button
                      className="glass-button p-2 rounded-lg text-blue-600 hover:text-blue-700"
                      title="View Details"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <select
            value={pagination.limit}
            onChange={(e) => changeLimit(Number(e.target.value))}
            className="modern-input text-sm py-1"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
          <span className="text-sm text-gray-600">
            Total: {pagination.total} payouts
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => changePage(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="glass-button p-2 rounded-lg text-gray-600 hover:text-gray-900 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.total_pages}
          </span>
          <button
            onClick={() => changePage(pagination.page + 1)}
            disabled={pagination.page === pagination.total_pages}
            className="glass-button p-2 rounded-lg text-gray-600 hover:text-gray-900 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
} 