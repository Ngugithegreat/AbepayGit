'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

function AuthCallback() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Deriv's OAuth2 implicit flow returns tokens in the hash
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const token = params.get('token1'); // First account token

    if (token) {
      login(token);
      // Redirect to a page that shows the linked account status
      router.replace('/settings');
    } else {
      // Check for error in query params as a fallback, as per some OAuth flows
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      if(errorParam) {
        setError(`Authentication failed: ${errorParam} - ${errorDescription || 'No description provided.'}`);
      } else if (!hash.includes('token')) {
        // If there's no hash or no token in it, it's likely an error or invalid state.
        setError('Authentication callback is missing token data. Please try linking your account again.');
      }
    }
  }, [login, router, searchParams]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 p-4 text-center">
      {error ? (
        <>
          <h2 className="text-2xl font-semibold text-destructive">Authentication Error</h2>
          <p className="max-w-md text-muted-foreground">{error}</p>
          <button onClick={() => router.push('/settings')} className="mt-4 text-primary underline">
            Return to Settings
          </button>
        </>
      ) : (
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg">Authenticating, please wait...</span>
        </div>
      )}
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
