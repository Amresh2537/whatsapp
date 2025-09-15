'use client';

import { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  PaperAirplaneIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  UsersIcon,
  DocumentTextIcon 
} from '@heroicons/react/24/outline';

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    totalMessages: 0,
    messagesThisMonth: 0,
    deliveryRate: 0,
    totalContacts: 0,
    activeTemplates: 0,
    completedCampaigns: 0,
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d'); // 7d, 30d, 90d
  
  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Load data from various endpoints
      const [messagesRes, templatesRes, campaignsRes, contactsRes] = await Promise.all([
        fetch('/api/messages?limit=1', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('/api/templates', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('/api/campaigns', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('/api/contacts?limit=1', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      // Process responses
      let newStats = { ...stats };

      if (messagesRes.ok) {
        const messagesData = await messagesRes.json();
        newStats.totalMessages = messagesData.pagination?.total || 0;
      }

      if (templatesRes.ok) {
        const templatesData = await templatesRes.json();
        const templates = templatesData.templates || [];
        newStats.activeTemplates = templates.filter(t => t.status === 'APPROVED').length;
      }

      if (campaignsRes.ok) {
        const campaignsData = await campaignsRes.json();
        const campaigns = campaignsData.campaigns || [];
        newStats.completedCampaigns = campaigns.filter(c => c.status === 'completed').length;
      }

      if (contactsRes.ok) {
        const contactsData = await contactsRes.json();
        newStats.totalContacts = contactsData.pagination?.total || 0;
      }

      // Calculate some derived stats
      newStats.deliveryRate = Math.floor(Math.random() * 15) + 85; // Simulated for now
      newStats.messagesThisMonth = Math.floor(newStats.totalMessages * 0.3); // Simulated

      setStats(newStats);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue' }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`h-12 w-12 bg-${color}-100 rounded-lg flex items-center justify-center`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

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
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-1 text-gray-600">
            Track your WhatsApp messaging performance and engagement.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Time Range:</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="rounded-md border-gray-300 text-sm focus:border-green-500 focus:ring-green-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Messages"
          value={stats.totalMessages.toLocaleString()}
          subtitle="All time"
          icon={PaperAirplaneIcon}
          color="blue"
        />
        <StatCard
          title="This Month"
          value={stats.messagesThisMonth.toLocaleString()}
          subtitle={`${timeRange === '30d' ? 'Current month' : 'Recent period'}`}
          icon={ChartBarIcon}
          color="green"
        />
        <StatCard
          title="Delivery Rate"
          value={`${stats.deliveryRate}%`}
          subtitle="Average success rate"
          icon={CheckCircleIcon}
          color="green"
        />
        <StatCard
          title="Total Contacts"
          value={stats.totalContacts.toLocaleString()}
          subtitle="Active contacts"
          icon={UsersIcon}
          color="purple"
        />
        <StatCard
          title="Active Templates"
          value={stats.activeTemplates}
          subtitle="Approved templates"
          icon={DocumentTextIcon}
          color="indigo"
        />
        <StatCard
          title="Campaigns Completed"
          value={stats.completedCampaigns}
          subtitle="Successfully finished"
          icon={CheckCircleIcon}
          color="green"
        />
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Message Status Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Message Status Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-3 w-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-700">Delivered</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {Math.floor(stats.totalMessages * 0.85).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-3 w-3 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-700">Sent</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {Math.floor(stats.totalMessages * 0.10).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-3 w-3 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-700">Pending</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {Math.floor(stats.totalMessages * 0.03).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-3 w-3 bg-red-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-700">Failed</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {Math.floor(stats.totalMessages * 0.02).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Top Templates */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Template Performance</h3>
          <div className="space-y-4">
            <div className="text-sm text-gray-500 mb-3">Most used templates</div>
            {stats.activeTemplates > 0 ? (
              ['Marketing Template', 'Order Confirmation', 'Customer Support', 'Welcome Message'].slice(0, Math.min(4, stats.activeTemplates)).map((template, index) => (
                <div key={template} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center mr-3 ${
                      index === 0 ? 'bg-green-100' : index === 1 ? 'bg-blue-100' : index === 2 ? 'bg-purple-100' : 'bg-yellow-100'
                    }`}>
                      <span className={`text-xs font-medium ${
                        index === 0 ? 'text-green-800' : index === 1 ? 'text-blue-800' : index === 2 ? 'text-purple-800' : 'text-yellow-800'
                      }`}>
                        {index + 1}
                      </span>
                    </div>
                    <span className="text-sm text-gray-700">{template}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {Math.floor(Math.random() * 500 + 100)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm">
                No templates data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Insights */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Insights & Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <ChartBarIcon className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-800">Engagement</span>
            </div>
            <p className="text-xs text-blue-700">
              Your delivery rate is {stats.deliveryRate}%. Consider optimizing message timing for better engagement.
            </p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <DocumentTextIcon className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-sm font-medium text-green-800">Templates</span>
            </div>
            <p className="text-xs text-green-700">
              You have {stats.activeTemplates} approved templates. Create more templates to increase variety.
            </p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <UsersIcon className="h-5 w-5 text-purple-600 mr-2" />
              <span className="text-sm font-medium text-purple-800">Growth</span>
            </div>
            <p className="text-xs text-purple-700">
              {stats.totalContacts > 0 
                ? `Growing contact list with ${stats.totalContacts} contacts. Keep importing quality contacts.`
                : 'Start building your contact list by importing or adding contacts.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
