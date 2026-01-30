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
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const token = params.get('token');
      const error = params.get('error');

      window.history.replaceState(null, '', window.location.pathname);

      if (error) {
        setMessage(`Authentication failed: ${error}. Redirecting...`);
        setIsError(true);
        setTimeout(() => router.replace('/'), 3000);
        return;
      }

      if (token) {
        const success = await login(token);

        if (success) {
          setMessage('Success! Redirecting to your dashboard...');
          // Correctly redirect to the dashboard page
          router.replace('/dashboard');
        } else {
          setMessage(
            'Failed to verify your account. Please try logging in again. Redirecting...'
          );
          setIsError(true);
          setTimeout(() => router.replace('/'), 4000);
        }
      } else {
        // Handle cases where there's no token but it's not an error from Deriv
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        if (!code) {
            setMessage('Invalid authentication callback. Redirecting...');
            setIsError(true);
            setTimeout(() => router.replace('/'), 3000);
        }
      }
    };

    processAuth();
    // We only want this to run once on mount.
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
