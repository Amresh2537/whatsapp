'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  UsersIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalMessages: 0,
    sentToday: 0,
    totalTemplates: 0,
    totalContacts: 0,
    activeCampaigns: 0,
    messageDeliveryRate: 0,
  });
  const [recentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Load dashboard statistics (you would implement these endpoints)
      const [templatesRes, campaignsRes] = await Promise.all([
        fetch('/api/templates', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('/api/campaigns', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      if (templatesRes.ok) {
        const templatesData = await templatesRes.json();
        setStats(prev => ({ ...prev, totalTemplates: templatesData.templates?.length || 0 }));
      }

      if (campaignsRes.ok) {
        const campaignsData = await campaignsRes.json();
        const activeCampaigns = campaignsData.campaigns?.filter(c => 
          ['running', 'scheduled'].includes(c.status)
        ).length || 0;
        setStats(prev => ({ ...prev, activeCampaigns }));
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      name: 'Create Template',
      href: '/dashboard/templates/new',
      icon: DocumentTextIcon,
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      name: 'New Campaign',
      href: '/dashboard/campaigns/new',
      icon: PaperAirplaneIcon,
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      name: 'Add Contacts',
      href: '/dashboard/contacts/import',
      icon: UsersIcon,
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      name: 'View Messages',
      href: '/dashboard/messages',
      icon: ChatBubbleLeftRightIcon,
      color: 'bg-orange-500 hover:bg-orange-600',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.firstName}! 👋
            </h1>
            <p className="mt-1 text-gray-600">
              Here&apos;s what&apos;s happening with your WhatsApp messaging today.
            </p>
          </div>
          
          {!user?.whatsappConfigured && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Setup Required</p>
                  <p className="text-sm text-yellow-700">
                    <Link href="/dashboard/settings" className="underline">
                      Configure WhatsApp API
                    </Link> to start sending messages.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Messages</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalMessages}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sent Today</p>
              <p className="text-3xl font-bold text-gray-900">{stats.sentToday}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <PaperAirplaneIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Templates</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalTemplates}</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <DocumentTextIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
              <p className="text-3xl font-bold text-gray-900">{stats.activeCampaigns}</p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className={`${action.color} text-white rounded-lg p-4 flex flex-col items-center justify-center text-center transition-colors hover:scale-105 transform`}
            >
              <action.icon className="h-8 w-8 mb-2" />
              <span className="text-sm font-medium">{action.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Message Usage */}
      {user && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Message Usage</h3>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              {user.subscription.messagesUsed} / {user.subscription.messageLimit} messages used
            </span>
            <span className="text-sm font-medium text-gray-900">
              {user.subscription.plan} Plan
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300" 
              style={{
                width: `${Math.min((user.subscription.messagesUsed / user.subscription.messageLimit) * 100, 100)}%`
              }}
            />
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Resets on {new Date(user.subscription.resetDate).toLocaleDateString()}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        {recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center">
                  <div className="h-2 w-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-900">{activity.message}</span>
                </div>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No recent activity to show.</p>
        )}
      </div>
    </div>
  );
}
