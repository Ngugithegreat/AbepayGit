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
  const [message, setMessage] = useState('Authenticating, please wait...');

  useEffect(() => {
    const handleAuth = async () => {
      // Get token from URL fragment
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const token = params.get('token1');

      // Clean the URL
      window.history.replaceState(null, '', window.location.pathname);

      if (token) {
        setMessage('Verifying account details...');
        const loginSuccess = await login(token);
        
        if (loginSuccess) {
          setMessage('Authentication successful! Redirecting...');
          // On success, redirect to the settings page.
          router.replace('/settings');
        } else {
          // The login function itself will have logged the specific error.
          // We just need to show a generic message here.
          setError('Authentication failed. Please try linking your account again.');
        }
      } else {
        // This handles cases where the user is redirected here with an error from Deriv
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        if (errorParam) {
          setError(`Authentication failed: ${errorParam} - ${errorDescription || 'No description provided.'}`);
        } else if (!hash.includes('token')) {
          // Or if they land here without a token at all
          setError('Authentication callback is missing token data. Please try linking your account again.');
        }
      }
    };

    // Run only once
    handleAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty dependency array to run only on mount

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
        <span className="text-lg">{message}</span>
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
