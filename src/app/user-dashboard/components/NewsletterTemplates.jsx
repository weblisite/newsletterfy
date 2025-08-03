"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Editor } from '@tinymce/tinymce-react';
import { FaPlus, FaEdit, FaTrash, FaCopy } from 'react-icons/fa';

export default function NewsletterTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState({
    id: '',
    name: '',
    description: '',
    content: '',
    category: 'general',
    isDefault: false,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/newsletter/templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const method = currentTemplate.id ? 'PUT' : 'POST';
      const response = await fetch('/api/newsletter/templates', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentTemplate),
      });

      if (!response.ok) throw new Error('Failed to save template');
      toast.success('Template saved successfully');
      setShowEditor(false);
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`/api/newsletter/templates/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete template');
      toast.success('Template deleted successfully');
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleDuplicate = async (template) => {
    setCurrentTemplate({
      ...template,
      id: '',
      name: `${template.name} (Copy)`,
      isDefault: false,
    });
    setShowEditor(true);
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
        <h1 className="text-2xl font-bold">Newsletter Templates</h1>
        <button
          onClick={() => {
            setCurrentTemplate({
              id: '',
              name: '',
              description: '',
              content: '',
              category: 'general',
              isDefault: false,
            });
            setShowEditor(true);
          }}
          className="flex items-center px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
        >
          <FaPlus className="mr-2" />
          New Template
        </button>
      </div>

      {showEditor ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            <div>
              <label className="block font-medium mb-2">Template Name</label>
              <input
                type="text"
                value={currentTemplate.name}
                onChange={(e) =>
                  setCurrentTemplate((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full p-2 border rounded-lg"
                placeholder="Enter template name"
              />
            </div>

            <div>
              <label className="block font-medium mb-2">Description</label>
              <textarea
                value={currentTemplate.description}
                onChange={(e) =>
                  setCurrentTemplate((prev) => ({ ...prev, description: e.target.value }))
                }
                className="w-full p-2 border rounded-lg"
                rows="3"
                placeholder="Enter template description"
              />
            </div>

            <div>
              <label className="block font-medium mb-2">Category</label>
              <select
                value={currentTemplate.category}
                onChange={(e) =>
                  setCurrentTemplate((prev) => ({ ...prev, category: e.target.value }))
                }
                className="w-full p-2 border rounded-lg"
              >
                <option value="general">General</option>
                <option value="promotional">Promotional</option>
                <option value="announcement">Announcement</option>
                <option value="digest">Digest</option>
                <option value="welcome">Welcome</option>
              </select>
            </div>

            <div>
              <label className="block font-medium mb-2">Content</label>
              <Editor
                apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY || 'no-api-key'}
                value={currentTemplate.content}
                onEditorChange={(content) =>
                  setCurrentTemplate((prev) => ({ ...prev, content }))
                }
                init={{
                  height: 500,
                  menubar: true,
                  plugins: [
                    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                    'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                  ],
                  toolbar:
                    'undo redo | blocks | ' +
                    'bold italic forecolor | alignleft aligncenter ' +
                    'alignright alignjustify | bullist numlist outdent indent | ' +
                    'removeformat | help',
                }}
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isDefault"
                checked={currentTemplate.isDefault}
                onChange={(e) =>
                  setCurrentTemplate((prev) => ({ ...prev, isDefault: e.target.checked }))
                }
                className="mr-2"
              />
              <label htmlFor="isDefault" className="font-medium">
                Set as default template
              </label>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowEditor(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{template.name}</h3>
                  <p className="text-sm text-gray-500">{template.category}</p>
                </div>
                {template.isDefault && (
                  <span className="px-2 py-1 bg-cyan-100 text-cyan-800 text-xs rounded-full">
                    Default
                  </span>
                )}
              </div>
              <p className="text-gray-600 mb-4 line-clamp-2">{template.description}</p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => handleDuplicate(template)}
                  className="p-2 text-gray-600 hover:text-cyan-600 transition-colors"
                  title="Duplicate"
                >
                  <FaCopy />
                </button>
                <button
                  onClick={() => {
                    setCurrentTemplate(template);
                    setShowEditor(true);
                  }}
                  className="p-2 text-gray-600 hover:text-cyan-600 transition-colors"
                  title="Edit"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                  title="Delete"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 