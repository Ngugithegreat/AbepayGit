'use client';

import { useEffect, useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const [message, setMessage] = useState('Finalizing authentication...');
  const [error, setError] = useState<string | null>(null);
  const hasProcessed = useRef(false);

  useEffect(() => {
    // This ref ensures the logic runs only once, even in React's Strict Mode.
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
          setMessage('Authentication failed. Please try logging in again.');
          // No automatic redirect on error, let the user see the message.
          return;
        }

        if (!token) {
          setError('No authentication token found in the URL.');
          setMessage('Invalid authentication callback.');
          return;
        }

        // CRITICAL: Directly save the token to localStorage.
        // The AuthProvider on the next page will handle verification.
        localStorage.setItem('deriv_token', token);
        
        setMessage('Success! Redirecting to your dashboard...');

        // Perform a hard redirect to the dashboard.
        // This forces a clean reload, ensuring the AuthProvider
        // runs its verification logic from a clean state.
        window.location.href = '/dashboard';
        
      } catch (e: any) {
        setError('An unexpected error occurred during authentication.');
        setMessage('An error occurred. Please try again.');
      }
    };

    processAuth();
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
