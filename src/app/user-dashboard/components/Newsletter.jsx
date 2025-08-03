"use client";
import React from 'react';
import dynamic from 'next/dynamic';
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import debounce from 'lodash/debounce';
import Link from 'next/link';

// Import TinyMCE editor dynamically to avoid SSR issues
const Editor = dynamic(() => import('@tinymce/tinymce-react').then(mod => mod.Editor), {
  ssr: false,
  loading: () => <div className="h-96 w-full bg-gray-50 animate-pulse rounded-lg"></div>
});

export default function Newsletter({ initialShowEditor = false, onEditorClose, user, pendingAdContent }) {
  // State for list view
  const [showEditor, setShowEditor] = useState(initialShowEditor);
  const [newsletters] = useState([
    {
      id: 1,
      name: "Tech Weekly",
      subscribers: 1250,
      openRate: 68.5,
      lastPublished: "2024-01-15",
      status: "active",
    },
    {
      id: 2,
      name: "Finance Insights",
      subscribers: 890,
      openRate: 72.3,
      lastPublished: "2024-01-14",
      status: "active",
    },
    {
      id: 3,
      name: "Health & Wellness",
      subscribers: 2100,
      openRate: 65.8,
      lastPublished: "2024-01-13",
      status: "draft",
    },
  ]);

  // State for editor view
  const [newsletter, setNewsletter] = useState({
    name: "",
    subject: "",
    preheader: "",
    content: "",
    segment: "all",
    scheduledDate: "",
    scheduledTime: "",
  });

  const [subscriberSegments, setSubscriberSegments] = useState([]);

  const [testEmail, setTestEmail] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [showAdPanel, setShowAdPanel] = useState(false);

  // Add state for donation tiers
  const [activeDonationTiers, setActiveDonationTiers] = useState([]);

  // Add state for AI agent
  const [showAIAgent, setShowAIAgent] = useState(false);
  const [previousPosts, setPreviousPosts] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState({
    topic: '',
    goal: ''
  });
  const [showAIPrompt, setShowAIPrompt] = useState(false);

  // Effect to handle pending ad content
  useEffect(() => {
    if (pendingAdContent && showEditor) {
      setShowAdPanel(true);
      toast.success('Sponsored ad content is ready to be added to your newsletter!');
    }
  }, [pendingAdContent, showEditor]);

  // Fetch active donation tiers and subscriber segments
  useEffect(() => {
    const fetchDonationTiers = async () => {
      try {
        const response = await fetch('/api/monetization/donation-tiers');
        if (!response.ok) throw new Error('Failed to fetch donation tiers');
        const data = await response.json();
        const tiers = data.tiers || data || [];
        setActiveDonationTiers(Array.isArray(tiers) ? tiers.filter(tier => tier.status === 'active') : []);
      } catch (error) {
        console.error('Error fetching donation tiers:', error);
        setActiveDonationTiers([]);
      }
    };

    const fetchSubscriberSegments = async () => {
      try {
        const response = await fetch('/api/subscriber-segments');
        if (!response.ok) throw new Error('Failed to fetch subscriber segments');
        const data = await response.json();
        setSubscriberSegments(data.segments || []);
      } catch (error) {
        console.error('Error fetching subscriber segments:', error);
        // Fallback to default segments
        setSubscriberSegments([
          { id: "all", name: "All Subscribers", subscriber_count: 0 },
          { id: "active", name: "Active Readers", subscriber_count: 0 },
          { id: "premium", name: "Premium Subscribers", subscriber_count: 0 },
          { id: "inactive", name: "Inactive (90+ days)", subscriber_count: 0 },
        ]);
      }
    };

    fetchDonationTiers();
    fetchSubscriberSegments();
  }, []);

  // Fetch previous posts when AI agent is enabled
  useEffect(() => {
    if (showAIAgent) {
      // In a real app, fetch from your API
      setPreviousPosts([
        // Example posts - replace with actual data
        "Your previous newsletter content 1",
        "Your previous newsletter content 2",
      ]);
    }
  }, [showAIAgent]);

  // Function to insert ad content into newsletter
  const insertAdContent = (placement = 'middle') => {
    if (!pendingAdContent) return;

    const currentContent = newsletter.content;
    let updatedContent;

    if (placement === 'top') {
      updatedContent = pendingAdContent.html + '<br><br>' + currentContent;
    } else if (placement === 'bottom') {
      updatedContent = currentContent + '<br><br>' + pendingAdContent.html;
    } else {
      // Middle placement - split content roughly in half
      const contentLength = currentContent.length;
      const middleIndex = Math.floor(contentLength / 2);
      const beforeContent = currentContent.substring(0, middleIndex);
      const afterContent = currentContent.substring(middleIndex);
      updatedContent = beforeContent + '<br><br>' + pendingAdContent.html + '<br><br>' + afterContent;
    }

    setNewsletter(prev => ({
      ...prev,
      content: updatedContent
    }));

    setShowAdPanel(false);
    toast.success('Sponsored ad content added to newsletter!');
  };

  // Generate donation tiers section HTML
  const generateDonationTiersSection = () => {
    if (!activeDonationTiers.length) return '';

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com';
    const donateUrl = `${baseUrl}/donate/${encodeURIComponent(user?.id || 'creator')}`;

    return `
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); border-radius: 12px; padding: 24px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h3 style="font-size: 1.5rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem;">💝 Support Our Newsletter</h3>
          <p style="color: #64748b; font-size: 1rem; max-width: 500px; margin: 0 auto;">Your support helps us create amazing content and keep this newsletter free for everyone!</p>
        </div>
        
        <!-- Quick Donation Buttons -->
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${donateUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 0 8px 8px 0; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.25);">
            ☕ Buy us a coffee ($5)
          </a>
          <a href="${donateUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #047857 100%); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 0 8px 8px 0; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.25);">
            🙌 Support us ($10)
          </a>
          <a href="${donateUrl}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 0 8px 8px 0; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.25);">
            ❤️ Be a patron ($25)
          </a>
        </div>

        ${activeDonationTiers.length > 0 ? `
        <!-- Detailed Tiers -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-top: 24px;">
          ${activeDonationTiers.map(tier => `
            <div style="background: white; border: 2px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center; transition: all 0.3s ease;">
              <div style="font-size: 2rem; margin-bottom: 8px;">${tier.name.includes('coffee') || tier.amount <= 5 ? '☕' : tier.amount <= 15 ? '🙌' : '❤️'}</div>
              <h4 style="font-size: 1.25rem; font-weight: 700; color: #1e293b; margin-bottom: 8px;">${tier.name}</h4>
              <p style="font-size: 2rem; font-weight: 800; color: #3b82f6; margin-bottom: 12px;">$${tier.amount}</p>
              <p style="color: #64748b; margin-bottom: 16px; font-size: 0.95rem;">${tier.description}</p>
              ${tier.perks?.length ? `
                <ul style="margin-bottom: 20px; padding-left: 0; list-style: none;">
                  ${tier.perks.map(perk => `
                    <li style="color: #475569; margin-bottom: 8px; font-size: 0.9rem;">
                      <span style="color: #10b981; margin-right: 8px; font-weight: bold;">✓</span>${perk}
                    </li>
                  `).join('')}
                </ul>
              ` : ''}
              <a href="${donateUrl}?tier=${tier.id}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.95rem; box-shadow: 0 4px 6px rgba(99, 102, 241, 0.25);">
                Choose this tier
              </a>
            </div>
          `).join('')}
        </div>
        ` : ''}

        <!-- Custom Amount -->
        <div style="text-align: center; margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; margin-bottom: 12px; font-size: 0.95rem;">Or choose your own amount:</p>
          <a href="${donateUrl}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; box-shadow: 0 4px 6px rgba(139, 92, 246, 0.25);">
            💖 Donate Custom Amount
          </a>
        </div>

        <div style="text-align: center; margin-top: 20px;">
          <p style="color: #9ca3af; font-size: 0.8rem;">
            🔒 Secure payments • You'll be redirected to our donation page
          </p>
        </div>
      </div>
    `;
  };

  // Auto-save functionality with debouncing
  const debouncedSave = useCallback(
    debounce(async (newsletterData) => {
      setIsSaving(true);
      try {
        // Simulate API call - replace with actual save logic
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSaveStatus("Saved");
        setTimeout(() => setSaveStatus(""), 3000);
      } catch (error) {
        setSaveStatus("Error saving");
        console.error('Save error:', error);
      } finally {
        setIsSaving(false);
      }
    }, 2000),
    []
  );

  // Modify handleEditorChange to append donation tiers
  const handleEditorChange = (content) => {
    const updatedNewsletter = {
      ...newsletter,
      content: content + generateDonationTiersSection()
    };
    setNewsletter(updatedNewsletter);
    debouncedSave(updatedNewsletter);
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedNewsletter = {
      ...newsletter,
      [name]: value
    };
    setNewsletter(updatedNewsletter);
    debouncedSave(updatedNewsletter);
  };

  // Send test email
  const handleSendTest = async (e) => {
    e.preventDefault();
    if (!testEmail) return;
    
    try {
      const response = await fetch('/api/newsletter', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testEmail,
          newsletter,
          user,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`✅ Test email sent! From: ${data.senderEmail} | Replies to: ${user?.email || 'your email'}`);
        setTestEmail("");
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error('Failed to send test email');
    }
  };

  // Preview newsletter
  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  // Schedule or send newsletter
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/newsletter', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newsletter,
          user,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`📧 Newsletter scheduled! From: ${data.senderEmail} | Replies to: ${user?.email || 'your email'}`);
        setShowEditor(false); // Return to list view after successful scheduling
        setNewsletter({
          name: "",
          subject: "",
          preheader: "",
          content: "",
          segment: "all",
          scheduledDate: "",
          scheduledTime: "",
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error scheduling newsletter:', error);
      toast.error('Failed to schedule newsletter');
    }
  };

  // Toggle between list and editor views
  const toggleEditor = () => {
    const newShowEditor = !showEditor;
    setShowEditor(newShowEditor);
    if (!newShowEditor && onEditorClose) {
      onEditorClose();
    }
    if (newShowEditor) {
      // Reset form when opening editor
      setNewsletter({
        name: "",
        subject: "",
        preheader: "",
        content: "",
        segment: "all",
        scheduledDate: "",
        scheduledTime: "",
      });
      setShowPreview(false);
    }
  };

  // Edit existing newsletter
  const handleEditNewsletter = (newsletter) => {
    setNewsletter({
      name: newsletter.name,
      subject: "",
      preheader: "",
      content: "",
      segment: "all",
      scheduledDate: "",
      scheduledTime: "",
    });
    setShowEditor(true);
  };

  // Update showEditor when initialShowEditor changes
  useEffect(() => {
    setShowEditor(initialShowEditor);
  }, [initialShowEditor]);

  const handleAIContentGenerated = (content) => {
    setNewsletter(prev => ({
      ...prev,
      content
    }));
  };

  // Function to handle AI content generation
  const handleGenerateContent = async () => {
    if (!aiPrompt.topic || !aiPrompt.goal) {
      toast.error('Please provide both topic and goal');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai-newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          previousPosts: [newsletter.content], // Use current content as context
          topic: aiPrompt.topic,
          goal: aiPrompt.goal,
          writingStyle: '', // Can be extended later
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate content');
      }

      setNewsletter(prev => ({
        ...prev,
        content: data.content
      }));
      setShowAIPrompt(false);
      toast.success('Content generated successfully!');
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (showEditor) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Write Newsletter</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <label htmlFor="ai-toggle" className="mr-3 text-sm font-medium text-gray-600">
                AI Assistant
              </label>
              <button
                onClick={() => {
                  setShowAIAgent(!showAIAgent);
                  if (!showAIAgent) {
                    setShowAIPrompt(true);
                  }
                }}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 ${
                  showAIAgent ? 'bg-cyan-600' : 'bg-gray-200'
                }`}
                role="switch"
                aria-checked={showAIAgent}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    showAIAgent ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <button
              onClick={toggleEditor}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to List
            </button>
            <span className="text-sm text-gray-500">
              {isSaving ? "Saving..." : saveStatus}
            </span>
            <button
              onClick={togglePreview}
              className="px-4 py-2 text-sm font-medium text-cyan-600 bg-cyan-50 rounded-md hover:bg-cyan-100"
            >
              {showPreview ? "Edit" : "Preview"}
            </button>
            <button
              type="submit"
              form="newsletter-form"
              className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700"
            >
              Schedule & Send
            </button>
          </div>
        </div>

        {showAIPrompt && showAIAgent && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">AI Newsletter Assistant</h3>
                <div>
                  <label htmlFor="topic" className="block text-sm font-medium text-gray-700">
                    What would you like to write about?
                  </label>
                  <input
                    type="text"
                    id="topic"
                    value={aiPrompt.topic}
                    onChange={(e) => setAiPrompt(prev => ({ ...prev, topic: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                    placeholder="Enter your newsletter topic"
                  />
                </div>
                <div>
                  <label htmlFor="goal" className="block text-sm font-medium text-gray-700">
                    What's the goal of this newsletter?
                  </label>
                  <input
                    type="text"
                    id="goal"
                    value={aiPrompt.goal}
                    onChange={(e) => setAiPrompt(prev => ({ ...prev, goal: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                    placeholder="e.g., Educate readers about AI trends"
                  />
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAIPrompt(false);
                      setShowAIAgent(false);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateContent}
                    disabled={isGenerating}
                    className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 ${
                      isGenerating ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </>
                    ) : (
                      'Generate Content'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ad Content Panel */}
        {showAdPanel && pendingAdContent && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <i className="fas fa-ad text-green-600 mr-2"></i>
                  Sponsored Ad Ready to Insert
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Your accepted sponsored ad content is ready to be added to this newsletter.
                </p>
              </div>
              <button
                onClick={() => setShowAdPanel(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="bg-white rounded-lg p-4 mb-4 border">
              <h4 className="font-medium text-gray-900 mb-2">Ad Preview:</h4>
              <div className="text-sm text-gray-700">
                <strong>{pendingAdContent.campaign?.title}</strong>
                <p className="mt-1">{pendingAdContent.campaign?.description}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                  By: {pendingAdContent.campaign?.brand}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => insertAdContent('top')}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
              >
                <i className="fas fa-arrow-up mr-2"></i>
                Insert at Top
              </button>
              <button
                onClick={() => insertAdContent('middle')}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
              >
                <i className="fas fa-align-center mr-2"></i>
                Insert in Middle
              </button>
              <button
                onClick={() => insertAdContent('bottom')}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
              >
                <i className="fas fa-arrow-down mr-2"></i>
                Insert at Bottom
              </button>
            </div>
          </div>
        )}

        {showPreview ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="max-w-2xl mx-auto">
              <h1 className="text-2xl font-bold mb-2">{newsletter.subject || "No subject"}</h1>
              <p className="text-gray-500 mb-4">{newsletter.preheader || "No preheader"}</p>
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: newsletter.content }} />
            </div>
          </div>
        ) : (
          <form id="newsletter-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Newsletter Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Newsletter Name
              </label>
              <input
                type="text"
                name="name"
                value={newsletter.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                placeholder="e.g., Tech Weekly, Finance Insights"
                required
              />
              <div className="mt-2 p-3 bg-blue-50 rounded-md border border-blue-200">
                <h4 className="text-sm font-medium text-blue-800 mb-2">📧 Email Configuration</h4>
                <p className="text-xs text-blue-700 mb-1">
                  <strong>Sender Email:</strong> <span className="font-mono">{newsletter.name ? newsletter.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') : 'your-newsletter'}@mail.newsletterfy.com</span>
                </p>
                <p className="text-xs text-blue-700">
                  <strong>Reply-to Email:</strong> <span className="font-mono">{user?.email || 'your-email@example.com'}</span>
                </p>
                <p className="text-xs text-blue-600 mt-1 italic">
                  ℹ️ Subscribers will see the newsletter name as sender, but replies will come to your registration email.
                </p>
              </div>
            </div>

            {/* Subject Line */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject Line
              </label>
              <input
                type="text"
                name="subject"
                value={newsletter.subject}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                placeholder="Enter email subject"
                required
              />
            </div>

            {/* Preheader */}
            <div className="floating-input-container">
              <input
                type="text"
                id="newsletter-preheader"
                name="preheader"
                value={newsletter.preheader}
                onChange={handleChange}
                className="floating-input"
                placeholder=" "
              />
              <label htmlFor="newsletter-preheader" className="floating-label">Preheader Text</label>
            </div>

            {/* Rich Text Editor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Newsletter Content
              </label>
              <Editor
                apiKey="qagffr3pkuv17a8on1afax661irst1hbr4e6tbv888sz91jc"
                init={{
                  height: 500,
                  menubar: true,
                  plugins: [
                    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                    'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount',
                    'emoticons', 'template', 'paste', 'hr', 'quickbars'
                  ],
                  toolbar: 'undo redo | formatselect | ' +
                    'bold italic backcolor forecolor | alignleft aligncenter ' +
                    'alignright alignjustify | bullist numlist outdent indent | ' +
                    'removeformat | image media template | help',
                  content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif; font-size: 14px; line-height: 1.6; }',
                  templates: [
                    { title: 'Welcome Email', description: 'A template for welcoming new subscribers', content: '<h2>Welcome to Our Newsletter!</h2><p>We\'re excited to have you join us.</p>' },
                    { title: 'Monthly Update', description: 'A template for monthly newsletters', content: '<h2>Monthly Newsletter</h2><p>Here\'s what\'s new this month:</p><ul><li>Update 1</li><li>Update 2</li></ul>' }
                  ],
                  images_upload_handler: async (blobInfo, progress) => {
                    try {
                      const formData = new FormData();
                      formData.append('file', blobInfo.blob(), blobInfo.filename());

                      const response = await fetch('/api/newsletter/upload', {
                        method: 'POST',
                        body: formData,
                      });

                      if (!response.ok) throw new Error('Upload failed');

                      const data = await response.json();
                      return data.url;
                    } catch (error) {
                      console.error('Error uploading image:', error);
                      throw error;
                    }
                  },
                  paste_data_images: true,
                  quickbars_selection_toolbar: 'bold italic | quicklink h2 h3',
                  quickbars_insert_toolbar: 'image media table',
                  contextmenu: 'link image table',
                  automatic_uploads: true,
                  file_picker_types: 'image',
                  promotion: false,
                  branding: false,
                  branding: false
                }}
                onEditorChange={handleEditorChange}
                value={newsletter.content}
              />
            </div>

            {/* Subscriber Segment Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Audience
              </label>
              <select
                name="segment"
                value={newsletter.segment}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:ring-cyan-500 focus:border-cyan-500"
              >
                {subscriberSegments.map(segment => (
                  <option key={segment.id || segment.segment_type} value={segment.id || segment.segment_type}>
                    {segment.name} ({segment.subscriber_count || segment.count || 0} subscribers)
                  </option>
                ))}
              </select>
            </div>

            {/* Schedule Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schedule Date
                </label>
                <input
                  type="date"
                  name="scheduledDate"
                  value={newsletter.scheduledDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schedule Time
                </label>
                <input
                  type="time"
                  name="scheduledTime"
                  value={newsletter.scheduledTime}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Test Email Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Send Test Email</h3>
              <div className="mb-3 text-sm text-gray-600">
                <p>📧 Test emails will be sent from: <span className="font-mono text-cyan-600">[TEST] {newsletter.name ? newsletter.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') : 'your-newsletter'}@mail.newsletterfy.com</span></p>
                <p>↩️ Replies will go to: <span className="font-mono text-cyan-600">{user?.email || 'your-email@example.com'}</span></p>
              </div>
              <div className="flex space-x-4">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Enter test email address"
                  className="flex-1 px-3 py-2 border rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={handleSendTest}
                  disabled={!testEmail}
                  className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send Test
                </button>
              </div>
            </div>

            {/* Bottom Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="submit"
                className="px-6 py-3 text-base font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
              >
                Schedule & Send
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold gradient-text">Newsletters</h2>
        <button
          onClick={toggleEditor}
          className="button-primary inline-flex items-center"
        >
          <svg
            className="-ml-1 mr-2 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Write Newsletter
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full modern-table">
          <thead>
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-lg">
                Newsletter
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subscribers
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Open Rate
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Published
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-lg">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {newsletters.map((newsletter) => (
              <tr
                key={newsletter.id}
                className="hover:bg-gray-50 transition-all duration-200"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-gradient-to-br from-cyan-100 to-cyan-50 flex items-center justify-center">
                      <i className="fas fa-newspaper text-cyan-600"></i>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-semibold text-gray-900">
                        {newsletter.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 font-medium">
                    {newsletter.subscribers.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">Total Subscribers</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-cyan-600 rounded-full h-2"
                        style={{ width: `${newsletter.openRate}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-900 font-medium">{newsletter.openRate}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{newsletter.lastPublished}</div>
                  <div className="text-xs text-gray-500">Last Update</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      newsletter.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${
                      newsletter.status === "active"
                        ? "bg-green-400"
                        : "bg-yellow-400"
                    }`}></span>
                    {newsletter.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => handleEditNewsletter(newsletter)}
                      className="glass-button p-2 rounded-lg text-cyan-600 hover:text-cyan-700"
                      title="Edit Newsletter"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button 
                      className="glass-button p-2 rounded-lg text-cyan-600 hover:text-cyan-700"
                      title="Send Newsletter"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                    <button 
                      className="glass-button p-2 rounded-lg text-red-600 hover:text-red-700"
                      title="Delete Newsletter"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 