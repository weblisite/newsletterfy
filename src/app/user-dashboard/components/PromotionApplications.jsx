"use client";
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FaCheck, FaTimes, FaClock, FaEnvelope } from 'react-icons/fa';

export default function PromotionApplications() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('received');
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    fetchApplications();
  }, [activeTab]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const endpoint = activeTab === 'received' 
        ? '/api/user/applications/received'
        : '/api/user/applications/sent';
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const data = await response.json();
      setApplications(data.applications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId, status) => {
    try {
      setSaving(true);
      const response = await fetch('/api/marketplace/cross-promotions/apply', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ applicationId, status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update application status');
      }

      toast.success('Application status updated successfully');
      fetchApplications();
    } catch (error) {
      console.error('Error updating application status:', error);
      toast.error('Failed to update application status');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            <FaCheck className="inline-block mr-1" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            <FaTimes className="inline-block mr-1" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
            <FaClock className="inline-block mr-1" />
            Pending
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Promotion Applications</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('received')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'received'
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Received
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'sent'
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Sent
          </button>
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {activeTab === 'received' ? 'Applicant' : 'Promotion'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Newsletter Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Promotion Terms
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                {activeTab === 'received' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applications.map((application) => (
                <tr key={application.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {activeTab === 'received' 
                        ? application.applicant_newsletter_name
                        : application.promotion_newsletter_name
                      }
                    </div>
                    <div className="text-sm text-gray-500">
                      Applied {new Date(application.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {application.applicant_subscriber_count?.toLocaleString()} subscribers
                    </div>
                    <div className="text-sm text-gray-500">
                      {application.applicant_open_rate}% open rate
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ${parseFloat(application.price_per_subscriber).toFixed(2)} per subscriber
                    </div>
                    <div className="text-sm text-gray-500">
                      ${parseFloat(application.daily_budget).toFixed(2)} daily budget
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(application.status)}
                  </td>
                  {activeTab === 'received' && application.status === 'pending' && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleStatusUpdate(application.id, 'approved')}
                        disabled={saving}
                        className="text-green-600 hover:text-green-800 transition-colors mr-4"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(application.id, 'rejected')}
                        disabled={saving}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        Reject
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {applications.length === 0 && (
          <div className="text-center py-12">
            <FaEnvelope className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">
              No applications {activeTab === 'received' ? 'received' : 'sent'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {activeTab === 'received'
                ? 'You haven\'t received any applications for your promotions yet.'
                : 'You haven\'t applied to any promotions yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 