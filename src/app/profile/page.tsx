'use client';

import { AppLayout } from '@/components/app-layout';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
        toast({ title: "Profile Updated", description: "Your changes have been saved." });
        setIsSaving(false);
    }, 1500)
  }

  return (
    <AppLayout>
      <div className="slide-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Profile</h1>
          <p className="text-gray-400">Manage your personal information</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 glass-effect rounded-xl p-6 custom-shadow">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                <input type="text" id="fullName" required defaultValue={user?.fullname} className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white" />
              </div>
              <div>
                <label htmlFor="profileEmail" className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                <input type="email" id="profileEmail" required defaultValue={user?.email} className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white" />
              </div>
              <div>
                <label htmlFor="derivAccount" className="block text-sm font-medium text-gray-300 mb-1">Deriv Account ID</label>
                <input type="text" id="derivAccount" required disabled defaultValue={user?.loginid} className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white disabled:opacity-70" />
              </div>
              <div className="pt-4 border-t border-slate-700">
                <button type="submit" disabled={isSaving} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200 disabled:bg-blue-800">
                  {isSaving ? <span className="loader h-5 w-5 border-2 rounded-full"></span> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
          <div className="space-y-6">
            <div className="glass-effect rounded-xl p-6 custom-shadow">
                <h3 className="font-medium text-white mb-4">Account Security</h3>
                <div className="space-y-4">
                <div>
                  <button type="button" className="w-full px-3 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 text-sm font-medium rounded-lg transition duration-200 flex items-center justify-between">
                    <span><i className="fas fa-lock mr-2"></i> Change Password</span>
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
                </div>
            </div>
            <div className="glass-effect rounded-xl p-6 custom-shadow">
              <h3 className="font-medium text-white mb-4">Danger Zone</h3>
              <button type="button" className="w-full px-3 py-2 bg-red-900 hover:bg-red-800 text-red-300 text-sm font-medium rounded-lg transition duration-200">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
