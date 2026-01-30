'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [message, setMessage] = useState('Finalizing authentication...');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const processAuth = async () => {
      // The token is in the hash part of the URL, not search params
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const token = params.get('token');
      const error = params.get('error');

      // Clean the URL
      window.history.replaceState(null, '', window.location.pathname);

      if (error) {
        setMessage(`Authentication failed: ${error}. Redirecting...`);
        setIsError(true);
        setTimeout(() => router.replace('/login'), 3000);
        return;
      }

      if (token) {
        // We have a token, attempt to log in.
        const success = await login(token);

        if (success) {
          setMessage('Success! Redirecting to your dashboard...');
          // On successful login, redirect to the dashboard.
          router.replace('/dashboard');
        } else {
          // The login function returned false, meaning verification failed.
          setMessage(
            'Failed to verify your account. Please try logging in again. Redirecting...'
          );
          setIsError(true);
          setTimeout(() => router.replace('/login'), 4000);
        }
      } else {
        // No token or error was found in the URL.
        // This could be a direct navigation or a misconfigured redirect.
        setMessage('Invalid authentication callback. Redirecting...');
        setIsError(true);
        setTimeout(() => router.replace('/login'), 3000);
      }
    };

    processAuth();
    // We only want this to run once on mount, so we pass an empty dependency array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 p-4 text-center bg-slate-900">
      <div
        className={`flex items-center gap-2 ${
          isError ? 'text-red-400' : 'text-slate-300'
        }`}
      >
        {!isError && <Loader2 className="h-6 w-6 animate-spin" />}
        <span className="text-lg">{message}</span>
      </div>
    </div>
  );
}
