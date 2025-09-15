'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function NewTemplatePage() {
  const [templateData, setTemplateData] = useState({
    name: '',
    category: 'MARKETING',
    language: 'en_US',
    headerType: 'TEXT',
    headerText: '',
    bodyText: '',
    footerText: '',
    buttons: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      // Build components array based on form data
      const components = [];
      
      // Add header component
      if (templateData.headerType !== 'NONE' && templateData.headerText) {
        components.push({
          type: 'HEADER',
          format: templateData.headerType,
          text: templateData.headerText,
        });
      }
      
      // Add body component
      if (templateData.bodyText) {
        components.push({
          type: 'BODY',
          text: templateData.bodyText,
        });
      }
      
      // Add footer component
      if (templateData.footerText) {
        components.push({
          type: 'FOOTER',
          text: templateData.footerText,
        });
      }

      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: templateData.name,
          category: templateData.category,
          language: templateData.language,
          components: components,
        }),
      });

      if (response.ok) {
        router.push('/dashboard/templates');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create template');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setTemplateData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard/templates"
          className="flex items-center text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Templates
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Template</h1>
        <p className="mt-1 text-gray-600">
          Create a new WhatsApp message template for approval.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Template Form */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Template Details</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Template Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={templateData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., welcome_message"
              />
              <p className="mt-1 text-sm text-gray-500">
                Use lowercase letters, numbers, and underscores only
              </p>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category *
              </label>
              <select
                id="category"
                required
                value={templateData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              >
                <option value="MARKETING">Marketing</option>
                <option value="UTILITY">Utility</option>
                <option value="AUTHENTICATION">Authentication</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                Language *
              </label>
              <select
                id="language"
                required
                value={templateData.language}
                onChange={(e) => handleInputChange('language', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              >
                <option value="en_US">English (US)</option>
                <option value="en_GB">English (UK)</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="pt_BR">Portuguese (Brazil)</option>
                <option value="hi">Hindi</option>
              </select>
            </div>

            <div>
              <label htmlFor="headerType" className="block text-sm font-medium text-gray-700">
                Header Type
              </label>
              <select
                id="headerType"
                value={templateData.headerType}
                onChange={(e) => handleInputChange('headerType', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              >
                <option value="NONE">None</option>
                <option value="TEXT">Text</option>
                <option value="IMAGE">Image</option>
                <option value="VIDEO">Video</option>
                <option value="DOCUMENT">Document</option>
              </select>
            </div>
          </div>

          {/* Header Text */}
          {templateData.headerType === 'TEXT' && (
            <div>
              <label htmlFor="headerText" className="block text-sm font-medium text-gray-700">
                Header Text
              </label>
              <input
                type="text"
                id="headerText"
                value={templateData.headerText}
                onChange={(e) => handleInputChange('headerText', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="Enter header text"
              />
              <p className="mt-1 text-sm text-gray-500">
                Use {`{{1}}`} for variables
              </p>
            </div>
          )}

          {/* Body Text */}
          <div>
            <label htmlFor="bodyText" className="block text-sm font-medium text-gray-700">
              Body Text *
            </label>
            <textarea
              id="bodyText"
              required
              rows={4}
              value={templateData.bodyText}
              onChange={(e) => handleInputChange('bodyText', e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="Enter the main message content..."
            />
            <p className="mt-1 text-sm text-gray-500">
              Use {`{{1}}`}, {`{{2}}`}, etc. for variables
            </p>
          </div>

          {/* Footer Text */}
          <div>
            <label htmlFor="footerText" className="block text-sm font-medium text-gray-700">
              Footer Text (Optional)
            </label>
            <input
              type="text"
              id="footerText"
              value={templateData.footerText}
              onChange={(e) => handleInputChange('footerText', e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="Enter footer text (optional)"
              maxLength={60}
            />
            <p className="mt-1 text-sm text-gray-500">
              Maximum 60 characters
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-medium">Template Review Process</p>
                <p className="mt-1">
                  After submission, your template will be reviewed by WhatsApp and may take 24-48 hours for approval.
                  Make sure to follow WhatsApp&apos;s template guidelines for faster approval.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <Link
              href="/dashboard/templates"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
