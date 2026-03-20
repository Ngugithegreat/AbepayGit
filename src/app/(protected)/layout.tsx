'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/app-layout';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isChecked, setIsChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Wait a bit for localStorage to be ready
    const checkAuth = () => {
      console.log('🔒 Protected Layout: Checking auth...');
      
      const loginid = localStorage.getItem('deriv_loginid');
      const hasPassword = localStorage.getItem('user_has_password');

      console.log('   loginid:', loginid);
      console.log('   hasPassword:', hasPassword);

      if (loginid && hasPassword === 'true') {
        console.log('✅ Authenticated');
        setIsAuthenticated(true);
      } else {
        console.log('❌ Not authenticated, redirecting...');
        window.location.href = '/login';
      }

      setIsChecked(true);
    };

    // Delay check to ensure localStorage is ready
    setTimeout(checkAuth, 300);
  }, []);

  if (!isChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <AppLayout>{children}</AppLayout>;
}
