"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { format, addDays, addWeeks, addMonths, parseISO } from 'date-fns';
import { FaCalendar, FaClock, FaUsers, FaRepeat, FaTrash } from 'react-icons/fa';

export default function NewsletterScheduler() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScheduler, setShowScheduler] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState({
    newsletterId: '',
    sendDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    sendTime: '09:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    segment: 'all',
    frequency: 'once',
    repeatInterval: 1,
    repeatUnit: 'weeks',
  });

  const [newsletters, setNewsletters] = useState([]);
  const [segments, setSegments] = useState([
    { id: 'all', name: 'All Subscribers', count: 1000 },
    { id: 'active', name: 'Active Subscribers', count: 800 },
    { id: 'inactive', name: 'Inactive Subscribers', count: 200 },
  ]);

  useEffect(() => {
    fetchSchedules();
    fetchNewsletters();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/newsletter/schedules');
      if (!response.ok) throw new Error('Failed to fetch schedules');
      const data = await response.json();
      setSchedules(data);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  const fetchNewsletters = async () => {
    try {
      const response = await fetch('/api/newsletters');
      if (!response.ok) throw new Error('Failed to fetch newsletters');
      const data = await response.json();
      setNewsletters(data);
    } catch (error) {
      console.error('Error fetching newsletters:', error);
      toast.error('Failed to load newsletters');
    }
  };

  const handleSave = async () => {
    try {
      const method = currentSchedule.id ? 'PUT' : 'POST';
      const response = await fetch('/api/newsletter/schedules', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentSchedule),
      });

      if (!response.ok) throw new Error('Failed to save schedule');
      toast.success('Schedule saved successfully');
      setShowScheduler(false);
      fetchSchedules();
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error('Failed to save schedule');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    try {
      const response = await fetch(`/api/newsletter/schedules/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete schedule');
      toast.success('Schedule deleted successfully');
      fetchSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Failed to delete schedule');
    }
  };

  const calculateNextSendDate = (schedule) => {
    const baseDate = parseISO(schedule.sendDate);
    
    switch (schedule.repeatUnit) {
      case 'days':
        return format(addDays(baseDate, schedule.repeatInterval), 'MMM d, yyyy');
      case 'weeks':
        return format(addWeeks(baseDate, schedule.repeatInterval), 'MMM d, yyyy');
      case 'months':
        return format(addMonths(baseDate, schedule.repeatInterval), 'MMM d, yyyy');
      default:
        return format(baseDate, 'MMM d, yyyy');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Newsletter Schedules</h1>
        <button
          onClick={() => {
            setCurrentSchedule({
              newsletterId: '',
              sendDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
              sendTime: '09:00',
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              segment: 'all',
              frequency: 'once',
              repeatInterval: 1,
              repeatUnit: 'weeks',
            });
            setShowScheduler(true);
          }}
          className="flex items-center px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
        >
          <FaCalendar className="mr-2" />
          New Schedule
        </button>
      </div>

      {showScheduler ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            <div>
              <label className="block font-medium mb-2">Newsletter</label>
              <select
                value={currentSchedule.newsletterId}
                onChange={(e) =>
                  setCurrentSchedule((prev) => ({ ...prev, newsletterId: e.target.value }))
                }
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Select a newsletter</option>
                {newsletters.map((newsletter) => (
                  <option key={newsletter.id} value={newsletter.id}>
                    {newsletter.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-2">Send Date</label>
                <input
                  type="date"
                  value={currentSchedule.sendDate}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  onChange={(e) =>
                    setCurrentSchedule((prev) => ({ ...prev, sendDate: e.target.value }))
                  }
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium mb-2">Send Time</label>
                <input
                  type="time"
                  value={currentSchedule.sendTime}
                  onChange={(e) =>
                    setCurrentSchedule((prev) => ({ ...prev, sendTime: e.target.value }))
                  }
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium mb-2">Timezone</label>
              <select
                value={currentSchedule.timezone}
                onChange={(e) =>
                  setCurrentSchedule((prev) => ({ ...prev, timezone: e.target.value }))
                }
                className="w-full p-2 border rounded-lg"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
              </select>
            </div>

            <div>
              <label className="block font-medium mb-2">Subscriber Segment</label>
              <select
                value={currentSchedule.segment}
                onChange={(e) =>
                  setCurrentSchedule((prev) => ({ ...prev, segment: e.target.value }))
                }
                className="w-full p-2 border rounded-lg"
              >
                {segments.map((segment) => (
                  <option key={segment.id} value={segment.id}>
                    {segment.name} ({segment.count} subscribers)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium mb-2">Frequency</label>
              <select
                value={currentSchedule.frequency}
                onChange={(e) =>
                  setCurrentSchedule((prev) => ({ ...prev, frequency: e.target.value }))
                }
                className="w-full p-2 border rounded-lg"
              >
                <option value="once">One-time</option>
                <option value="recurring">Recurring</option>
              </select>
            </div>

            {currentSchedule.frequency === 'recurring' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-2">Repeat Every</label>
                  <input
                    type="number"
                    min="1"
                    value={currentSchedule.repeatInterval}
                    onChange={(e) =>
                      setCurrentSchedule((prev) => ({
                        ...prev,
                        repeatInterval: parseInt(e.target.value),
                      }))
                    }
                    className="w-full p-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-2">Unit</label>
                  <select
                    value={currentSchedule.repeatUnit}
                    onChange={(e) =>
                      setCurrentSchedule((prev) => ({ ...prev, repeatUnit: e.target.value }))
                    }
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowScheduler(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules.map((schedule) => (
            <div key={schedule.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">
                    {newsletters.find((n) => n.id === schedule.newsletterId)?.name || 'Untitled'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {schedule.frequency === 'recurring'
                      ? `Every ${schedule.repeatInterval} ${schedule.repeatUnit}`
                      : 'One-time'}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setCurrentSchedule(schedule);
                      setShowScheduler(true);
                    }}
                    className="text-gray-600 hover:text-cyan-600"
                  >
                    <FaCalendar />
                  </button>
                  <button
                    onClick={() => handleDelete(schedule.id)}
                    className="text-gray-600 hover:text-red-600"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-600">
                  <FaClock className="mr-2" />
                  {format(parseISO(schedule.sendDate), 'MMM d, yyyy')} at {schedule.sendTime}
                </div>
                <div className="flex items-center text-gray-600">
                  <FaUsers className="mr-2" />
                  {segments.find((s) => s.id === schedule.segment)?.name}
                </div>
                {schedule.frequency === 'recurring' && (
                  <div className="flex items-center text-gray-600">
                    <FaRepeat className="mr-2" />
                    Next: {calculateNextSendDate(schedule)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 