'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function NewCampaignPage() {
  const [campaignData, setCampaignData] = useState({
    name: '',
    description: '',
    templateId: '',
    headerValue: '',
    bodyParameters: [],
    scheduledDate: '',
    contactFilters: {
      tags: [],
      excludeUnsubscribed: true,
    },
  });
  const [templates, setTemplates] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadTemplates();
    loadContacts();
  }, []);

  const loadTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/templates', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const approvedTemplates = (data.templates || []).filter(t => t.status === 'APPROVED');
        setTemplates(approvedTemplates);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadContacts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/contacts?limit=1000', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const handleTemplateChange = (templateId) => {
    const template = templates.find(t => t._id === templateId);
    setSelectedTemplate(template);
    setCampaignData(prev => ({
      ...prev,
      templateId,
      headerValue: '',
      bodyParameters: template ? new Array(template.bodyParameters?.length || 0).fill('') : [],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: campaignData.name,
          description: campaignData.description,
          templateId: campaignData.templateId,
          headerValue: campaignData.headerValue,
          bodyParameters: campaignData.bodyParameters,
          scheduledDate: campaignData.scheduledDate || null,
          contactFilters: campaignData.contactFilters,
        }),
      });

      if (response.ok) {
        router.push('/dashboard/campaigns');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create campaign');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard/campaigns"
          className="flex items-center text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Campaigns
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Campaign</h1>
        <p className="mt-1 text-gray-600">
          Set up a bulk messaging campaign to send to multiple contacts.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Campaign Form */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Campaign Details</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Campaign Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={campaignData.name}
                onChange={(e) => setCampaignData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="Enter campaign name"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={campaignData.description}
                onChange={(e) => setCampaignData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="Describe your campaign"
              />
            </div>
          </div>

          {/* Template Selection */}
          <div>
            <label htmlFor="template" className="block text-sm font-medium text-gray-700">
              Select Template *
            </label>
            <select
              id="template"
              required
              value={campaignData.templateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Choose a template...</option>
              {templates.map((template) => (
                <option key={template._id} value={template._id}>
                  {template.name} ({template.language})
                </option>
              ))}
            </select>
            {templates.length === 0 && (
              <p className="mt-1 text-sm text-red-600">
                No approved templates found. Please create and approve templates first.
              </p>
            )}
          </div>

          {/* Template Parameters */}
          {selectedTemplate && (
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">Template Parameters</h4>
              
              {/* Header Parameter */}
              {selectedTemplate.headerRequiresParam && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Header Value ({selectedTemplate.headerType})
                  </label>
                  <input
                    type="text"
                    value={campaignData.headerValue}
                    onChange={(e) => setCampaignData(prev => ({ ...prev, headerValue: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder={selectedTemplate.headerType === 'TEXT' ? 'Enter header text' : 'Enter media URL'}
                  />
                </div>
              )}

              {/* Body Parameters */}
              {selectedTemplate.bodyParameters && selectedTemplate.bodyParameters.map((param, index) => (
                <div key={param.key}>
                  <label className="block text-sm font-medium text-gray-700">
                    {param.name}
                  </label>
                  <input
                    type="text"
                    value={campaignData.bodyParameters[index] || ''}
                    onChange={(e) => {
                      const newParams = [...campaignData.bodyParameters];
                      newParams[index] = e.target.value;
                      setCampaignData(prev => ({ ...prev, bodyParameters: newParams }));
                    }}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder={param.description}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Scheduling */}
          <div>
            <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700">
              Schedule Date (Optional)
            </label>
            <input
              type="datetime-local"
              id="scheduledDate"
              value={campaignData.scheduledDate}
              onChange={(e) => setCampaignData(prev => ({ ...prev, scheduledDate: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Leave blank to send immediately after creation
            </p>
          </div>

          {/* Contact Filters */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Target Audience</h4>
            
            <div className="flex items-center">
              <input
                id="excludeUnsubscribed"
                type="checkbox"
                checked={campaignData.contactFilters.excludeUnsubscribed}
                onChange={(e) => setCampaignData(prev => ({
                  ...prev,
                  contactFilters: {
                    ...prev.contactFilters,
                    excludeUnsubscribed: e.target.checked
                  }
                }))}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="excludeUnsubscribed" className="ml-2 block text-sm text-gray-900">
                Exclude unsubscribed contacts
              </label>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-800">
                <strong>Contacts:</strong> {contacts.length} total contacts found.
                {campaignData.contactFilters.excludeUnsubscribed && (
                  <span className="block mt-1">
                    Unsubscribed contacts will be automatically excluded from this campaign.
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3">
            <Link
              href="/dashboard/campaigns"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || templates.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
