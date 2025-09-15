'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PlusIcon, 
  PaperAirplaneIcon, 
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon 
} from '@heroicons/react/24/outline';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/campaigns', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load campaigns');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error loading campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'running': return 'text-blue-600 bg-blue-100';
      case 'scheduled': return 'text-purple-600 bg-purple-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'draft': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return CheckCircleIcon;
      case 'running': return PlayIcon;
      case 'scheduled': return ClockIcon;
      case 'paused': return PauseIcon;
      case 'cancelled': return ExclamationCircleIcon;
      default: return PaperAirplaneIcon;
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="mt-1 text-gray-600">
            Create and manage your WhatsApp messaging campaigns.
          </p>
        </div>
        <Link
          href="/dashboard/campaigns/new"
          className="bg-green-600 hover:bg-green-700 text-white rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Campaign
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400 mr-2" />
            <div className="text-sm text-red-800">
              <p className="font-medium">Error loading campaigns</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Campaigns List */}
      {campaigns.length > 0 ? (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">All Campaigns</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {campaigns.map((campaign) => {
              const StatusIcon = getStatusIcon(campaign.status);
              
              return (
                <div key={campaign._id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <PaperAirplaneIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <h4 className="text-lg font-medium text-gray-900 truncate">
                            {campaign.name}
                          </h4>
                          <p className="text-sm text-gray-600 truncate">
                            {campaign.description || 'No description'}
                          </p>
                          <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                            <span>Template: {campaign.templateId?.name || 'Unknown'}</span>
                            <span>•</span>
                            <span>Contacts: {campaign.stats?.totalContacts || 0}</span>
                            <span>•</span>
                            <span>Created: {formatDate(campaign.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      {/* Campaign Stats */}
                      <div className="text-right">
                        <div className="flex space-x-4 text-sm">
                          <div>
                            <span className="text-gray-500">Sent:</span>
                            <span className="ml-1 font-medium">{campaign.stats?.messagesSent || 0}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Failed:</span>
                            <span className="ml-1 font-medium">{campaign.stats?.messagesFailed || 0}</span>
                          </div>
                        </div>
                        <div className="mt-1">
                          {campaign.scheduledDate && (
                            <span className="text-xs text-gray-500">
                              Scheduled: {formatDate(campaign.scheduledDate)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Status Badge */}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                      </span>
                      
                      {/* Actions */}
                      <div className="flex space-x-2">
                        <Link
                          href={`/dashboard/campaigns/${campaign._id}`}
                          className="text-green-600 hover:text-green-900 text-sm font-medium"
                        >
                          View
                        </Link>
                        {(campaign.status === 'draft' || campaign.status === 'paused') && (
                          <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                            Send
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : !error && (
        <div className="text-center py-12">
          <PaperAirplaneIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first messaging campaign.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/campaigns/new"
              className="bg-green-600 hover:bg-green-700 text-white rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Create Campaign
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
