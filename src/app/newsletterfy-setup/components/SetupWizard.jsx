"use client";
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { HexColorPicker } from 'react-colorful';
import { generateLandingPage, generateNewsletterDesign } from '../services/ai';

const steps = [
  'newsletter-info',
  'branding',
  'authors',
  'landing-page',
  'review',
];

const landingPageTemplates = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean and simple design focusing on content',
    preview: '/templates/minimal.png',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Contemporary design with bold typography',
    preview: '/templates/modern.png',
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional newsletter style with serif fonts',
    preview: '/templates/classic.png',
  },
];

export default function SetupWizard({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    platformName: '',
    niche: '',
    description: '',
    primaryColor: '#06B6D4',
    secondaryColor: '#10B981',
    accentColor: '#22D3EE',
    authors: [{ name: '', bio: '', avatar: null }],
    landingPageTemplate: 'minimal',
    customizations: {},
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleColorChange = (color, type) => {
    setFormData(prev => ({
      ...prev,
      [type]: color,
    }));
  };

  const handleAuthorChange = (index, field, value) => {
    setFormData(prev => {
      const newAuthors = [...prev.authors];
      newAuthors[index] = {
        ...newAuthors[index],
        [field]: value,
      };
      return {
        ...prev,
        authors: newAuthors,
      };
    });
  };

  const addAuthor = () => {
    setFormData(prev => ({
      ...prev,
      authors: [...prev.authors, { name: '', bio: '', avatar: null }],
    }));
  };

  const removeAuthor = (index) => {
    setFormData(prev => ({
      ...prev,
      authors: prev.authors.filter((_, i) => i !== index),
    }));
  };

  const handleTemplateSelect = (templateId) => {
    setFormData(prev => ({
      ...prev,
      landingPageTemplate: templateId,
    }));
  };

  const validateStep = () => {
    switch (steps[currentStep]) {
      case 'newsletter-info':
        if (!formData.name || !formData.platformName || !formData.niche || !formData.description) {
          toast.error('Please fill in all fields');
          return false;
        }
        break;
      case 'authors':
        if (!formData.authors.length || !formData.authors[0].name) {
          toast.error('Please add at least one author');
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = async () => {
    if (!validateStep()) return;
    
    if (currentStep === steps.length - 1) {
      setIsGenerating(true);
      try {
        // Generate newsletter URL
        const url = generateNewsletterUrl(formData.platformName);

        // Generate landing page and newsletter design using AI
        const [landingPage, design] = await Promise.all([
          generateLandingPage(formData),
          generateNewsletterDesign(formData),
        ]);

        const finalData = {
          ...formData,
          url,
          createdAt: new Date().toISOString(),
          landingPage,
          design,
        };

        toast.success('Newsletter setup completed successfully!');
        onComplete(finalData);
      } catch (error) {
        console.error('Setup error:', error);
        toast.error('Failed to complete setup. Please try again.');
      } finally {
        setIsGenerating(false);
      }
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const generateNewsletterUrl = (name) => {
    return `https://newsletterfy.com/${name.toLowerCase().replace(/\s+/g, '-')}`;
  };

  const renderStep = () => {
    switch (steps[currentStep]) {
      case 'newsletter-info':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Newsletter Information</h2>
            <div className="floating-input-container">
              <input
                type="text"
                name="name"
                id="newsletter-name"
                value={formData.name}
                onChange={handleInputChange}
                className="floating-input"
                placeholder=" "
              />
              <label htmlFor="newsletter-name" className="floating-label">Newsletter Name</label>
            </div>
            <div className="floating-input-container">
              <input
                type="text"
                name="platformName"
                id="platform-name"
                value={formData.platformName}
                onChange={handleInputChange}
                className="floating-input"
                placeholder=" "
              />
              <label htmlFor="platform-name" className="floating-label">Platform Name</label>
            </div>
            <div className="floating-input-container">
              <input
                type="text"
                name="niche"
                id="newsletter-niche"
                value={formData.niche}
                onChange={handleInputChange}
                className="floating-input"
                placeholder=" "
              />
              <label htmlFor="newsletter-niche" className="floating-label">Newsletter Niche</label>
            </div>
            <div className="floating-input-container">
              <textarea
                name="description"
                id="newsletter-description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="floating-input floating-textarea"
                placeholder=" "
              />
              <label htmlFor="newsletter-description" className="floating-label">Description</label>
            </div>
          </div>
        );

      case 'branding':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Brand Colors</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Primary Color</label>
                <div className="mt-2">
                  <HexColorPicker
                    color={formData.primaryColor}
                    onChange={(color) => handleColorChange(color, 'primaryColor')}
                  />
                </div>
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => handleColorChange(e.target.value, 'primaryColor')}
                  className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Secondary Color</label>
                <div className="mt-2">
                  <HexColorPicker
                    color={formData.secondaryColor}
                    onChange={(color) => handleColorChange(color, 'secondaryColor')}
                  />
                </div>
                <input
                  type="text"
                  value={formData.secondaryColor}
                  onChange={(e) => handleColorChange(e.target.value, 'secondaryColor')}
                  className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Accent Color</label>
                <div className="mt-2">
                  <HexColorPicker
                    color={formData.accentColor}
                    onChange={(color) => handleColorChange(color, 'accentColor')}
                  />
                </div>
                <input
                  type="text"
                  value={formData.accentColor}
                  onChange={(e) => handleColorChange(e.target.value, 'accentColor')}
                  className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                />
              </div>
            </div>
          </div>
        );

      case 'authors':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Authors</h2>
            {formData.authors.map((author, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Author {index + 1}</h3>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeAuthor(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="floating-input-container">
                  <input
                    type="text"
                    id={`author-name-${index}`}
                    value={author.name}
                    onChange={(e) => handleAuthorChange(index, 'name', e.target.value)}
                    className="floating-input"
                    placeholder=" "
                  />
                  <label htmlFor={`author-name-${index}`} className="floating-label">Name</label>
                </div>
                <div className="floating-input-container">
                  <textarea
                    id={`author-bio-${index}`}
                    value={author.bio}
                    onChange={(e) => handleAuthorChange(index, 'bio', e.target.value)}
                    rows={3}
                    className="floating-input floating-textarea"
                    placeholder=" "
                  />
                  <label htmlFor={`author-bio-${index}`} className="floating-label">Bio</label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Avatar</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleAuthorChange(index, 'avatar', e.target.files[0])}
                    className="modern-file-input"
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addAuthor}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-cyan-700 bg-cyan-100 hover:bg-cyan-200"
            >
              Add Another Author
            </button>
          </div>
        );

      case 'landing-page':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Landing Page Template</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {landingPageTemplates.map((template) => (
                <div
                  key={template.id}
                  className={'border rounded-lg p-4 cursor-pointer transition-all ' + 
                    (formData.landingPageTemplate === template.id
                      ? 'border-cyan-500 ring-2 ring-cyan-500'
                      : 'border-gray-200 hover:border-cyan-300')
                  }
                  onClick={() => handleTemplateSelect(template.id)}
                >
                  <div className="aspect-w-16 aspect-h-9 mb-4">
                    <img
                      src={template.preview}
                      alt={template.name}
                      className="rounded-md object-cover"
                    />
                  </div>
                  <h3 className="font-medium text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-500">{template.description}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Review Your Newsletter</h2>
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Newsletter Information</h3>
                <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formData.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Platform Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formData.platformName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Niche</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formData.niche}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">URL</dt>
                    <dd className="mt-1 text-sm text-cyan-600">
                      {generateNewsletterUrl(formData.platformName)}
                    </dd>
                  </div>
                </dl>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Description</h3>
                <p className="mt-2 text-sm text-gray-600">{formData.description}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Brand Colors</h3>
                <div className="mt-2 flex space-x-4">
                  <div>
                    <div
                      className="w-10 h-10 rounded-full"
                      style={{ backgroundColor: formData.primaryColor }}
                    />
                    <p className="mt-1 text-xs text-gray-500">Primary</p>
                  </div>
                  <div>
                    <div
                      className="w-10 h-10 rounded-full"
                      style={{ backgroundColor: formData.secondaryColor }}
                    />
                    <p className="mt-1 text-xs text-gray-500">Secondary</p>
                  </div>
                  <div>
                    <div
                      className="w-10 h-10 rounded-full"
                      style={{ backgroundColor: formData.accentColor }}
                    />
                    <p className="mt-1 text-xs text-gray-500">Accent</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Authors</h3>
                <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {formData.authors.map((author, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900">{author.name}</h4>
                      <p className="mt-1 text-sm text-gray-600">{author.bio}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Landing Page Template</h3>
                <p className="mt-2 text-sm text-gray-600">
                  {landingPageTemplates.find(t => t.id === formData.landingPageTemplate)?.name}
                </p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm">
      {/* Progress bar */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          {steps.map((step, index) => (
            <React.Fragment key={step}>
              {index > 0 && <div className="h-0.5 flex-1 bg-gray-200" />}
              <div
                className={'w-8 h-8 rounded-full flex items-center justify-center ' + 
                  (index <= currentStep
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-200 text-gray-400')
                }
              >
                {index + 1}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 0}
          className={'px-4 py-2 text-sm font-medium rounded-md ' + 
            (currentStep === 0
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:text-gray-900')
          }
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={isGenerating}
          className="button-primary"
        >
          {isGenerating ? (
            <span className="flex items-center space-x-2">
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Generating...</span>
            </span>
          ) : (
            currentStep === steps.length - 1 ? 'Complete Setup' : 'Next'
          )}
        </button>
      </div>
    </div>
  );
} 