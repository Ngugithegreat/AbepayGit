'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/app-layout';
import { Loader2 } from 'lucide-react';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      console.log('=================================');
      console.log('🔒 PROTECTED LAYOUT: Checking auth...');
      console.log('=================================');

      // Get ALL values from localStorage
      const loginid = localStorage.getItem('deriv_loginid');
      const hasPassword = localStorage.getItem('user_has_password');
      const userInfo = localStorage.getItem('user_info');
      const token = localStorage.getItem('deriv_token1');

      console.log('📍 deriv_loginid:', loginid);
      console.log('📍 user_has_password:', hasPassword);
      console.log('📍 user_info:', userInfo);
      console.log('📍 deriv_token1:', token ? 'exists' : 'missing');

      // Check if logged in
      if (loginid && hasPassword === 'true') {
        console.log('✅ AUTH CHECK PASSED - User is logged in');
        console.log('✅ Allowing access to protected area');
        setIsAuthenticated(true);
      } else {
        console.log('❌ AUTH CHECK FAILED');
        console.log('❌ Missing required data:');
        if (!loginid) console.log('   - deriv_loginid is missing');
        if (hasPassword !== 'true') console.log('   - user_has_password is not "true"');
        console.log('❌ Redirecting to login in 3 seconds...');
        
        setTimeout(() => {
          router.replace('/login');
        }, 3000);
      }

      console.log('=================================');
      setIsChecking(false);
    };

    // Small delay to ensure localStorage is ready
    setTimeout(checkAuth, 100);
  }, [router]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
       <div className="min-h-screen flex items-center justify-center bg-background">
        <div className='text-center'>
            <p className='text-destructive text-lg'>Authentication Failed</p>
            <p className='text-muted-foreground'>Redirecting to login page...</p>
        </div>
      </div>
    );
  }

  // If authenticated, render the main app layout and the page content
  return <AppLayout>{children}</AppLayout>;
}
