'use client';

import { useState, useEffect } from 'react';
import { 
  CogIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

export default function SettingsPage() {
  const [config, setConfig] = useState({
    businessAccountId: '',
    accessToken: '',
    phoneNumberId: '',
    webhookVerifyToken: '',
    isConfigured: false,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/config/whatsapp', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(prev => ({ ...prev, ...data.config }));
      }
    } catch (err) {
      console.error('Error loading config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/config/whatsapp', {
        method: config.isConfigured ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('WhatsApp configuration saved successfully!');
        setConfig(prev => ({ ...prev, isConfigured: true, ...data.config }));
        
        // Update user data in localStorage
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        userData.whatsappConfigured = true;
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        setError(data.error || 'Failed to save configuration');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTestingConnection(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/templates', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`Connection successful! Found ${data.templates?.length || 0} templates.`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Connection test failed');
      }
    } catch (err) {
      setError('Network error during connection test.');
    } finally {
      setTestingConnection(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-gray-600">
          Configure your WhatsApp Business API connection and other preferences.
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
            <p className="text-green-800">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* WhatsApp Configuration */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CogIcon className="h-6 w-6 text-gray-400 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">WhatsApp Business API Configuration</h3>
            </div>
            {config.isConfigured && (
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-sm text-green-700">Configured</span>
              </div>
            )}
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="businessAccountId" className="block text-sm font-medium text-gray-700">
                Business Account ID *
              </label>
              <input
                type="text"
                id="businessAccountId"
                required
                value={config.businessAccountId}
                onChange={(e) => setConfig(prev => ({ ...prev, businessAccountId: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="Enter your Business Account ID"
              />
              <p className="mt-1 text-sm text-gray-500">
                Find this in your Facebook Business Manager
              </p>
            </div>

            <div>
              <label htmlFor="phoneNumberId" className="block text-sm font-medium text-gray-700">
                Phone Number ID *
              </label>
              <input
                type="text"
                id="phoneNumberId"
                required
                value={config.phoneNumberId}
                onChange={(e) => setConfig(prev => ({ ...prev, phoneNumberId: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="Enter your Phone Number ID"
              />
              <p className="mt-1 text-sm text-gray-500">
                Find this in your WhatsApp Business Account
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="accessToken" className="block text-sm font-medium text-gray-700">
              Access Token *
            </label>
            <textarea
              id="accessToken"
              required
              rows={3}
              value={config.accessToken}
              onChange={(e) => setConfig(prev => ({ ...prev, accessToken: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="Enter your WhatsApp Access Token"
            />
            <p className="mt-1 text-sm text-gray-500">
              Generate this token from your Facebook Developer Console
            </p>
          </div>

          <div>
            <label htmlFor="webhookVerifyToken" className="block text-sm font-medium text-gray-700">
              Webhook Verify Token
            </label>
            <input
              type="text"
              id="webhookVerifyToken"
              value={config.webhookVerifyToken}
              onChange={(e) => setConfig(prev => ({ ...prev, webhookVerifyToken: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="Enter your webhook verify token (optional)"
            />
            <p className="mt-1 text-sm text-gray-500">
              Used to verify webhook requests from WhatsApp
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <InformationCircleIcon className="h-5 w-5 text-blue-400 mr-2" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">How to get your WhatsApp API credentials:</p>
                <ol className="mt-2 list-decimal list-inside space-y-1">
                  <li>Go to Facebook Developer Console</li>
                  <li>Create or select your WhatsApp Business API app</li>
                  <li>Copy the Business Account ID from the app dashboard</li>
                  <li>Generate a permanent access token</li>
                  <li>Get the Phone Number ID from WhatsApp Business Account</li>
                </ol>
                <p className="mt-2">
                  Your webhook URL should be: <code className="bg-white px-1 rounded">{typeof window !== 'undefined' ? window.location.origin : ''}/api/webhook</code>
                </p>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={testConnection}
              disabled={testingConnection || !config.businessAccountId || !config.accessToken || !config.phoneNumberId}
              className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testingConnection ? 'Testing...' : 'Test Connection'}
            </button>
            
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>

      {/* Additional Settings (placeholder for future features) */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">General Settings</h3>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-gray-500">Additional settings will be available here in future updates.</p>
        </div>
      </div>
    </div>
  );
}
