"use client";
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { HexColorPicker } from 'react-colorful';
import { processAIPrompt } from '../services/ai';

export default function PublicationCenter({ initialData }) {
  const [activeTab, setActiveTab] = useState('general');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(initialData);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleSave = async () => {
    try {
      // Here you would typically make an API call to save the changes
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call
      toast.success('Changes saved successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to save changes');
    }
  };

  const handleAIPrompt = async (e) => {
    e.preventDefault();
    if (!aiPrompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsProcessing(true);
    try {
      const updatedData = await processAIPrompt(aiPrompt, formData);
      setFormData(updatedData);
      toast.success('Settings updated successfully');
      setAiPrompt('');
    } catch (error) {
      toast.error('Failed to process your request');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="floating-input-container">
        <input
          type="text"
          name="name"
          id="pub-newsletter-name"
          value={formData.name}
          onChange={handleInputChange}
          disabled={!isEditing}
          className="floating-input"
          placeholder=" "
        />
        <label htmlFor="pub-newsletter-name" className="floating-label">Newsletter Name</label>
      </div>
      <div className="floating-input-container">
        <input
          type="text"
          name="platformName"
          id="pub-platform-name"
          value={formData.platformName}
          onChange={handleInputChange}
          disabled={!isEditing}
          className="floating-input"
          placeholder=" "
        />
        <label htmlFor="pub-platform-name" className="floating-label">Platform Name</label>
      </div>
      <div className="floating-input-container">
        <input
          type="text"
          name="niche"
          id="pub-niche"
          value={formData.niche}
          onChange={handleInputChange}
          disabled={!isEditing}
          className="floating-input"
          placeholder=" "
        />
        <label htmlFor="pub-niche" className="floating-label">Niche</label>
      </div>
      <div className="floating-input-container">
        <textarea
          name="description"
          id="pub-description"
          value={formData.description}
          onChange={handleInputChange}
          disabled={!isEditing}
          rows={4}
          className="floating-input floating-textarea"
          placeholder=" "
        />
        <label htmlFor="pub-description" className="floating-label">Description</label>
      </div>
    </div>
  );

  const renderBrandingSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Primary Color</label>
          {isEditing ? (
            <>
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
            </>
          ) : (
            <div
              className="mt-2 w-10 h-10 rounded-full"
              style={{ backgroundColor: formData.primaryColor }}
            />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Secondary Color</label>
          {isEditing ? (
            <>
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
            </>
          ) : (
            <div
              className="mt-2 w-10 h-10 rounded-full"
              style={{ backgroundColor: formData.secondaryColor }}
            />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Accent Color</label>
          {isEditing ? (
            <>
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
            </>
          ) : (
            <div
              className="mt-2 w-10 h-10 rounded-full"
              style={{ backgroundColor: formData.accentColor }}
            />
          )}
        </div>
      </div>
    </div>
  );

  const renderAuthorSettings = () => (
    <div className="space-y-6">
      {formData.authors.map((author, index) => (
        <div key={index} className="bg-white p-6 rounded-lg shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Author {index + 1}</h3>
            {isEditing && index > 0 && (
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
              id={`pub-author-name-${index}`}
              value={author.name}
              onChange={(e) => handleAuthorChange(index, 'name', e.target.value)}
              disabled={!isEditing}
              className="floating-input"
              placeholder=" "
            />
            <label htmlFor={`pub-author-name-${index}`} className="floating-label">Name</label>
          </div>
          <div className="floating-input-container">
            <textarea
              id={`pub-author-bio-${index}`}
              value={author.bio}
              onChange={(e) => handleAuthorChange(index, 'bio', e.target.value)}
              disabled={!isEditing}
              rows={3}
              className="floating-input floating-textarea"
              placeholder=" "
            />
            <label htmlFor={`pub-author-bio-${index}`} className="floating-label">Bio</label>
          </div>
          {isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Avatar</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleAuthorChange(index, 'avatar', e.target.files[0])}
                className="modern-file-input"
              />
            </div>
          )}
        </div>
      ))}
      {isEditing && (
        <button
          type="button"
          onClick={addAuthor}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-cyan-700 bg-cyan-100 hover:bg-cyan-200"
        >
          Add Another Author
        </button>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'branding':
        return renderBrandingSettings();
      case 'authors':
        return renderAuthorSettings();
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Publication Settings</h3>
          <div className="flex space-x-3">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="button-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="button-primary"
                >
                  Save Changes
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="button-primary"
              >
                Edit Settings
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AI Prompt Input */}
      <div className="px-4 py-5 sm:px-6">
        <form onSubmit={handleAIPrompt} className="space-y-4">
          <div>
            <label htmlFor="ai-prompt" className="block text-sm font-medium text-gray-700">
              Quick Settings Update
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="text"
                name="ai-prompt"
                id="ai-prompt"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                disabled={isProcessing}
                className="modern-input flex-1"
                placeholder="e.g., Change newsletter name to Tech Weekly"
              />
              <button
                type="submit"
                disabled={isProcessing}
                className="button-primary ml-3"
              >
                {isProcessing ? 'Processing...' : 'Update'}
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Type your changes in natural language and let AI update your settings.
            </p>
          </div>
        </form>
      </div>

      <div className="border-t border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
          {['general', 'branding', 'authors'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ' + 
                (activeTab === tab
                  ? 'border-cyan-500 text-cyan-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300')
              }
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {renderContent()}
      </div>
    </div>
  );
} 