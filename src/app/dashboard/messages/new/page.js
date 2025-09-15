'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function NewMessagePage() {
  const [messageData, setMessageData] = useState({
    phoneNumber: '',
    messageType: 'text',
    text: '',
    templateId: '',
    headerValue: '',
    bodyParameters: [],
  });
  const [templates, setTemplates] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
    setMessageData(prev => ({
      ...prev,
      templateId,
      headerValue: '',
      bodyParameters: template ? new Array(template.bodyParameters?.length || 0).fill('') : [],
    }));
  };

  const handleContactSelect = (contactId) => {
    const contact = contacts.find(c => c._id === contactId);
    if (contact) {
      setMessageData(prev => ({ ...prev, phoneNumber: contact.phoneNumber }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      
      const payload = {
        phoneNumber: messageData.phoneNumber,
      };

      if (messageData.messageType === 'text') {
        payload.text = messageData.text;
      } else if (messageData.messageType === 'template') {
        payload.templateName = selectedTemplate?.name;
        payload.templateLanguage = selectedTemplate?.language || 'en_US';
        if (messageData.headerValue) {
          payload.headerValue = messageData.headerValue;
        }
        if (messageData.bodyParameters.length > 0) {
          payload.bodyParameters = messageData.bodyParameters;
        }
      }

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Message sent successfully!');
        setTimeout(() => {
          router.push('/dashboard/messages');
        }, 2000);
      } else {
        setError(data.error || 'Failed to send message');
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
          href="/dashboard/messages"
          className="flex items-center text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Messages
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Send New Message</h1>
        <p className="mt-1 text-gray-600">
          Send a WhatsApp message to a single contact.
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Message Form */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Message Details</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
          {/* Recipient */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                Phone Number *
              </label>
              <input
                type="tel"
                id="phoneNumber"
                required
                value={messageData.phoneNumber}
                onChange={(e) => setMessageData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="+1234567890"
              />
              <p className="mt-1 text-sm text-gray-500">
                Include country code (e.g., +1 for US)
              </p>
            </div>

            <div>
              <label htmlFor="contact" className="block text-sm font-medium text-gray-700">
                Or Select from Contacts
              </label>
              <select
                id="contact"
                value=""
                onChange={(e) => handleContactSelect(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Choose a contact...</option>
                {contacts.map((contact) => (
                  <option key={contact._id} value={contact._id}>
                    {contact.fullName || contact.phoneNumber} ({contact.phoneNumber})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Message Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message Type *
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="messageType"
                  value="text"
                  checked={messageData.messageType === 'text'}
                  onChange={(e) => setMessageData(prev => ({ ...prev, messageType: e.target.value }))}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Text Message</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="messageType"
                  value="template"
                  checked={messageData.messageType === 'template'}
                  onChange={(e) => setMessageData(prev => ({ ...prev, messageType: e.target.value }))}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Template Message</span>
              </label>
            </div>
          </div>

          {/* Text Message */}
          {messageData.messageType === 'text' && (
            <div>
              <label htmlFor="text" className="block text-sm font-medium text-gray-700">
                Message Text *
              </label>
              <textarea
                id="text"
                required
                rows={4}
                value={messageData.text}
                onChange={(e) => setMessageData(prev => ({ ...prev, text: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="Enter your message here..."
              />
              <p className="mt-1 text-sm text-gray-500">
                Maximum 4096 characters
              </p>
            </div>
          )}

          {/* Template Message */}
          {messageData.messageType === 'template' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="template" className="block text-sm font-medium text-gray-700">
                  Select Template *
                </label>
                <select
                  id="template"
                  required
                  value={messageData.templateId}
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
                  
                  {/* Template Preview */}
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Template Preview:</h5>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {selectedTemplate.description || 'No preview available'}
                    </p>
                  </div>

                  {/* Header Parameter */}
                  {selectedTemplate.headerRequiresParam && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Header Value ({selectedTemplate.headerType}) *
                      </label>
                      <input
                        type="text"
                        required
                        value={messageData.headerValue}
                        onChange={(e) => setMessageData(prev => ({ ...prev, headerValue: e.target.value }))}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder={selectedTemplate.headerType === 'TEXT' ? 'Enter header text' : 'Enter media URL'}
                      />
                    </div>
                  )}

                  {/* Body Parameters */}
                  {selectedTemplate.bodyParameters && selectedTemplate.bodyParameters.map((param, index) => (
                    <div key={param.key}>
                      <label className="block text-sm font-medium text-gray-700">
                        {param.name} *
                      </label>
                      <input
                        type="text"
                        required
                        value={messageData.bodyParameters[index] || ''}
                        onChange={(e) => {
                          const newParams = [...messageData.bodyParameters];
                          newParams[index] = e.target.value;
                          setMessageData(prev => ({ ...prev, bodyParameters: newParams }));
                        }}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder={param.description}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-medium">Message Delivery</p>
                <p className="mt-1">
                  Messages will be sent immediately. Make sure the recipient has opted in to receive messages.
                  Template messages can be sent to any valid WhatsApp number, while text messages require an existing conversation.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3">
            <Link
              href="/dashboard/messages"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
