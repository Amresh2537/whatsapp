'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeftIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  EyeIcon,
  DocumentTextIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

export default function CampaignDetailPage() {
  const [campaign, setCampaign] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (params.id) {
      loadCampaign();
      loadCampaignMessages();
    }
  }, [params.id]);

  const loadCampaign = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/campaigns/${params.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setCampaign(data.campaign);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load campaign');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadCampaignMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/messages?campaignId=${params.id}&limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Error loading campaign messages:', err);
    }
  };

  const handleCampaignAction = async (action) => {
    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      let endpoint = '';
      let method = 'POST';
      
      switch (action) {
        case 'send':
          endpoint = `/api/campaigns/${params.id}/send`;
          break;
        case 'pause':
          endpoint = `/api/campaigns/${params.id}/pause`;
          method = 'PUT';
          break;
        case 'resume':
          endpoint = `/api/campaigns/${params.id}/resume`;
          method = 'PUT';
          break;
        case 'stop':
          endpoint = `/api/campaigns/${params.id}/stop`;
          method = 'PUT';
          break;
        default:
          throw new Error('Invalid action');
      }

      const response = await fetch(endpoint, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Campaign ${action} successful`);
        loadCampaign(); // Reload campaign data
        if (action === 'send') {
          setTimeout(loadCampaignMessages, 2000); // Reload messages after sending
        }
      } else {
        setError(data.error || `Failed to ${action} campaign`);
      }
    } catch (err) {
      setError(`Error performing ${action}: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'running': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionButtons = () => {
    if (!campaign) return null;

    const buttons = [];

    switch (campaign.status) {
      case 'draft':
      case 'scheduled':
        buttons.push({
          action: 'send',
          label: 'Send Campaign',
          icon: PlayIcon,
          color: 'bg-green-600 hover:bg-green-700 text-white'
        });
        break;
      case 'running':
        buttons.push(
          {
            action: 'pause',
            label: 'Pause',
            icon: PauseIcon,
            color: 'bg-yellow-600 hover:bg-yellow-700 text-white'
          },
          {
            action: 'stop',
            label: 'Stop',
            icon: StopIcon,
            color: 'bg-red-600 hover:bg-red-700 text-white'
          }
        );
        break;
      case 'paused':
        buttons.push(
          {
            action: 'resume',
            label: 'Resume',
            icon: PlayIcon,
            color: 'bg-green-600 hover:bg-green-700 text-white'
          },
          {
            action: 'stop',
            label: 'Stop',
            icon: StopIcon,
            color: 'bg-red-600 hover:bg-red-700 text-white'
          }
        );
        break;
    }

    return buttons;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error && !campaign) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/campaigns"
            className="flex items-center text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Campaigns
          </Link>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400 mr-2" />
            <div className="text-sm text-red-800">
              <p className="font-medium">Error loading campaign</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/campaigns"
            className="flex items-center text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Campaigns
          </Link>
        </div>

        <div className="flex items-center space-x-3">
          {getActionButtons()?.map((button) => (
            <button
              key={button.action}
              onClick={() => handleCampaignAction(button.action)}
              disabled={actionLoading}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${button.color}`}
            >
              {actionLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
              ) : (
                <button.icon className="h-4 w-4 mr-2" />
              )}
              {button.label}
            </button>
          ))}
        </div>
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
            <ExclamationCircleIcon className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {campaign && (
        <>
          {/* Campaign Details */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(campaign.status)}`}>
                  {campaign.status}
                </span>
              </div>
              {campaign.description && (
                <p className="mt-2 text-gray-600">{campaign.description}</p>
              )}
            </div>

            <div className="px-6 py-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Template: {campaign.templateId?.name || 'Unknown Template'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <UsersIcon className="h-5 w-5 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Target Contacts: {campaign.stats?.totalContacts || 0}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Created: {new Date(campaign.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {campaign.scheduledDate && (
                        <div className="flex items-center space-x-2">
                          <ClockIcon className="h-5 w-5 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            Scheduled: {new Date(campaign.scheduledDate).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Template Parameters */}
                  {(campaign.headerValue || campaign.bodyParameters?.length > 0) && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Template Parameters</h3>
                      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                        {campaign.headerValue && (
                          <div className="mb-2">
                            <span className="text-sm font-medium text-gray-700">Header: </span>
                            <span className="text-sm text-gray-600">{campaign.headerValue}</span>
                          </div>
                        )}
                        {campaign.bodyParameters?.length > 0 && (
                          <div>
                            <span className="text-sm font-medium text-gray-700">Body Parameters:</span>
                            <ul className="list-disc list-inside text-sm text-gray-600 ml-2">
                              {campaign.bodyParameters.map((param, index) => (
                                <li key={index}>{param}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Statistics */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Statistics</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-900">
                            {campaign.stats?.messagesSent || 0}
                          </p>
                          <p className="text-sm text-blue-600">Messages Sent</p>
                        </div>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-md p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-900">
                            {campaign.stats?.messagesDelivered || 0}
                          </p>
                          <p className="text-sm text-green-600">Delivered</p>
                        </div>
                      </div>
                      <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-900">
                            {campaign.stats?.messagesRead || 0}
                          </p>
                          <p className="text-sm text-purple-600">Read</p>
                        </div>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-red-900">
                            {campaign.stats?.messagesFailed || 0}
                          </p>
                          <p className="text-sm text-red-600">Failed</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Settings */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Settings</h3>
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Batch Size:</span>
                        <span className="text-gray-800">{campaign.settings?.batchSize || 50}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Delay Between Messages:</span>
                        <span className="text-gray-800">{campaign.settings?.delayBetweenMessages || 500}ms</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Retry Failed:</span>
                        <span className="text-gray-800">
                          {campaign.settings?.retryFailedMessages ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Campaign Messages */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Campaign Messages</h3>
                <span className="text-sm text-gray-500">{messages.length} messages</span>
              </div>
            </div>
            <div className="px-6 py-4">
              {messages.length > 0 ? (
                <div className="space-y-3">
                  {messages.slice(0, 10).map((message) => (
                    <div key={message._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <ChatBubbleLeftRightIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{message.phoneNumber}</span>
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
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {new Date(message.createdAt).toLocaleString()}
                        </span>
                        <Link
                          href={`/dashboard/messages/${message._id}`}
                          className="text-green-600 hover:text-green-900 text-sm"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                  {messages.length > 10 && (
                    <div className="text-center pt-4">
                      <Link
                        href={`/dashboard/messages?campaignId=${params.id}`}
                        className="text-green-600 hover:text-green-900 text-sm font-medium"
                      >
                        View All Messages ({messages.length})
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No messages sent yet</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
