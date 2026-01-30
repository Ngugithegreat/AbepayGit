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
  const hasRedirected = useRef(false);

  // Redirect if already authenticated (user manually navigated here)
  useEffect(() => {
    if (!isLoading && isLinked && !hasRedirected.current) {
      hasRedirected.current = true;
      router.replace('/dashboard');
    }
  }, [isLoading, isLinked, router]);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      try {
        // Get hash from URL
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        const token = hashParams.get('token');
        const callbackError = hashParams.get('error');

        console.log('🔐 Auth callback received:', { 
          hasToken: !!token, 
          hasError: !!callbackError,
          hash: hash.substring(0, 50) + '...'
        });

        if (callbackError) {
          console.error('❌ Deriv returned error:', callbackError);
          setError(`Authentication failed: ${callbackError}`);
          setMessage('Authentication failed. Redirecting to login...');
          window.history.replaceState(null, '', window.location.pathname);
          setTimeout(() => router.replace('/login'), 3000);
          return;
        }

        if (!token) {
          console.error('❌ No token in callback');
          setError('No authentication token found.');
          setMessage('Invalid authentication callback. Redirecting to login...');
          window.history.replaceState(null, '', window.location.pathname);
          setTimeout(() => router.replace('/login'), 3000);
          return;
        }

        // Clean URL BEFORE processing (but we have token in memory)
        window.history.replaceState(null, '', window.location.pathname);
        
        console.log('🔄 Processing login with token...');
        setMessage('Verifying your account with Deriv...');
        
        const loginSuccess = await login(token);
        
        console.log('✅ Login result:', loginSuccess);

        if (loginSuccess) {
          setMessage('Authentication successful! Redirecting...');
          // Small delay to ensure state is fully propagated
          await new Promise(resolve => setTimeout(resolve, 300));
          
          if (!hasRedirected.current) {
            hasRedirected.current = true;
            console.log('➡️ Redirecting to dashboard');
            router.replace('/dashboard');
          }
        } else {
          console.error('❌ Login verification failed');
          setError('Failed to verify your account.');
          setMessage('Could not verify your account. Please try again.');
          setTimeout(() => router.replace('/login'), 3000);
        }
      } catch (e: any) {
        console.error('❌ Auth callback error:', e);
        setError('An unexpected error occurred.');
        setMessage('Authentication error. Redirecting to login...');
        setTimeout(() => router.replace('/login'), 3000);
      }
    };

    processAuth();
  }, []); // Empty deps - run once on mount

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 p-4 text-center bg-slate-900">
      <div className={`flex items-center gap-2 ${error ? 'text-red-400' : 'text-slate-300'}`}>
        {!error && <Loader2 className="h-6 w-6 animate-spin" />}
        <span className="text-lg">{message}</span>
      </div>
      {error && <p className="text-sm text-slate-500">{error}</p>}
    </div>
  );
}
