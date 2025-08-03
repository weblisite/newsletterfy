"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import SetupWizard from './components/SetupWizard';
import PublicationCenter from './components/PublicationCenter';

export default function NewsletterSetup() {
  const router = useRouter();
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [publicationData, setPublicationData] = useState(null);

  const handleSetupComplete = async (data) => {
    try {
      // Here you would typically make an API call to save the initial setup
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call
      setPublicationData(data);
      setIsSetupComplete(true);
    } catch (error) {
      console.error('Failed to complete setup:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-cyan-50">
      <Toaster position="top-right" />
      
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {!isSetupComplete ? (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-4xl font-bold gradient-text mb-2">Setup Your Newsletter</h1>
                  <p className="text-gray-600">
                    Let's get your newsletter up and running. We'll guide you through the process step by step.
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={() => router.push('/help')}
                    className="button-secondary inline-flex items-center"
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
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Need Help?
                  </button>
                </div>
              </div>

              {/* Quick Guide */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="glass-panel p-6 hover-scale">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Newsletter Info</h3>
                      <p className="text-sm text-gray-600">Basic details about your newsletter</p>
                    </div>
                    <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-6 hover-scale">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Branding</h3>
                      <p className="text-sm text-gray-600">Customize your newsletter's look</p>
                    </div>
                    <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-6 hover-scale">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Landing Page</h3>
                      <p className="text-sm text-gray-600">Design your subscription page</p>
                    </div>
                    <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-panel">
                <SetupWizard onComplete={handleSetupComplete} />
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-4xl font-bold gradient-text mb-2">
                    Welcome to {publicationData.name}
                  </h1>
                  <p className="text-gray-600">
                    Your newsletter is now set up and ready to go. You can manage your publication settings below.
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <a
                    href={publicationData.url}
                    target="_blank"
                    rel="noopener noreferrer"
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
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    View Landing Page
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="glass-panel p-6 hover-scale">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Newsletter URL</h3>
                      <p className="text-sm text-cyan-600">{publicationData.url}</p>
                    </div>
                    <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-6 hover-scale">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Created On</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(publicationData.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-6 hover-scale">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Authors</h3>
                      <p className="text-sm text-gray-600">
                        {publicationData.authors.length} contributor{publicationData.authors.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-panel">
                <PublicationCenter initialData={publicationData} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 