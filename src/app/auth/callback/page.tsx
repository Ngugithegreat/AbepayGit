'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [message, setMessage] = useState('Finalizing authentication...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processAuth = async () => {
      // Deriv sends the token in the URL hash, not the search parameters.
      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      const token = hashParams.get('token');
      const callbackError = hashParams.get('error');

      // Clean the URL for a better user experience and to prevent re-processing.
      window.history.replaceState(null, '', window.location.pathname);

      if (callbackError) {
        setError(`Authentication failed: ${callbackError}.`);
        setMessage('Authentication failed. Redirecting to login...');
        setTimeout(() => router.replace('/login'), 3000);
        return;
      }

      if (!token) {
        setError('Invalid authentication callback. No token found.');
        setMessage('Invalid authentication callback. Redirecting to login...');
        setTimeout(() => router.replace('/login'), 3000);
        return;
      }

      try {
        // The login function is awaited. It will not proceed until
        // the user's session is fully verified and the auth context is updated.
        const loginSuccess = await login(token);

        if (loginSuccess) {
          // This redirect will only happen AFTER the await above is complete.
          // This resolves the race condition.
          setMessage('Authentication successful! Redirecting to your dashboard...');
          router.replace('/dashboard');
        } else {
          setError('Failed to verify your account with Deriv.');
          setMessage('Failed to verify your account. Please try logging in again.');
          setTimeout(() => router.replace('/login'), 4000);
        }
      } catch (e) {
        console.error('Login process error:', e);
        setError('An unexpected error occurred during login.');
        setMessage('An unexpected error occurred. Redirecting to login...');
        setTimeout(() => router.replace('/login'), 4000);
      }
    };

    processAuth();
    // This effect should only run once on component mount.
    // The dependencies (login, router) are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 p-4 text-center bg-slate-900">
      <div
        className={`flex items-center gap-2 ${
          error ? 'text-red-400' : 'text-slate-300'
        }`}
      >
        {!error && <Loader2 className="h-6 w-6 animate-spin" />}
        <span className="text-lg">{message}</span>
      </div>
      {error && <p className="text-sm text-slate-500">{error}</p>}
    </div>
  );
}
