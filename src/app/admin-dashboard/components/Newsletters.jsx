"use client";
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FaNewspaper, FaSearch, FaFilter } from 'react-icons/fa';

export default function Newsletters() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newsletters, setNewsletters] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    frequency: 'weekly',
    category: 'general',
    status: 'draft'
  });

  useEffect(() => {
    fetchNewsletters();
  }, [pagination.page, filters]);

  const fetchNewsletters = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search })
      });

      const response = await fetch(`/api/admin/newsletters?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch newsletters');
      }

      const data = await response.json();
      setNewsletters(data.newsletters);
      setPagination(prev => ({
        ...prev,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages
      }));
    } catch (error) {
      console.error('Error fetching newsletters:', error);
      toast.error('Failed to load newsletters');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await fetch('/api/admin/newsletters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create newsletter');
      }

      toast.success('Newsletter created successfully');
      setShowForm(false);
      setFormData({
        name: '',
        description: '',
        frequency: 'weekly',
        category: 'general',
        status: 'draft'
      });
      fetchNewsletters();
    } catch (error) {
      console.error('Error creating newsletter:', error);
      toast.error('Failed to create newsletter');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/newsletters', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          status
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update newsletter status');
      }

      toast.success('Newsletter status updated successfully');
      fetchNewsletters();
    } catch (error) {
      console.error('Error updating newsletter status:', error);
      toast.error('Failed to update newsletter status');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this newsletter?')) {
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/admin/newsletters', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete newsletter');
      }

      toast.success('Newsletter deleted successfully');
      fetchNewsletters();
    } catch (error) {
      console.error('Error deleting newsletter:', error);
      toast.error('Failed to delete newsletter');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FaNewspaper className="text-cyan-600 text-2xl mr-2" />
          <h1 className="text-2xl font-semibold text-gray-800">Newsletters</h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
        >
          Create Newsletter
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search newsletters..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <FaFilter className="text-gray-400" />
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-cyan-500 focus:border-cyan-500"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Newsletter Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Create Newsletter</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="floating-input-container">
              <input
                type="text"
                id="name"
                className="floating-input"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
              <label htmlFor="name" className="floating-label">Newsletter Name</label>
            </div>

            <div className="floating-input-container">
              <textarea
                id="description"
                className="floating-input floating-textarea"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
                rows={4}
              />
              <label htmlFor="description" className="floating-label">Description</label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="floating-input-container">
                <select
                  id="frequency"
                  className="floating-input"
                  value={formData.frequency}
                  onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                  required
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                <label htmlFor="frequency" className="floating-label">Frequency</label>
              </div>

              <div className="floating-input-container">
                <select
                  id="category"
                  className="floating-input"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  required
                >
                  <option value="general">General</option>
                  <option value="technology">Technology</option>
                  <option value="business">Business</option>
                  <option value="lifestyle">Lifestyle</option>
                </select>
                <label htmlFor="category" className="floating-label">Category</label>
              </div>

              <div className="floating-input-container">
                <select
                  id="status"
                  className="floating-input"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  required
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
                <label htmlFor="status" className="floating-label">Status</label>
              </div>
              </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:bg-gray-400"
              >
                {saving ? 'Creating...' : 'Create Newsletter'}
              </button>
                </div>
          </form>
              </div>
      )}

      {/* Newsletters List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {newsletters.map((newsletter) => (
              <tr key={newsletter.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{newsletter.name}</div>
                  <div className="text-sm text-gray-500">{newsletter.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {newsletter.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {newsletter.frequency}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={newsletter.status}
                    onChange={(e) => handleStatusChange(newsletter.id, e.target.value)}
                    className={`text-sm font-semibold rounded-full px-3 py-1 ${
                      newsletter.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : newsletter.status === 'draft'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{newsletter.users?.name}</div>
                  <div className="text-sm text-gray-500">{newsletter.users?.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleDelete(newsletter.id)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
                </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-700">
          Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} newsletters
              </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page === pagination.totalPages}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
          >
            Next
          </button>
          </div>
      </div>
    </div>
  );
} 