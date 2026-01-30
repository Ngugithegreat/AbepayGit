'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

function AuthCallback() {
  const { login, isLinked, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [authHandled, setAuthHandled] = useState(false);

  useEffect(() => {
    // This effect handles the one-time processing of the auth token from the URL.
    if (authHandled) return;

    const handleAuth = async () => {
      setAuthHandled(true);
      const hash = window.location.hash.substring(1);
      // Clear the hash from the URL to prevent re-processing and for cleanliness
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      
      const params = new URLSearchParams(hash);
      const token = params.get('token1');

      if (token) {
        await login(token);
        // The redirect will now be handled by the effect below.
      } else {
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        if (errorParam) {
          setError(`Authentication failed: ${errorParam} - ${errorDescription || 'No description provided.'}`);
        } else if (!hash.includes('token')) {
          setError('Authentication callback is missing token data. Please try linking your account again.');
        }
      }
    };

    handleAuth();
  }, [login, authHandled, searchParams]);

  useEffect(() => {
    // This effect handles redirecting the user AFTER the authentication state is confirmed.
    if (isLinked && !isLoading) {
      router.replace('/settings');
    }
  }, [isLinked, isLoading, router]);


  if (error) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 p-4 text-center">
        <h2 className="text-2xl font-semibold text-destructive">Authentication Error</h2>
        <p className="max-w-md text-muted-foreground">{error}</p>
        <button onClick={() => router.push('/settings')} className="mt-4 text-primary underline">
          Return to Settings
        </button>
      </div>
    );
  }

  // Show a loading indicator while processing auth or waiting for redirect.
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 p-4 text-center">
      <div className="flex items-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-lg">Authenticating, please wait...</span>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <AuthCallback />
        </Suspense>
    )
}
