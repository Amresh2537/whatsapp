'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PlusIcon, 
  ChatBubbleLeftRightIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

export default function MessagesPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [filter, setFilter] = useState('all'); // all, inbound, outbound
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadMessages();
  }, [currentPage, filter, statusFilter]);

  const loadMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(filter !== 'all' && { direction: filter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });

      const response = await fetch(`/api/messages?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setPagination(data.pagination || {});
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load messages');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error loading messages:', err);
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
    const messageDate = new Date(date);
    const now = new Date();
    const diffMs = now - messageDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return messageDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  if (loading && currentPage === 1) {
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
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="mt-1 text-gray-600">
            View and manage all your WhatsApp messages.
          </p>
        </div>
        <Link
          href="/dashboard/messages/new"
          className="bg-green-600 hover:bg-green-700 text-white rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Send Message
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Direction:</label>
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-md border-gray-300 text-sm focus:border-green-500 focus:ring-green-500"
          >
            <option value="all">All Messages</option>
            <option value="outbound">Sent</option>
            <option value="inbound">Received</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-md border-gray-300 text-sm focus:border-green-500 focus:ring-green-500"
          >
            <option value="all">All Status</option>
            <option value="SENT">Sent</option>
            <option value="DELIVERED">Delivered</option>
            <option value="READ">Read</option>
            <option value="FAILED">Failed</option>
            <option value="SENDING">Sending</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400 mr-2" />
            <div className="text-sm text-red-800">
              <p className="font-medium">Error loading messages</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Messages List */}
      {messages.length > 0 ? (
        <>
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Messages ({pagination.total || 0})
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {messages.map((message) => {
                const StatusIcon = getStatusIcon(message.status);
                const isOutbound = message.direction === 'outbound';
                
                return (
                  <div key={message._id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-start space-x-4">
                      {/* Direction Icon */}
                      <div className={`flex-shrink-0 mt-1 p-2 rounded-full ${
                        isOutbound ? 'bg-blue-100' : 'bg-green-100'
                      }`}>
                        {isOutbound ? (
                          <ArrowRightIcon className="h-4 w-4 text-blue-600" />
                        ) : (
                          <ArrowLeftIcon className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      
                      {/* Message Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-medium text-gray-900">
                              {isOutbound ? 'To:' : 'From:'} {message.contactId?.fullName || message.phoneNumber}
                            </h4>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(message.status)}`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {message.status}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">{formatDate(message.createdAt)}</span>
                        </div>
                        
                        <div className="mt-2">
                          {message.type === 'template' ? (
                            <div>
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                  Template
                                </span>
                                <span>{message.content?.templateName}</span>
                              </div>
                              {message.content?.text && (
                                <p className="mt-1 text-sm text-gray-800">
                                  {truncateText(message.content.text)}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-800">
                              {truncateText(message.content?.text)}
                            </p>
                          )}
                        </div>

                        {/* Additional Info */}
                        <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                          <span>Type: {message.type}</span>
                          {message.templateId && (
                            <span>Template: {message.templateId.name}</span>
                          )}
                          {message.campaignId && (
                            <span>Campaign: {message.campaignId.name}</span>
                          )}
                          {message.sentDate && (
                            <span>Sent: {formatDate(message.sentDate)}</span>
                          )}
                        </div>

                        {/* Error Message */}
                        {message.errorMessage && (
                          <div className="mt-2 text-xs text-red-600 bg-red-50 rounded p-2">
                            Error: {message.errorMessage}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0 flex space-x-2">
                        <Link
                          href={`/dashboard/messages/${message._id}`}
                          className="text-green-600 hover:text-green-900 text-sm font-medium"
                        >
                          View
                        </Link>
                        {!isOutbound && (
                          <Link
                            href={`/dashboard/messages/reply?messageId=${message._id}`}
                            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                          >
                            Reply
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                  disabled={currentPage === pagination.totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      ) : !error && (
        <div className="text-center py-12">
          <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No messages found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your filters or send your first message.'
              : 'Get started by sending your first WhatsApp message.'
            }
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/messages/new"
              className="bg-green-600 hover:bg-green-700 text-white rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Send Message
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
