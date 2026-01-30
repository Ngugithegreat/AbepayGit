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
  const hasProcessed = useRef(false); // Prevent double processing

  useEffect(() => {
    // Prevent running twice in development strict mode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      try {
        // Get token from URL hash
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        const token = hashParams.get('token');
        const callbackError = hashParams.get('error');

        if (callbackError) {
          setError(`Authentication failed: ${callbackError}`);
          setMessage('Authentication failed. Redirecting to login...');
          // Clean URL before redirect
          window.history.replaceState(null, '', window.location.pathname);
          setTimeout(() => router.replace('/login'), 3000);
          return;
        }

        if (!token) {
          setError('No authentication token found in callback.');
          setMessage('Invalid authentication callback. Redirecting to login...');
          // Clean URL before redirect
          window.history.replaceState(null, '', window.location.pathname);
          setTimeout(() => router.replace('/login'), 3000);
          return;
        }

        // CRITICAL: Process login BEFORE cleaning the URL
        setMessage('Verifying your account with Deriv...');
        const loginSuccess = await login(token);

        // Only clean URL after successful login processing
        window.history.replaceState(null, '', window.location.pathname);

        if (loginSuccess) {
          setMessage('Authentication successful! Redirecting...');
          // Small delay to ensure auth state is fully propagated
          await new Promise(resolve => setTimeout(resolve, 500));
          router.replace('/dashboard');
        } else {
          setError('Failed to verify account.');
          setMessage('Could not verify your account. Please try again.');
          setTimeout(() => router.replace('/login'), 3000);
        }
      } catch (e) {
        console.error('Auth callback error:', e);
        setError('An unexpected error occurred during authentication.');
        setMessage('Authentication error. Redirecting to login...');
        window.history.replaceState(null, '', window.location.pathname);
        setTimeout(() => router.replace('/login'), 3000);
      }
    };

    processAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
