'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { AppLayout } from '@/components/app-layout';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // This effect runs whenever the authentication state changes.
    console.log('--- ProtectedLayout Guard ---');
    console.log(`[Guard] isLoading: ${isLoading}`);
    console.log(`[Guard] user: ${user ? user.loginid : 'null'}`);

    // Wait until the initial auth check is complete.
    if (!isLoading) {
      // If the check is done and there's still no user, redirect to login.
      if (!user) {
        console.log('[Guard] ❌ Not authenticated. Redirecting to /login.');
        router.replace('/login');
      } else {
        console.log('[Guard] ✅ Authenticated. Allowing access.');
      }
    }
    console.log('---------------------------');
  }, [user, isLoading, router]);

  // While the AuthProvider is checking the session, show a full-page loader.
  // This prevents any content from flashing before the auth state is confirmed.
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If the user is authenticated, render the main app layout with the page content.
  // The useEffect above handles the redirect, so we only render if `user` is truthy.
  if (user) {
    return <AppLayout>{children}</AppLayout>;
  }

  // Render nothing while the redirect is in progress to avoid content flashes.
  return null;
}
