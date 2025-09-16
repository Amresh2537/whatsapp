'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  PhoneIcon,
  CalendarIcon,
  UserIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

export default function MessageDetailPage() {
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (params.id) {
      loadMessage();
    }
  }, [params.id]);

  const loadMessage = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/messages/${params.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(data.message);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load message');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error loading message:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'sent': return 'text-blue-600 bg-blue-100';
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'read': return 'text-green-700 bg-green-200';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'sending': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-700 bg-red-200';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'sent': 
      case 'delivered': 
      case 'read': return CheckCircleIcon;
      case 'sending': return ClockIcon;
      case 'failed':
      case 'error': return ExclamationCircleIcon;
      default: return ChatBubbleLeftRightIcon;
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/messages"
            className="flex items-center text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Messages
          </Link>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400 mr-2" />
            <div className="text-sm text-red-800">
              <p className="font-medium">Error loading message</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!message) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/messages"
            className="flex items-center text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Messages
          </Link>
        </div>

        <div className="text-center py-12">
          <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Message not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The requested message could not be found.
          </p>
        </div>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(message.status);
  const isOutbound = message.direction === 'outbound';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/messages"
            className="flex items-center text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Messages
          </Link>
        </div>

        <div className="flex items-center space-x-2">
          {!isOutbound && (
            <Link
              href={`/dashboard/messages/reply?messageId=${message._id}`}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 text-sm font-medium"
            >
              Reply
            </Link>
          )}
        </div>
      </div>

      {/* Message Card */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Message Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-full ${isOutbound ? 'bg-blue-100' : 'bg-green-100'}`}>
                <ChatBubbleLeftRightIcon className={`h-6 w-6 ${isOutbound ? 'text-blue-600' : 'text-green-600'}`} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {isOutbound ? 'Sent Message' : 'Received Message'}
                </h1>
                <p className="text-sm text-gray-500">
                  Message ID: {message._id}
                </p>
              </div>
            </div>

            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(message.status)}`}>
              <StatusIcon className="h-4 w-4 mr-2" />
              {message.status}
            </span>
          </div>
        </div>

        {/* Message Content */}
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Message Content */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Message Content</h3>
                
                {message.type === 'template' && (
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <DocumentTextIcon className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-medium text-purple-600">Template Message</span>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
                      <p className="text-sm text-gray-700">
                        <strong>Template:</strong> {message.content?.templateName}
                      </p>
                      <p className="text-sm text-gray-700">
                        <strong>Language:</strong> {message.content?.templateLanguage || 'en_US'}
                      </p>
                      {message.content?.headerValue && (
                        <p className="text-sm text-gray-700">
                          <strong>Header:</strong> {message.content.headerValue}
                        </p>
                      )}
                      {message.content?.bodyParameters && message.content.bodyParameters.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700">Parameters:</p>
                          <ul className="list-disc list-inside text-sm text-gray-600 ml-2">
                            {message.content.bodyParameters.map((param, index) => (
                              <li key={index}>{param}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {message.content?.text && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message Text
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                      <p className="text-gray-800 whitespace-pre-wrap">{message.content.text}</p>
                    </div>
                  </div>
                )}

                {message.content?.mediaUrl && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Media
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                      <a 
                        href={message.content.mediaUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        View Media
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Message Details */}
            <div className="space-y-6">
              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4 space-y-3">
                  <div className="flex items-center space-x-2">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {message.contactId?.fullName || 'Unknown Contact'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-600">{message.phoneNumber}</span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Message Timeline</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Created:</span>
                      <span className="text-sm text-gray-600 ml-2">{formatDate(message.createdAt)}</span>
                    </div>
                  </div>

                  {message.sentDate && (
                    <div className="flex items-center space-x-2">
                      <CheckCircleIcon className="h-5 w-5 text-blue-500" />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Sent:</span>
                        <span className="text-sm text-gray-600 ml-2">{formatDate(message.sentDate)}</span>
                      </div>
                    </div>
                  )}

                  {message.deliveredDate && (
                    <div className="flex items-center space-x-2">
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Delivered:</span>
                        <span className="text-sm text-gray-600 ml-2">{formatDate(message.deliveredDate)}</span>
                      </div>
                    </div>
                  )}

                  {message.readDate && (
                    <div className="flex items-center space-x-2">
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Read:</span>
                        <span className="text-sm text-gray-600 ml-2">{formatDate(message.readDate)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Error Information */}
              {message.errorMessage && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Error Details</h3>
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-sm text-red-800">{message.errorMessage}</p>
                    {message.failureReason && (
                      <p className="text-sm text-red-600 mt-2">
                        <strong>Reason:</strong> {message.failureReason}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Message Type:</span>
                    <span className="text-gray-800 capitalize">{message.type}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Direction:</span>
                    <span className="text-gray-800 capitalize">{message.direction}</span>
                  </div>
                  {message.whatsappMessageId && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">WhatsApp ID:</span>
                      <span className="text-gray-800 font-mono text-xs">{message.whatsappMessageId}</span>
                    </div>
                  )}
                  {message.templateId && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Template:</span>
                      <span className="text-gray-800">{message.templateId.name}</span>
                    </div>
                  )}
                  {message.campaignId && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Campaign:</span>
                      <span className="text-gray-800">{message.campaignId.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Webhook Events History */}
      {message.webhookEvents && message.webhookEvents.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Status History</h3>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-3">
              {message.webhookEvents.map((event, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      event.status === 'delivered' ? 'bg-green-500' : 
                      event.status === 'sent' ? 'bg-blue-500' : 
                      event.status === 'failed' ? 'bg-red-500' : 'bg-gray-400'
                    }`}></div>
                    <span className="text-sm font-medium text-gray-900 capitalize">{event.status}</span>
                    {event.errorMessage && (
                      <span className="text-sm text-red-600">- {event.errorMessage}</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{formatDate(event.timestamp)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
