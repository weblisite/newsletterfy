"use client";
import React from 'react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';

export default function Subscribers() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSubscriberDetails, setShowSubscriberDetails] = useState(false);
  const [selectedSubscriber, setSelectedSubscriber] = useState(null);
  const [addMethod, setAddMethod] = useState('manual'); // 'manual', 'csv', 'excel', 'google'
  const [newSubscriber, setNewSubscriber] = useState({
    email: '',
    name: '',
    status: 'active',
  });

  const [subscribers, setSubscribers] = React.useState([]);
  const [subscriberStats, setSubscriberStats] = React.useState({
    total: 0,
    active: 0,
    growth: 0,
    engagement: 0,
  });
  const [loading, setLoading] = React.useState(true);

  // Fetch subscribers data
  React.useEffect(() => {
    const fetchSubscribers = async () => {
      try {
        const response = await fetch('/api/user/subscribers');
        if (!response.ok) throw new Error('Failed to fetch subscribers');
        const data = await response.json();
        
        setSubscribers(data.subscribers || []);
        setSubscriberStats({
          total: data.stats?.total || 0,
          active: data.stats?.active || 0,
          growth: data.stats?.growth || 0,
          engagement: data.stats?.engagement || 0,
        });
      } catch (error) {
        console.error('Error fetching subscribers:', error);
        toast.error('Failed to load subscribers');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscribers();
  }, []);

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        if (file.type === "text/csv" || file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
          const reader = new FileReader();
          reader.onload = async (e) => {
            const data = e.target.result;
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            // Process subscribers
            console.log('Importing subscribers:', jsonData);
            toast.success(`Successfully imported ${jsonData.length} subscribers`);
            setShowAddModal(false);
          };
          reader.readAsArrayBuffer(file);
        }
      } catch (error) {
        console.error('Error importing subscribers:', error);
        toast.error('Failed to import subscribers');
      }
    }
  };

  // Handle Google Sheets import
  const handleGoogleSheets = async (url) => {
    try {
      // Implementation for Google Sheets import
      toast.success('Successfully imported subscribers from Google Sheets');
      setShowAddModal(false);
    } catch (error) {
      toast.error('Failed to import from Google Sheets');
    }
  };

  // Handle manual subscriber addition
  const handleAddSubscriber = async (e) => {
    e.preventDefault();
    try {
      // Implementation for adding a single subscriber
      console.log('Adding subscriber:', newSubscriber);
      toast.success('Subscriber added successfully');
      setShowAddModal(false);
    } catch (error) {
      toast.error('Failed to add subscriber');
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      const ws = XLSX.utils.json_to_sheet(subscribers);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Subscribers");
      XLSX.writeFile(wb, "subscribers_export.xlsx");
      toast.success('Subscribers exported successfully');
    } catch (error) {
      toast.error('Failed to export subscribers');
    }
  };

  // Calculate subscriber quality score
  const calculateQualityScore = (stats) => {
    const openWeight = 0.4;
    const clickWeight = 0.6;
    return Math.round((stats.openRate * openWeight + stats.clickRate * clickWeight));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Total Subscribers
            </h3>
            <i className="fas fa-users text-2xl text-cyan-500"></i>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {subscriberStats.total.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Across all newsletters
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Active Subscribers
            </h3>
            <i className="fas fa-user-check text-2xl text-green-500"></i>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {subscriberStats.active.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Currently engaged
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Growth Rate
            </h3>
            <i className="fas fa-chart-line text-2xl text-purple-500"></i>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {subscriberStats.growth}%
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Last 30 days
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Engagement Rate
            </h3>
            <i className="fas fa-heart text-2xl text-red-500"></i>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {subscriberStats.engagement}%
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Average open rate
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            Recent Subscribers
          </h2>
          <div className="flex space-x-2">
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
            >
              <i className="fas fa-plus mr-2"></i>
              Add Subscriber
            </button>
            <button 
              onClick={handleExport}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <i className="fas fa-download mr-2"></i>
              Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscriber
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Newsletters
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {subscribers.map((subscriber) => (
                <tr
                  key={subscriber.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedSubscriber(subscriber);
                    setShowSubscriberDetails(true);
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-lg font-medium text-gray-600">
                          {subscriber.name[0]}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {subscriber.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {subscriber.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {subscriber.joinDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        subscriber.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {subscriber.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex flex-wrap gap-1">
                      {subscriber.newsletters.map((newsletter) => (
                        <span
                          key={newsletter}
                          className="px-2 py-1 bg-cyan-100 text-cyan-800 rounded-full text-xs"
                        >
                          {newsletter}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex space-x-2">
                      <button className="text-cyan-600 hover:text-cyan-800">
                        <i className="fas fa-edit"></i>
                      </button>
                      <button className="text-red-600 hover:text-red-800">
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Subscriber Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Add Subscribers</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="mb-4">
              <div className="flex space-x-4 mb-4">
                <button
                  onClick={() => setAddMethod('manual')}
                  className={`flex-1 py-2 px-4 rounded ${addMethod === 'manual' ? 'bg-cyan-600 text-white' : 'bg-gray-100'}`}
                >
                  Manual
                </button>
                <button
                  onClick={() => setAddMethod('csv')}
                  className={`flex-1 py-2 px-4 rounded ${addMethod === 'csv' ? 'bg-cyan-600 text-white' : 'bg-gray-100'}`}
                >
                  CSV/Excel
                </button>
                <button
                  onClick={() => setAddMethod('google')}
                  className={`flex-1 py-2 px-4 rounded ${addMethod === 'google' ? 'bg-cyan-600 text-white' : 'bg-gray-100'}`}
                >
                  Google
                </button>
              </div>

              {addMethod === 'manual' && (
                <form onSubmit={handleAddSubscriber}>
                  <div className="space-y-4">
                    <div className="floating-input-container">
                      <input
                        type="email"
                        id="subscriber-email"
                        required
                        className="floating-input"
                        value={newSubscriber.email}
                        onChange={(e) => setNewSubscriber({ ...newSubscriber, email: e.target.value })}
                        placeholder=" "
                      />
                      <label htmlFor="subscriber-email" className="floating-label">Email</label>
                    </div>
                    <div className="floating-input-container">
                      <input
                        type="text"
                        id="subscriber-name"
                        className="floating-input"
                        value={newSubscriber.name}
                        onChange={(e) => setNewSubscriber({ ...newSubscriber, name: e.target.value })}
                        placeholder=" "
                      />
                      <label htmlFor="subscriber-name" className="floating-label">Name</label>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-cyan-600 text-white py-2 px-4 rounded-md hover:bg-cyan-700"
                    >
                      Add Subscriber
                    </button>
                  </div>
                </form>
              )}

              {addMethod === 'csv' && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept=".csv,.xlsx"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer text-cyan-600 hover:text-cyan-800"
                    >
                      <i className="fas fa-cloud-upload-alt text-3xl mb-2"></i>
                      <p>Click to upload CSV or Excel file</p>
                    </label>
                  </div>
                  <a href="#" className="text-sm text-cyan-600 hover:text-cyan-800 block text-center">
                    Download template
                  </a>
                </div>
              )}

              {addMethod === 'google' && (
                <div className="space-y-4">
                  <input
                    type="url"
                    placeholder="Google Sheets URL"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                  />
                  <button
                    onClick={() => handleGoogleSheets()}
                    className="w-full bg-cyan-600 text-white py-2 px-4 rounded-md hover:bg-cyan-700"
                  >
                    Import from Google Sheets
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Subscriber Details Modal */}
      {showSubscriberDetails && selectedSubscriber && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Subscriber Details</h3>
              <button onClick={() => setShowSubscriberDetails(false)} className="text-gray-500 hover:text-gray-700">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="space-y-6">
              {/* Subscriber Info */}
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-2xl font-medium text-gray-600">
                    {selectedSubscriber.name[0]}
                  </span>
                </div>
                <div>
                  <h4 className="text-xl font-medium">{selectedSubscriber.name}</h4>
                  <p className="text-gray-500">{selectedSubscriber.email}</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Open Rate</p>
                  <p className="text-2xl font-bold">{selectedSubscriber.stats.openRate}%</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Click Rate</p>
                  <p className="text-2xl font-bold">{selectedSubscriber.stats.clickRate}%</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Quality Score</p>
                  <p className="text-2xl font-bold">{calculateQualityScore(selectedSubscriber.stats)}</p>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Location</span>
                  <span className="font-medium">{selectedSubscriber.stats.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Opened</span>
                  <span className="font-medium">{selectedSubscriber.stats.lastOpened}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Opens</span>
                  <span className="font-medium">{selectedSubscriber.stats.totalOpens}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Clicks</span>
                  <span className="font-medium">{selectedSubscriber.stats.totalClicks}</span>
                </div>
              </div>

              {/* Engagement History */}
              <div>
                <h5 className="font-medium mb-3">Recent Activity</h5>
                <div className="space-y-2">
                  {selectedSubscriber.stats.engagementHistory.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <i className={`fas fa-${activity.type === 'open' ? 'envelope-open' : 'mouse-pointer'} text-cyan-500`}></i>
                      <span>{activity.type === 'open' ? 'Opened' : 'Clicked'}</span>
                      <span className="font-medium">{activity.newsletter}</span>
                      <span className="text-gray-500">on {activity.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 