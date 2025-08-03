"use client";
import React, { useState } from 'react';

export default function Analysis() {
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [selectedNewsletter, setSelectedNewsletter] = useState('all');
  const [metrics] = useState({
    totalReads: 25840,
    avgReadTime: 4.2,
    engagement: 78.5,
    retention: 92.3,
  });

  const [topContent] = useState([
    {
      id: 1,
      title: "The Future of AI in 2024",
      newsletter: "Tech Weekly",
      reads: 2580,
      engagement: 85.4,
      shares: 145,
    },
    {
      id: 2,
      title: "Investment Strategies for Beginners",
      newsletter: "Finance Insights",
      reads: 2150,
      engagement: 79.8,
      shares: 98,
    },
    {
      id: 3,
      title: "Healthy Living Guide",
      newsletter: "Health & Wellness",
      reads: 1890,
      engagement: 82.1,
      shares: 112,
    },
  ]);

  const [readerInsights] = useState([
    {
      title: "Peak Reading Times",
      insight: "Most of your readers are active between 8 AM and 11 AM EST",
      recommendation: "Consider scheduling your newsletters during these hours for maximum engagement",
      icon: "clock",
    },
    {
      title: "Popular Topics",
      insight: "Articles about emerging technologies and market trends get 45% more engagement",
      recommendation: "Focus on creating more content around these topics",
      icon: "lightbulb",
    },
    {
      title: "Content Length",
      insight: "Articles between 800-1200 words perform best with your audience",
      recommendation: "Aim for this length range in your future newsletters",
      icon: "text-height",
    },
  ]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="floating-input-container">
            <input
              type="date"
              id="start-date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
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
              value={dateRange.endDate}
              onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              className="floating-input"
              required
              placeholder=" "
            />
            <label htmlFor="end-date" className="floating-label">End Date</label>
          </div>
          <div className="floating-input-container">
            <select
              id="newsletter-select"
              value={selectedNewsletter}
              onChange={(e) => setSelectedNewsletter(e.target.value)}
              className="floating-input modern-select"
              required
            >
              <option value="all">All Newsletters</option>
              <option value="tech">Tech Weekly</option>
              <option value="finance">Finance Insights</option>
              <option value="health">Health & Wellness</option>
            </select>
            <label htmlFor="newsletter-select" className="floating-label">Select Newsletter</label>
          </div>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Total Reads
            </h3>
            <i className="fas fa-book-reader text-2xl text-cyan-500"></i>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {metrics.totalReads.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Across all newsletters
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Avg. Read Time
            </h3>
            <i className="fas fa-clock text-2xl text-green-500"></i>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {metrics.avgReadTime} min
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Per article
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Engagement Rate
            </h3>
            <i className="fas fa-chart-line text-2xl text-blue-500"></i>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {metrics.engagement}%
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Average engagement
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Retention Rate
            </h3>
            <i className="fas fa-user-check text-2xl text-purple-500"></i>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {metrics.retention}%
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Reader retention
          </p>
        </div>
      </div>

      {/* Top Content */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Top Performing Content</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Newsletter</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reads</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Engagement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shares</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topContent.map((content) => (
                <tr key={content.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{content.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{content.newsletter}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{content.reads.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{content.engagement}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{content.shares}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reader Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {readerInsights.map((insight, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {insight.title}
              </h3>
              <i className={`fas fa-${insight.icon} text-2xl text-cyan-500`}></i>
            </div>
            <p className="text-gray-600 mb-4">{insight.insight}</p>
            <p className="text-sm text-cyan-600 font-medium">
              <i className="fas fa-lightbulb mr-2"></i>
              {insight.recommendation}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
} 