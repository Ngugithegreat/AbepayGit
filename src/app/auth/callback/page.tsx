'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Loader2, AlertCircle, Clock } from 'lucide-react';

export default function AuthCallbackPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [message, setMessage] = useState('Finalizing authentication, please wait...');
  const [error, setError] = useState<string | null>(null);
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current || !login) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const token = params.get('token');
      const callbackError = params.get('error');

      // Immediately clean the URL hash
      window.history.replaceState(null, '', window.location.pathname);

      if (callbackError) {
        if (callbackError.toLowerCase().includes('blocked')) {
          setError('Too many recent login attempts. Please wait a few minutes before trying again.');
        } else {
          setError(`Authentication failed: ${callbackError}`);
        }
        setMessage('Redirecting to login...');
        setTimeout(() => router.replace('/login'), 5000);
        return;
      }

      if (!token) {
        setError('No authentication token was received from Deriv.');
        setMessage('Redirecting to login...');
        setTimeout(() => router.replace('/login'), 5000);
        return;
      }

      try {
        const loginSuccess = await login(token);
        if (loginSuccess) {
          setMessage('Authentication successful! Redirecting to your dashboard...');
          // Hard redirect to ensure a clean state
          window.location.href = '/dashboard';
        } else {
          // The login function in the context will have already logged the specific error.
          setError('Token verification failed. Please try logging in again.');
          setMessage('Redirecting to login...');
          setTimeout(() => router.replace('/login'), 5000);
        }
      } catch (e: any) {
        setError(`An unexpected error occurred: ${e.message}`);
        setMessage('Redirecting to login...');
        setTimeout(() => router.replace('/login'), 5000);
      }
    };

    processAuth();
  }, [login, router]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 p-4 text-center bg-slate-900">
      {error ? (
        <div className="max-w-md space-y-4 glass-effect rounded-xl p-8">
            <div className="flex justify-center">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white">Authentication Failed</h2>
            <p className="text-slate-300">{error}</p>
            <p className="text-lg text-slate-300">{message}</p>
        </div>
      ) : (
        <div className="space-y-4 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
          <p className="text-xl text-slate-300">{message}</p>
        </div>
      )}
    </div>
  );
}
