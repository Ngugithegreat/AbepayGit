'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

function AuthCallback() {
  const { login, isLinked } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [hasProcessed, setHasProcessed] = useState(false);

  // Effect to process the token from the URL
  useEffect(() => {
    if (isLinked || hasProcessed) {
      return;
    }

    const handleAuth = async () => {
      setHasProcessed(true);
      
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const token = params.get('token'); // Corrected from 'token1'

      if (token) {
        window.history.replaceState(null, '', window.location.pathname);
        
        const loginSuccess = await login(token);
        if (!loginSuccess) {
          setError('Authentication failed. The token could not be verified. Please try linking your account again.');
        }
        // Redirection is handled by the next effect
      } else {
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        if (errorParam) {
          setError(`Authentication failed: ${errorParam} - ${errorDescription || 'No description provided.'}`);
        } else if (!hash.includes('token=')) {
          setError('Authentication callback is missing token data. Please try linking your account again.');
        }
      }
    };

    handleAuth();
  }, [login, hasProcessed, isLinked]);

  // Effect to handle redirection AFTER the auth state is updated
  useEffect(() => {
    if (isLinked) {
      router.replace('/settings');
    }
  }, [isLinked, router]);

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
        <span className="text-lg">{isLinked ? 'Success! Redirecting...' : 'Finalizing authentication...'}</span>
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
