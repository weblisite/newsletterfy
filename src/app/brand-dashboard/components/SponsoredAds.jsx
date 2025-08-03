"use client";
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import dynamic from 'next/dynamic';

// Dynamically import TinyMCE to avoid SSR issues
const Editor = dynamic(() => import('@tinymce/tinymce-react').then(mod => mod.Editor), {
  ssr: false,
  loading: () => <p>Loading editor...</p>
});

export default function SponsoredAdCampaigns({ initialShowEditor = false, onEditorClose }) {
  const [isLoading, setIsLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(initialShowEditor);
  const [ads, setAds] = useState([
    {
      id: 1,
      title: 'Summer Collection Launch',
      status: 'active',
      impressions: 12500,
      clicks: 750,
      ctr: 6.0,
      budget: 2000,
      spent: 1200,
      startDate: '2024-02-01',
      endDate: '2024-03-01',
      targetNiches: ['Fashion', 'Lifestyle'],
    },
    {
      id: 2,
      title: 'Tech Gadget Promotion',
      status: 'scheduled',
      impressions: 0,
      clicks: 0,
      ctr: 0,
      budget: 1500,
      spent: 0,
      startDate: '2024-03-01',
      endDate: '2024-03-31',
      targetNiches: ['Tech', 'Gadgets'],
    },
  ]);

  const [adData, setAdData] = useState({
    title: '',
    content: '',
    image: null,
    imagePreview: '',
    targetUrl: '',
    cpc: 0.5,
    cpm: 5.0,
    budget: 1000,
    startDate: '',
    endDate: '',
    targetNiches: [],
    targetIndustries: [],
  });

  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [campaignStats, setCampaignStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalSpent: 0,
    averageCTR: 0,
  });

  const availableNiches = [
    'Tech',
    'Fashion',
    'Lifestyle',
    'Business',
    'Finance',
    'Health',
    'Education',
    'Entertainment',
    'Sports',
    'Travel',
  ];

  const availableIndustries = [
    'Technology',
    'Retail',
    'Finance',
    'Healthcare',
    'Education',
    'Media',
    'Manufacturing',
    'Services',
    'Entertainment',
    'Travel',
  ];

  useEffect(() => {
    if (initialShowEditor) {
      setShowEditor(true);
    }
    fetchAds();
  }, [initialShowEditor]);

  const fetchAds = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/brand/ads');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to load ads');
      }
      const data = await response.json();
      setAds(data.ads);
      setCampaigns(data.campaigns);
      setCampaignStats(data.campaignStats);
      setIsLoading(false);
    } catch (error) {
      toast.error(error.message);
      console.error(error);
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (campaignId, newStatus) => {
    try {
      const response = await fetch('/api/brand/ads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update campaign status');
      }

      setCampaigns(campaigns.map(campaign => 
        campaign.id === campaignId 
          ? { ...campaign, status: newStatus }
          : campaign
      ));
      
      toast.success(`Campaign ${newStatus}`);
    } catch (error) {
      toast.error(error.message);
      console.error(error);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAdData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleContentChange = (content) => {
    setAdData(prev => ({
      ...prev,
      content,
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAdData(prev => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file),
      }));
    }
  };

  const toggleNiche = (niche) => {
    setAdData(prev => ({
      ...prev,
      targetNiches: prev.targetNiches.includes(niche)
        ? prev.targetNiches.filter(n => n !== niche)
        : [...prev.targetNiches, niche],
    }));
  };

  const toggleIndustry = (industry) => {
    setAdData(prev => ({
      ...prev,
      targetIndustries: prev.targetIndustries.includes(industry)
        ? prev.targetIndustries.filter(i => i !== industry)
        : [...prev.targetIndustries, industry],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!adData.title || !adData.content || !adData.targetUrl || !adData.budget || !adData.startDate || !adData.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const formData = new FormData();
      Object.keys(adData).forEach(key => {
        if (key === 'image') {
          if (adData[key]) formData.append(key, adData[key]);
        } else if (key === 'targetNiches' || key === 'targetIndustries') {
          formData.append(key, JSON.stringify(adData[key]));
        } else {
          formData.append(key, adData[key]);
        }
      });

      const response = await fetch('/api/brand/ads', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create ad');
      }

      const newAd = await response.json();
      setAds([...ads, newAd]);
      setShowEditor(false);
      if (onEditorClose) onEditorClose();
      toast.success('Ad created successfully');
      
      // Reset form
      setAdData({
        title: '',
        content: '',
        image: null,
        imagePreview: '',
        targetUrl: '',
        cpc: 0.5,
        cpm: 5.0,
        budget: 1000,
        startDate: '',
        endDate: '',
        targetNiches: [],
        targetIndustries: [],
      });
    } catch (error) {
      toast.error(error.message);
      console.error(error);
    }
  };

  return (
    <div className="animate-fadeIn">
      {showEditor ? (
        <div className="glass-panel p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Create New Ad</h3>
            <button
              onClick={() => {
                setShowEditor(false);
                if (onEditorClose) onEditorClose();
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Ad Title
              </label>
              <input
                type="text"
                name="title"
                value={adData.title}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Ad Content
              </label>
              <div className="mt-1">
                <Editor
                  apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY || 'no-api-key'}
                  init={{
                    height: 500,
                    menubar: false,
                    plugins: [
                      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                      'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                    ],
                    toolbar: 'undo redo | blocks | ' +
                      'bold italic forecolor | alignleft aligncenter ' +
                      'alignright alignjustify | bullist numlist outdent indent | ' +
                      'removeformat | help',
                    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
                  }}
                  onEditorChange={handleContentChange}
                  value={adData.content}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Ad Image
              </label>
              <div className="mt-1 flex items-center space-x-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
                />
                {adData.imagePreview && (
                  <img
                    src={adData.imagePreview}
                    alt="Ad preview"
                    className="h-20 w-20 object-cover rounded-md"
                  />
                )}
              </div>
            </div>

            <div className="floating-input-container">
              <input
                type="url"
                id="target-url"
                name="targetUrl"
                value={adData.targetUrl}
                onChange={handleInputChange}
                className="floating-input"
                required
                placeholder=" "
              />
              <label htmlFor="target-url" className="floating-label">Target URL</label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="floating-input-container">
                <div className="relative">
                  <span className="absolute left-3 top-4 text-gray-500">$</span>
                  <input
                    type="number"
                    id="cpc"
                    name="cpc"
                    value={adData.cpc}
                    onChange={handleInputChange}
                    min="0.1"
                    step="0.1"
                    className="floating-input pl-7"
                    placeholder=" "
                  />
                  <label htmlFor="cpc" className="floating-label">Cost per Click (CPC)</label>
                </div>
              </div>

              <div className="floating-input-container">
                <div className="relative">
                  <span className="absolute left-3 top-4 text-gray-500">$</span>
                  <input
                    type="number"
                    id="cpm"
                    name="cpm"
                    value={adData.cpm}
                    onChange={handleInputChange}
                    min="1"
                    step="0.1"
                    className="floating-input pl-7"
                    placeholder=" "
                  />
                  <label htmlFor="cpm" className="floating-label">Cost per Mille (CPM)</label>
                </div>
              </div>

              <div className="floating-input-container">
                <div className="relative">
                  <span className="absolute left-3 top-4 text-gray-500">$</span>
                  <input
                    type="number"
                    id="budget"
                    name="budget"
                    value={adData.budget}
                    onChange={handleInputChange}
                    min="100"
                    className="floating-input pl-7"
                    required
                    placeholder=" "
                  />
                  <label htmlFor="budget" className="floating-label">Budget</label>
                </div>
              </div>

              <div className="floating-input-container">
                <div className="grid grid-cols-2 gap-4">
                  <div className="floating-input-container">
                    <input
                      type="date"
                      id="start-date"
                      name="startDate"
                      value={adData.startDate}
                      onChange={handleInputChange}
                      className="floating-input"
                      required
                      placeholder=" "
                    />
                    <label htmlFor="start-date" className="floating-label">Start Date</label>
                  </div>
                  <div className="floating-input-container">
                    <input
                      type="date"
                      id="end-date"
                      name="endDate"
                      value={adData.endDate}
                      onChange={handleInputChange}
                      className="floating-input"
                      required
                      placeholder=" "
                    />
                    <label htmlFor="end-date" className="floating-label">End Date</label>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Niches
              </label>
              <div className="flex flex-wrap gap-2">
                {availableNiches.map((niche) => (
                  <button
                    key={niche}
                    type="button"
                    onClick={() => toggleNiche(niche)}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      adData.targetNiches.includes(niche)
                        ? 'bg-cyan-100 text-cyan-800'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {niche}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Industries
              </label>
              <div className="flex flex-wrap gap-2">
                {availableIndustries.map((industry) => (
                  <button
                    key={industry}
                    type="button"
                    onClick={() => toggleIndustry(industry)}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      adData.targetIndustries.includes(industry)
                        ? 'bg-cyan-100 text-cyan-800'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {industry}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowEditor(false);
                  if (onEditorClose) onEditorClose();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
              >
                Create Ad
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Sponsored Ad Campaigns</h2>
              <p className="text-gray-600">Create and manage your sponsored ad campaigns</p>
            </div>
            <button
              onClick={() => setShowEditor(true)}
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
              Create New Ad
            </button>
          </div>

          {/* Campaign Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="glass-panel p-6">
              <div className="flex flex-col">
                <p className="text-sm text-gray-600">Total Campaigns</p>
                <h3 className="text-2xl font-bold text-gray-900">{campaignStats.totalCampaigns}</h3>
                <p className="text-sm text-gray-600">All time</p>
              </div>
            </div>
            <div className="glass-panel p-6">
              <div className="flex flex-col">
                <p className="text-sm text-gray-600">Active Campaigns</p>
                <h3 className="text-2xl font-bold text-gray-900">{campaignStats.activeCampaigns}</h3>
                <p className="text-sm text-green-600">Currently running</p>
              </div>
            </div>
            <div className="glass-panel p-6">
              <div className="flex flex-col">
                <p className="text-sm text-gray-600">Total Spent</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  ${campaignStats.totalSpent.toLocaleString()}
                </h3>
                <p className="text-sm text-gray-600">All campaigns</p>
              </div>
            </div>
            <div className="glass-panel p-6">
              <div className="flex flex-col">
                <p className="text-sm text-gray-600">Average CTR</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {campaignStats.averageCTR.toFixed(2)}%
                </h3>
                <p className="text-sm text-gray-600">All campaigns</p>
              </div>
            </div>
          </div>

          {/* Campaigns List */}
          <div className="glass-panel overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Your Campaigns</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Campaign
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Budget
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Spent
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-900">
                            {campaign.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {campaign.targetNiches.join(', ')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(campaign.status)}`}>
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${campaign.budget.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${campaign.spent.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-sm text-gray-900">
                            {campaign.metrics.impressions.toLocaleString()} impressions
                          </div>
                          <div className="text-sm text-gray-500">
                            {campaign.metrics.ctr}% CTR
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-sm text-gray-900">
                            {campaign.startDate}
                          </div>
                          <div className="text-sm text-gray-500">
                            to {campaign.endDate}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {campaign.status === 'active' && (
                            <button
                              onClick={() => handleStatusChange(campaign.id, 'paused')}
                              className="text-yellow-600 hover:text-yellow-900"
                            >
                              Pause
                            </button>
                          )}
                          {campaign.status === 'paused' && (
                            <button
                              onClick={() => handleStatusChange(campaign.id, 'active')}
                              className="text-green-600 hover:text-green-900"
                            >
                              Resume
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedCampaign(campaign)}
                            className="text-cyan-600 hover:text-cyan-900"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Campaign Details Modal */}
          {selectedCampaign && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">{selectedCampaign.name}</h3>
                    <button
                      onClick={() => setSelectedCampaign(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Campaign Info */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Status</h4>
                        <span className={`mt-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(selectedCampaign.status)}`}>
                          {selectedCampaign.status.charAt(0).toUpperCase() + selectedCampaign.status.slice(1)}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Target Niches</h4>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {selectedCampaign.targetNiches.map((niche, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800"
                            >
                              {niche}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Duration</h4>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedCampaign.startDate} to {selectedCampaign.endDate}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Budget</h4>
                        <p className="mt-1 text-sm text-gray-900">
                          ${selectedCampaign.budget.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Spent</h4>
                        <p className="mt-1 text-sm text-gray-900">
                          ${selectedCampaign.spent.toLocaleString()} ({((selectedCampaign.spent / selectedCampaign.budget) * 100).toFixed(1)}%)
                        </p>
                      </div>
                    </div>

                    {/* Campaign Metrics */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Performance Metrics</h4>
                        <dl className="mt-1 grid grid-cols-1 gap-4">
                          <div className="bg-gray-50 px-4 py-3 rounded-lg">
                            <dt className="text-sm font-medium text-gray-500">Impressions</dt>
                            <dd className="mt-1 text-lg font-semibold text-gray-900">
                              {selectedCampaign.metrics.impressions.toLocaleString()}
                            </dd>
                          </div>
                          <div className="bg-gray-50 px-4 py-3 rounded-lg">
                            <dt className="text-sm font-medium text-gray-500">Clicks</dt>
                            <dd className="mt-1 text-lg font-semibold text-gray-900">
                              {selectedCampaign.metrics.clicks.toLocaleString()}
                            </dd>
                          </div>
                          <div className="bg-gray-50 px-4 py-3 rounded-lg">
                            <dt className="text-sm font-medium text-gray-500">CTR</dt>
                            <dd className="mt-1 text-lg font-semibold text-gray-900">
                              {selectedCampaign.metrics.ctr}%
                            </dd>
                          </div>
                          <div className="bg-gray-50 px-4 py-3 rounded-lg">
                            <dt className="text-sm font-medium text-gray-500">Average CPC</dt>
                            <dd className="mt-1 text-lg font-semibold text-gray-900">
                              ${selectedCampaign.metrics.averageCPC.toFixed(2)}
                            </dd>
                          </div>
                          <div className="bg-gray-50 px-4 py-3 rounded-lg">
                            <dt className="text-sm font-medium text-gray-500">Conversions</dt>
                            <dd className="mt-1 text-lg font-semibold text-gray-900">
                              {selectedCampaign.metrics.conversions.toLocaleString()} ({selectedCampaign.metrics.conversionRate}%)
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                  </div>

                  {/* Newsletter Placements */}
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-4">Newsletter Placements</h4>
                    <div className="bg-gray-50 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Newsletter
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Subscribers
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedCampaign.newsletters.map((newsletter) => (
                            <tr key={newsletter.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {newsletter.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {newsletter.subscribers.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    {selectedCampaign.status === 'active' && (
                      <button
                        onClick={() => {
                          handleStatusChange(selectedCampaign.id, 'paused');
                          setSelectedCampaign(null);
                        }}
                        className="px-4 py-2 border border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-50"
                      >
                        Pause Campaign
                      </button>
                    )}
                    {selectedCampaign.status === 'paused' && (
                      <button
                        onClick={() => {
                          handleStatusChange(selectedCampaign.id, 'active');
                          setSelectedCampaign(null);
                        }}
                        className="px-4 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-50"
                      >
                        Resume Campaign
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedCampaign(null)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 