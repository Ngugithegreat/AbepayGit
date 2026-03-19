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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check auth only once when layout mounts
    const checkAuth = () => {
      const loginid = localStorage.getItem('deriv_loginid');
      const hasPassword = localStorage.getItem('user_has_password');

      console.log('🔒 Protected layout: Checking auth...');
      console.log('Login ID:', loginid);
      console.log('Has password:', hasPassword);

      if (!loginid || hasPassword !== 'true') {
        console.log('❌ Not authenticated, redirecting to login');
        router.replace('/login');
      } else {
        console.log('✅ Authenticated, allowing access');
        setIsAuthenticated(true);
      }
      setIsChecking(false);
    };

    checkAuth();
  }, [router]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-16 h-16 animate-spin text-primary"/>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Render nothing while the redirect is happening
    return null;
  }

  // If authenticated, render the main app layout and the page content
  return <AppLayout>{children}</AppLayout>;
}
