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
  const [message, setMessage] = useState('Finalizing authentication...');

  useEffect(() => {
    const processAuth = async () => {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const token = params.get('token');

      if (token) {
        // Clean the token from the URL bar immediately
        window.history.replaceState(null, '', window.location.pathname);
        
        const success = await login(token);

        if (success) {
          setMessage('Success! Redirecting to your settings...');
          // Redirect after a short delay to ensure state propagation
          router.replace('/settings');
        } else {
          setError('Authentication failed. The token could not be verified or the account is not valid. Please try linking your account again.');
        }
      } else {
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        if (errorParam) {
          setError(`Authentication failed: ${errorParam} - ${errorDescription || 'No description provided.'}`);
        } else {
          // This case handles arriving on the page without any token or error, which is unexpected.
           setError('Authentication callback is missing token data. Please try linking your account again.');
        }
      }
    };

    processAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // This effect should only run once on component mount.

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
