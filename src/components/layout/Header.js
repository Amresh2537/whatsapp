'use client';

import { Bars3Icon, BellIcon } from '@heroicons/react/24/outline';

export default function Header({ user, setSidebarOpen, onLogout }) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Mobile menu button */}
        <div className="flex items-center">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          {/* Page title will be added by individual pages */}
          <div className="lg:ml-0 ml-4">
            <h1 className="text-2xl font-semibold text-gray-900">
              Dashboard
            </h1>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* WhatsApp Configuration Status */}
          {user.whatsappConfigured ? (
            <div className="flex items-center text-sm text-green-600">
              <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
              WhatsApp Connected
            </div>
          ) : (
            <div className="flex items-center text-sm text-red-600">
              <div className="h-2 w-2 bg-red-500 rounded-full mr-2"></div>
              WhatsApp Not Configured
            </div>
          )}

          {/* Notifications */}
          <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md">
            <BellIcon className="h-6 w-6" />
          </button>

          {/* User menu */}
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-800 text-sm font-medium">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </span>
            </div>
            <div className="hidden md:block">
              <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
              <div className="text-xs text-gray-500">{user.email}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
