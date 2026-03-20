'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  // isReady state is no longer needed, the layout handles auth.
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    loginid: '',
    mpesaPhone: '',
  });

  useEffect(() => {
    // Auth is handled by the layout. This page just loads its data.
    loadProfileData();
  }, []);

  const loadProfileData = () => {
    const userInfoStr = localStorage.getItem('user_info');
    const loginid = localStorage.getItem('deriv_loginid');
    const mpesaPhone = localStorage.getItem('mpesa_phone');

    console.log('👤 Profile - Loading data...');
    
    if (userInfoStr) {
      try {
        const info = JSON.parse(userInfoStr);
        setUserInfo({
          name: info.fullname || info.name || '',
          email: info.email || '',
          loginid: info.loginid || loginid || '',
          mpesaPhone: mpesaPhone || '',
        });
      } catch (e) {
        console.error("Failed to parse user info", e);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // This is a dummy save, as the fields are not editable in this version.
    setTimeout(() => {
        toast({ title: "Profile Updated", description: "Your changes have been saved." });
        setIsSaving(false);
    }, 1500)
  }

  return (
      <div className="slide-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground">Manage your personal information</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 glass-effect rounded-xl p-6 custom-shadow">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Full Name</label>
                <p className="w-full p-3 bg-input border border-border rounded-lg text-foreground">{userInfo.name || 'Not set'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Email Address</label>
                <p className="w-full p-3 bg-input border border-border rounded-lg text-foreground">{userInfo.email || 'Not set'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Deriv Account ID</label>
                <p className="w-full p-3 bg-input border border-border rounded-lg text-foreground">{userInfo.loginid || 'Not set'}</p>
              </div>
               <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">M-Pesa Phone</label>
                <p className="w-full p-3 bg-input border border-border rounded-lg text-foreground">{userInfo.mpesaPhone || 'Not set'}</p>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="glass-effect rounded-xl p-6 custom-shadow">
                <h3 className="font-medium text-foreground mb-4">Account Security</h3>
                <div className="space-y-4">
                <div>
                  <button type="button" className="w-full px-3 py-2 bg-accent hover:bg-accent/80 text-foreground text-sm font-medium rounded-lg transition duration-200 flex items-center justify-between">
                    <span><i className="fas fa-lock mr-2"></i> Change Password</span>
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
                </div>
            </div>
            <div className="glass-effect rounded-xl p-6 custom-shadow">
              <h3 className="font-medium text-foreground mb-4">Danger Zone</h3>
              <button type="button" className="w-full px-3 py-2 bg-destructive/20 hover:bg-destructive/30 text-destructive text-sm font-medium rounded-lg transition duration-200">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}
