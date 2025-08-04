"use client";
import React from 'react';

export default function Funds() {
  const [withdrawalRequests, setWithdrawalRequests] = React.useState([
    {
      id: 1,
      newsletter: "Tech Insider",
      amount: 500,
      status: "pending",
      date: "2024-01-15",
      paymentMethod: "bank_transfer",
      accountDetails: "**** 1234",
      type: "withdrawal",
      description: "Revenue withdrawal request",
      history: [],
    },
    {
      id: 2,
      newsletter: "Finance Weekly",
      amount: 750,
      status: "processing",
      date: "2024-01-14",
      paymentMethod: "paypal",
      accountDetails: "finance@example.com",
      type: "withdrawal",
      description: "Revenue withdrawal request",
      history: [],
    },
    {
      id: 3,
      newsletter: "Health & Wellness",
      amount: 250,
      status: "approved",
      date: "2024-01-13",
      paymentMethod: "polar",
      accountDetails: "acct_*****",
      type: "withdrawal",
      description: "Revenue withdrawal request",
      history: [],
    },
  ]);

  const handleWithdrawalStatus = (id, newStatus) => {
    setWithdrawalRequests(
      withdrawalRequests.map((request) =>
        request.id === id
          ? {
              ...request,
              status: newStatus,
              date:
                newStatus === "approved" || newStatus === "rejected"
                  ? new Date().toISOString().split("T")[0]
                  : request.date,
            }
          : request
      )
    );
  };

  return (
    <div className="animate-fadeIn p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Pending Requests
            </h3>
            <i className="fas fa-clock text-2xl text-yellow-500"></i>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {
              withdrawalRequests.filter(
                (r) => r.status === "pending"
              ).length
            }
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Awaiting approval
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Total Approved
            </h3>
            <i className="fas fa-check-circle text-2xl text-green-500"></i>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            $
            {withdrawalRequests
              .reduce(
                (acc, curr) =>
                  curr.status === "approved"
                    ? acc + curr.amount
                    : acc,
                0
              )
              .toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Approved payouts
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Processing
            </h3>
            <i className="fas fa-sync text-2xl text-blue-500 animate-spin"></i>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            $
            {withdrawalRequests
              .reduce(
                (acc, curr) =>
                  curr.status === "processing"
                    ? acc + curr.amount
                    : acc,
                0
              )
              .toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            In progress
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">
            Withdrawal Requests
          </h3>
          <div className="flex gap-2">
            <input
              type="date"
              className="px-4 py-2 border rounded-lg"
            />
            <select className="px-4 py-2 border rounded-lg">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="processing">Processing</option>
            </select>
          </div>
        </div>
        <table className="min-w-full">
          <thead>
            <tr className="bg-gradient-to-r from-[#f0f9ff] to-[#e0f2fe]">
              <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Newsletter
              </th>
              <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Request Date
              </th>
              <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment Method
              </th>
              <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {withdrawalRequests.map((request) => (
              <tr
                key={request.id}
                className="hover:bg-[#f8fafc] transition-colors duration-150"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  <div className="flex items-center">
                    <i className="fas fa-newspaper text-[#4ECDC4] mr-2"></i>
                    {request.newsletter}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  <div className="flex items-center">
                    <i className="fas fa-dollar-sign text-[#27AE60] mr-2"></i>
                    ${request.amount}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {request.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  <div className="flex items-center">
                    <i
                      className={`fas fa-${
                        request.paymentMethod === "bank_transfer"
                          ? "university"
                          : request.paymentMethod
                      } text-[#3498DB] mr-2`}
                    ></i>
                    {request.accountDetails}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={request.status}
                    onChange={(e) =>
                      handleWithdrawalStatus(
                        request.id,
                        e.target.value
                      )
                    }
                    className={`rounded-lg border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500 ${
                      request.status === "approved"
                        ? "text-green-600"
                        : request.status === "rejected"
                        ? "text-red-600"
                        : request.status === "processing"
                        ? "text-blue-600"
                        : "text-yellow-600"
                    }`}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="processing">Processing</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  <button
                    onClick={() =>
                      handleWithdrawalStatus(request.id, "approved")
                    }
                    className="text-[#27AE60] hover:text-[#219A52] transition-colors"
                    disabled={request.status === "approved"}
                  >
                    <i className="fas fa-check-circle"></i>
                  </button>
                  <button
                    onClick={() =>
                      handleWithdrawalStatus(request.id, "rejected")
                    }
                    className="text-[#FF6B6B] hover:text-[#FF4949] transition-colors"
                    disabled={request.status === "rejected"}
                  >
                    <i className="fas fa-times-circle"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 