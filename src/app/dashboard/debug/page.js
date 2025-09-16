'use client';

import { useState, useEffect } from 'react';
import { 
  BugAntIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testForm, setTestForm] = useState({
    phoneNumber: '',
    testMessage: 'Hello! This is a test message from your WhatsApp SaaS platform.'
  });

  useEffect(() => {
    loadDebugInfo();
  }, []);

  const loadDebugInfo = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/debug/whatsapp', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setDebugInfo(data);
      }
    } catch (error) {
      console.error('Error loading debug info:', error);
    } finally {
      setLoading(false);
    }
  };

  const testSendMessage = async (e) => {
    e.preventDefault();
    setTestLoading(true);
    setTestResult(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/debug/whatsapp', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testForm),
      });

      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({
        success: false,
        debug: { error: error.message, step: 'network_error' }
      });
    } finally {
      setTestLoading(false);
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
      <div className="flex items-center space-x-3">
        <BugAntIcon className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp Debug Center</h1>
          <p className="mt-1 text-gray-600">
            Diagnose WhatsApp messaging issues and test your configuration.
          </p>
        </div>
      </div>

      {/* Configuration Status */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Configuration Status</h3>
        </div>
        <div className="px-6 py-4">
          {debugInfo ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">WhatsApp Config</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      {debugInfo.whatsappConfig.hasBusinessAccountId ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                      ) : (
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                      )}
                      <span className="text-sm">Business Account ID</span>
                      {debugInfo.whatsappConfig.businessAccountId && (
                        <code className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                          {debugInfo.whatsappConfig.businessAccountId}
                        </code>
                      )}
                    </div>
                    <div className="flex items-center">
                      {debugInfo.whatsappConfig.hasAccessToken ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                      ) : (
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                      )}
                      <span className="text-sm">Access Token</span>
                    </div>
                    <div className="flex items-center">
                      {debugInfo.whatsappConfig.hasPhoneNumberId ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                      ) : (
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                      )}
                      <span className="text-sm">Phone Number ID</span>
                      {debugInfo.whatsappConfig.phoneNumberId && (
                        <code className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                          {debugInfo.whatsappConfig.phoneNumberId}
                        </code>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">API Connection Test</h4>
                  {debugInfo.apiTest ? (
                    <div>
                      {debugInfo.apiTest.status === 'success' ? (
                        <div className="flex items-center text-green-700">
                          <CheckCircleIcon className="h-5 w-5 mr-2" />
                          <span className="text-sm">API Connection: Working</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center text-red-700">
                            <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                            <span className="text-sm">API Connection: Failed</span>
                          </div>
                          <div className="bg-red-50 border border-red-200 rounded p-3">
                            <p className="text-sm text-red-800">
                              <strong>Error:</strong> {debugInfo.apiTest.error}
                            </p>
                            {debugInfo.apiTest.response && (
                              <details className="mt-2">
                                <summary className="cursor-pointer text-xs text-red-600">
                                  View API Response
                                </summary>
                                <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">
                                  {JSON.stringify(debugInfo.apiTest.response, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No API test performed</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Loading configuration status...</p>
          )}
        </div>
      </div>

      {/* Recent Messages */}
      {debugInfo?.recentMessages && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Messages</h3>
          </div>
          <div className="px-6 py-4">
            {debugInfo.recentMessages.length > 0 ? (
              <div className="space-y-3">
                {debugInfo.recentMessages.map((message) => (
                  <div key={message._id} className="border rounded-md p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">To: {message.phoneNumber}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        message.status === 'SENT' || message.status === 'DELIVERED' || message.status === 'READ'
                          ? 'bg-green-100 text-green-800'
                          : message.status === 'FAILED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {message.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p><strong>Type:</strong> {message.type}</p>
                      <p><strong>Content:</strong> {message.content?.text || 'Template message'}</p>
                      {message.whatsappMessageId && (
                        <p><strong>WhatsApp ID:</strong> {message.whatsappMessageId}</p>
                      )}
                      <p><strong>Created:</strong> {new Date(message.createdAt).toLocaleString()}</p>
                      {message.sentDate && (
                        <p><strong>Sent:</strong> {new Date(message.sentDate).toLocaleString()}</p>
                      )}
                      {message.errorMessage && (
                        <p className="text-red-600"><strong>Error:</strong> {message.errorMessage}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No recent messages found</p>
            )}
          </div>
        </div>
      )}

      {/* Test Message Sender */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Test Message Sender</h3>
          <p className="text-sm text-gray-600 mt-1">
            Send a test message with detailed debugging information
          </p>
        </div>
        <div className="px-6 py-4">
          <form onSubmit={testSendMessage} className="space-y-4">
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                Phone Number *
              </label>
              <input
                type="tel"
                id="phoneNumber"
                required
                value={testForm.phoneNumber}
                onChange={(e) => setTestForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="+1234567890"
              />
              <p className="mt-1 text-sm text-gray-500">
                Include country code (e.g., +91 for India, +1 for US)
              </p>
            </div>

            <div>
              <label htmlFor="testMessage" className="block text-sm font-medium text-gray-700">
                Test Message
              </label>
              <textarea
                id="testMessage"
                rows={3}
                value={testForm.testMessage}
                onChange={(e) => setTestForm(prev => ({ ...prev, testMessage: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <button
              type="submit"
              disabled={testLoading}
              className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {testLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Testing...
                </>
              ) : (
                <>
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Send Test Message
                </>
              )}
            </button>
          </form>

          {/* Test Results */}
          {testResult && (
            <div className="mt-6 border-t pt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Test Results</h4>
              <div className={`rounded-md p-4 ${
                testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-start">
                  {testResult.success ? (
                    <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
                  ) : (
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-3 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <h5 className={`font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {testResult.success ? 'Test Message Sent Successfully!' : 'Test Message Failed'}
                    </h5>
                    
                    {testResult.debug && (
                      <div className="mt-3">
                        <details>
                          <summary className="cursor-pointer text-sm font-medium">
                            View Debug Details
                          </summary>
                          <div className="mt-2 space-y-2 text-sm">
                            <p><strong>Step:</strong> {testResult.debug.step}</p>
                            <p><strong>Phone Number:</strong> {testResult.debug.phoneNumber}</p>
                            <p><strong>Normalized Phone:</strong> {testResult.debug.normalizedPhone}</p>
                            
                            {testResult.debug.response && (
                              <div>
                                <p><strong>API Response Status:</strong> {testResult.debug.response.status}</p>
                                <details className="mt-2">
                                  <summary className="cursor-pointer">API Response Data</summary>
                                  <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-auto">
                                    {JSON.stringify(testResult.debug.response.data, null, 2)}
                                  </pre>
                                </details>
                              </div>
                            )}
                            
                            {testResult.debug.error && (
                              <p className="text-red-600"><strong>Error:</strong> {testResult.debug.error}</p>
                            )}
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Common Issues */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <InformationCircleIcon className="h-6 w-6 text-blue-500 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-medium text-blue-900">Common Issues & Solutions</h3>
            <div className="mt-3 space-y-3 text-sm text-blue-800">
              <div>
                <p className="font-medium">Messages not receiving:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Verify phone number format includes country code (+91xxxxxxxxxx)</li>
                  <li>Check if WhatsApp Business Account is verified and active</li>
                  <li>Ensure access token has required permissions (whatsapp_business_messaging)</li>
                  <li>Verify the recipient number is a valid WhatsApp number</li>
                  <li>Check if templates are approved (for template messages)</li>
                </ul>
              </div>
              <div>
                <p className="font-medium">API Connection Issues:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Verify Business Account ID is correct</li>
                  <li>Check if access token is valid and not expired</li>
                  <li>Ensure Phone Number ID matches your WhatsApp Business Phone Number</li>
                  <li>Check Facebook Business Manager for any restrictions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
