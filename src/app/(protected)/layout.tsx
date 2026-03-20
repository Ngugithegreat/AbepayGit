'use client';

import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/app-layout';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const [isChecked, setIsChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Give localStorage time to be ready
    const timer = setTimeout(() => {
      console.log('🔒 Checking auth...');
      
      const loginid = localStorage.getItem('deriv_loginid');
      const hasPassword = localStorage.getItem('user_has_password');

      console.log('loginid:', loginid);
      console.log('hasPassword:', hasPassword);

      if (loginid && hasPassword === 'true') {
        console.log('✅ Authenticated!');
        setIsAuthenticated(true);
      } else {
        console.log('❌ Not authenticated');
        window.location.href = '/login';
      }

      setIsChecked(true);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, []);

  if (!isChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <AppLayout>{children}</AppLayout>;
}
