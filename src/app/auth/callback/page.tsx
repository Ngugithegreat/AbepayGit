'use client';

import { useEffect, useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState('Finalizing authentication, please wait...');
  const [error, setError] = useState<string | null>(null);
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent this effect from running multiple times in strict mode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = () => {
      try {
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        const token = hashParams.get('token');
        const callbackError = hashParams.get('error');

        // Immediately clean the URL for security
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

        // The critical step: save the token directly to local storage.
        localStorage.setItem('deriv_token', token);

        // Perform a hard redirect to the dashboard.
        // This ensures a clean state and forces the AuthProvider to initialize
        // by reading the newly stored token.
        setMessage('Authentication successful! Redirecting to your dashboard...');
        window.location.href = '/dashboard';
        
      } catch (e: any) {
        setError('An unexpected error occurred during authentication.');
        setMessage('Authentication error. Redirecting to login...');
        setTimeout(() => router.replace('/login'), 3000);
      }
    };

    processAuth();
  }, [router]);

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
