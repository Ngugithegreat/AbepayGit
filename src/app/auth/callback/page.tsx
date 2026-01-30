'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [message, setMessage] = useState('Finalizing authentication...');
  const [error, setError] = useState<string | null>(null);
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent this effect from running twice in React's Strict Mode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      try {
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        const token = hashParams.get('token');
        const callbackError = hashParams.get('error');

        // Immediately clean the URL hash to prevent the token from being exposed or reused.
        window.history.replaceState(null, '', window.location.pathname);

        if (callbackError) {
          setError(`Authentication failed: ${callbackError}`);
          setMessage('Authentication failed. Redirecting to login...');
          setTimeout(() => router.replace('/login'), 3000);
          return;
        }

        if (!token) {
          setError('No authentication token found in callback.');
          setMessage('Invalid authentication callback. Redirecting to login...');
          setTimeout(() => router.replace('/login'), 3000);
          return;
        }

        // CRITICAL: Await the login function to complete. This is the key to
        // preventing the race condition. The app will not proceed until the
        // user's authentication state is fully verified and updated.
        setMessage('Verifying your account with Deriv...');
        const loginSuccess = await login(token);

        if (loginSuccess) {
          setMessage('Authentication successful! Redirecting to dashboard...');
          // Redirect to the dashboard only after a successful login.
          router.replace('/dashboard');
        } else {
          setError('Failed to verify your account with Deriv.');
          setMessage('Could not verify your account. Please try logging in again.');
          setTimeout(() => router.replace('/login'), 3000);
        }
      } catch (e: any) {
        console.error('Auth callback error:', e);
        setError('An unexpected error occurred during authentication.');
        setMessage('Authentication error. Redirecting to login...');
        setTimeout(() => router.replace('/login'), 3000);
      }
    };

    processAuth();
    // The dependency array is empty because we want this to run only once on mount.
    // The hasProcessed ref handles the strict mode double-invocation.
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
