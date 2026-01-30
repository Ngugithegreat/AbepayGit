'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { login, isLinked, isLoading } = useAuth();
  const [message, setMessage] = useState('Finalizing authentication...');
  const [error, setError] = useState<string | null>(null);
  const hasProcessed = useRef(false);

  // This effect runs once on mount to process the token from the URL hash.
  useEffect(() => {
    // Prevent running twice in development strict mode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processToken = async () => {
      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      const token = hashParams.get('token');
      const callbackError = hashParams.get('error');

      // Clean the URL immediately to remove the token from the address bar.
      window.history.replaceState(null, '', window.location.pathname);

      if (callbackError) {
        setError(`Authentication failed: ${callbackError}`);
        setMessage('Redirecting to login...');
        setTimeout(() => router.replace('/login'), 3000);
        return;
      }

      if (!token) {
        setError('No authentication token found in callback.');
        setMessage('Invalid callback. Redirecting to login...');
        setTimeout(() => router.replace('/login'), 3000);
        return;
      }

      // Call the login function to verify the token. We let the second
      // useEffect handle the redirect after the auth state is confirmed.
      setMessage('Verifying your account...');
      const loginSuccess = await login(token);
      
      if (!loginSuccess) {
        setError('Failed to verify account.');
        setMessage('Could not verify your account. Redirecting to login...');
        setTimeout(() => router.replace('/login'), 3000);
      }
    };

    processToken();
    // The hasProcessed ref ensures this logic runs only once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [login, router]);

  // This second effect is crucial. It listens for changes in the authentication
  // state and handles the redirect ONLY after the login is fully confirmed.
  useEffect(() => {
    // Once the auth state is no longer loading and we are successfully linked,
    // we can safely redirect to the dashboard, breaking the race condition.
    if (!isLoading && isLinked) {
      setMessage('Authentication successful! Redirecting...');
      // A small delay lets the user see the success message.
      setTimeout(() => router.replace('/dashboard'), 500);
    }
  }, [isLinked, isLoading, router]);

  // Render a loading/status UI to the user while processing.
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
