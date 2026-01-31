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
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      try {
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        const token = hashParams.get('token');
        const callbackError = hashParams.get('error');

        // Clean the URL hash immediately.
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

        // Use the auth context to perform the login.
        // This will verify the token and update the global auth state.
        setMessage('Verifying your account details...');
        const loginSuccess = await login(token);

        if (loginSuccess) {
          setMessage('Authentication successful! Redirecting to your dashboard...');
          // Redirect to the dashboard. The protected layout will now see the correct auth state.
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
  }, [login, router]);

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
