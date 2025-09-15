'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PlusIcon, 
  UsersIcon, 
  MagnifyingGlassIcon,
  PhoneIcon,
  EnvelopeIcon,
  TagIcon,
  ExclamationCircleIcon 
} from '@heroicons/react/24/outline';

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    loadContacts();
  }, [currentPage, searchTerm]);

  const loadContacts = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/contacts?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
        setPagination(data.pagination || {});
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load contacts');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error loading contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    // Simple formatting for display
    if (phone.length === 11 && phone.startsWith('1')) {
      return `+1 (${phone.slice(1,4)}) ${phone.slice(4,7)}-${phone.slice(7)}`;
    }
    return phone;
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="mt-1 text-gray-600">
            Manage your WhatsApp contacts and messaging lists.
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/dashboard/contacts/import"
            className="bg-white border border-gray-300 rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Import Contacts
          </Link>
          <Link
            href="/dashboard/contacts/new"
            className="bg-green-600 hover:bg-green-700 text-white rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Contact
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search contacts by name, phone, or email..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400 mr-2" />
            <div className="text-sm text-red-800">
              <p className="font-medium">Error loading contacts</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Contacts List */}
      {contacts.length > 0 ? (
        <>
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Contacts ({pagination.total || 0})
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {contacts.map((contact) => (
                <div key={contact._id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-800 font-medium text-sm">
                            {contact.firstName?.[0] || contact.lastName?.[0] || contact.phoneNumber?.[0] || '?'}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-lg font-medium text-gray-900 truncate">
                            {contact.fullName || 'Unnamed Contact'}
                          </h4>
                          {contact.isUnsubscribed && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              Unsubscribed
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                          <div className="flex items-center">
                            <PhoneIcon className="h-4 w-4 mr-1" />
                            {formatPhoneNumber(contact.phoneNumber)}
                          </div>
                          {contact.email && (
                            <div className="flex items-center">
                              <EnvelopeIcon className="h-4 w-4 mr-1" />
                              {contact.email}
                            </div>
                          )}
                          {contact.tags && contact.tags.length > 0 && (
                            <div className="flex items-center">
                              <TagIcon className="h-4 w-4 mr-1" />
                              {contact.tags.slice(0, 2).join(', ')}
                              {contact.tags.length > 2 && ` +${contact.tags.length - 2}`}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right text-sm text-gray-500">
                        <div>Messages: {contact.messageCount || 0}</div>
                        <div>Last: {formatDate(contact.lastMessageDate)}</div>
                      </div>
                      <div className="flex space-x-2">
                        <Link
                          href={`/dashboard/contacts/${contact._id}`}
                          className="text-green-600 hover:text-green-900 text-sm font-medium"
                        >
                          View
                        </Link>
                        <Link
                          href={`/dashboard/messages/new?contact=${contact._id}`}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                        >
                          Message
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
          <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchTerm ? 'No contacts found' : 'No contacts yet'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm 
              ? 'Try adjusting your search terms.'
              : 'Get started by adding or importing your first contacts.'
            }
          </p>
          {!searchTerm && (
            <div className="mt-6 flex justify-center space-x-3">
              <Link
                href="/dashboard/contacts/import"
                className="bg-white border border-gray-300 rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Import Contacts
              </Link>
              <Link
                href="/dashboard/contacts/new"
                className="bg-green-600 hover:bg-green-700 text-white rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Add Contact
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
