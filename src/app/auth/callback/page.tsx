'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

function AuthCallback() {
  const { login, isLinked, isLoading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [hasProcessed, setHasProcessed] = useState(false);

  // This effect runs once to process the token from the URL
  useEffect(() => {
    if (hasProcessed) return;

    const processAuth = async () => {
      setHasProcessed(true);
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const token = params.get('token');

      if (token) {
        window.history.replaceState(null, '', window.location.pathname);
        const success = await login(token);
        if (!success) {
          setError('Authentication failed. The token could not be verified or the account is not valid. Please try linking your account again.');
        }
        // Redirect is now handled by the effect below, which waits for the state to update
      } else {
        const errorParam = new URLSearchParams(window.location.search).get('error');
        const errorDescription = new URLSearchParams(window.location.search).get('error_description');
        if (errorParam) {
          setError(`Authentication failed: ${errorParam} - ${errorDescription || 'No description provided.'}`);
        } else {
          setError('Authentication callback is missing token data. Please try linking your account again.');
        }
      }
    };

    processAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasProcessed]); 

  // This effect listens for the auth state to change and only redirects when ready
  useEffect(() => {
    // We only redirect if the login process has been attempted, we're no longer loading, and the user is successfully linked.
    if (hasProcessed && !isLoading && isLinked) {
      router.replace('/settings');
    }
  }, [hasProcessed, isLoading, isLinked, router]);


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

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 p-4 text-center">
      <div className="flex items-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-lg">Finalizing authentication...</span>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <AuthCallback />
        </Suspense>
    );
}
