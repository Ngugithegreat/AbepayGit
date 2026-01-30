'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLinked, isLoading } = useAuth();
  const [status, setStatus] = useState('processing'); // 'processing', 'success', 'error'
  const [message, setMessage] = useState('Finalizing authentication...');

  // Effect 1: Process the token from the URL, but DO NOT redirect.
  useEffect(() => {
    const processAuth = async () => {
      // Deriv might send the token in the hash or search query, so we check both.
      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      
      const tokenFromHash = hashParams.get('token');
      const tokenFromSearch = searchParams.get('token');
      const token = tokenFromHash || tokenFromSearch;
      
      const error = hashParams.get('error') || searchParams.get('error');

      // Clean the URL for a better user experience.
      window.history.replaceState(null, '', window.location.pathname);

      if (error) {
        setMessage(`Authentication failed: ${error}. Redirecting...`);
        setStatus('error');
        setTimeout(() => router.replace('/login'), 3000);
        return;
      }

      if (token) {
        // Attempt to log in using the token.
        const success = await login(token);
        if (success) {
          // If login is successful, we change the status.
          // The redirect will be handled by the next useEffect.
          setStatus('success');
          setMessage('Authentication successful! Redirecting...');
        } else {
          setMessage('Failed to verify your account. Please try logging in again. Redirecting...');
          setStatus('error');
          setTimeout(() => router.replace('/login'), 4000);
        }
      } else {
        setMessage('Invalid authentication callback. No token found. Redirecting...');
        setStatus('error');
        setTimeout(() => router.replace('/login'), 3000);
      }
    };

    processAuth();
    // This effect should only run once when the page loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect 2: This effect waits for the authentication state to be confirmed, THEN redirects.
  useEffect(() => {
    // Only redirect when the login process was a success AND the auth context confirms the user is linked and not loading.
    if (status === 'success' && isLinked && !isLoading) {
      router.replace('/dashboard');
    }
  }, [status, isLinked, isLoading, router]);

  const isError = status === 'error';

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 p-4 text-center bg-slate-900">
      <div
        className={`flex items-center gap-2 ${
          isError ? 'text-red-400' : 'text-slate-300'
        }`}
      >
        {status === 'processing' && <Loader2 className="h-6 w-6 animate-spin" />}
        <span className="text-lg">{message}</span>
      </div>
    </div>
  );
}
