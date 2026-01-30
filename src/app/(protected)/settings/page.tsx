'use client';

import { AppLayout } from '@/components/app-layout';
import AccountSettings from '@/components/settings/account-card';

export default function SettingsPage() {
  return (
      <div className="slide-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-gray-400">Manage your account preferences</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="glass-effect rounded-xl p-6 custom-shadow mb-6">
              <h2 className="text-lg font-medium text-white mb-4">Notification Preferences</h2>
              <form className="space-y-4">
                <div className="flex items-start">
                  <div className="flex h-5 items-center">
                    <input id="emailNotifications" type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-600 text-blue-600 focus:ring-blue-600 bg-slate-800" />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="emailNotifications" className="font-medium text-white">Email Notifications</label>
                    <p className="text-gray-400">Receive email notifications about your transactions</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex h-5 items-center">
                    <input id="smsNotifications" type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-600 text-blue-600 focus:ring-blue-600 bg-slate-800" />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="smsNotifications" className="font-medium text-white">SMS Notifications</label>
                    <p className="text-gray-400">Receive SMS alerts for important account activities</p>
                  </div>
                </div>
                <div>
                  <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200">
                    Save Preferences
                  </button>
                </div>
              </form>
            </div>
          </div>
          <div className="space-y-6">
            <AccountSettings />
          </div>
        </div>
      </div>
  );
}
