"use client";
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function AINewsletterAgent({ 
  isVisible, 
  onClose, 
  onContentGenerated, 
  previousPosts = [] 
}) {
  const [prompt, setPrompt] = useState({
    topic: '',
    goal: '',
    tone: 'professional',
    length: 'medium'
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.topic || !prompt.goal) {
      toast.error('Please fill in topic and goal');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: prompt.topic,
          goal: prompt.goal,
          tone: prompt.tone,
          length: prompt.length,
          previousPosts
        }),
      });

      const data = await response.json();
      if (data.success) {
        onContentGenerated(data.content);
        toast.success('Content generated successfully!');
        onClose();
      } else {
        throw new Error(data.message || 'Failed to generate content');
      }
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">AI Newsletter Assistant</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Topic
            </label>
            <input
              type="text"
              value={prompt.topic}
              onChange={(e) => setPrompt({ ...prompt, topic: e.target.value })}
              placeholder="e.g., Latest tech trends, Market analysis..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Goal
            </label>
            <input
              type="text"
              value={prompt.goal}
              onChange={(e) => setPrompt({ ...prompt, goal: e.target.value })}
              placeholder="e.g., Educate subscribers, Drive engagement..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tone
              </label>
              <select
                value={prompt.tone}
                onChange={(e) => setPrompt({ ...prompt, tone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="friendly">Friendly</option>
                <option value="authoritative">Authoritative</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Length
              </label>
              <select
                value={prompt.length}
                onChange={(e) => setPrompt({ ...prompt, length: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="short">Short (300 words)</option>
                <option value="medium">Medium (600 words)</option>
                <option value="long">Long (1000+ words)</option>
              </select>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isGenerating ? 'Generating...' : 'Generate Content'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 