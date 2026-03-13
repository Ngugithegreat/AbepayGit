
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const handleCallback = async () => {
      const token1 = searchParams.get('token1');
      const accounts = searchParams.get('acct1');

      if (!token1 || !accounts) {
        console.error('❌ Missing parameters');
        if (isMounted) {
          setError('Authentication parameters are missing.');
          setStatus('error');
          setTimeout(() => router.push('/login'), 3000);
        }
        return;
      }

      try {
        if (isMounted) setStatus('processing');
        
        // Step 1: Login
        await login(token1, accounts);

        // Step 2: Store token for backend usage
        await fetch('/api/user/store-oauth-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: token1, accounts }),
        });

        if (isMounted) {
          setStatus('success');
          // Wait a moment then redirect
          setTimeout(() => {
            router.push('/dashboard');
          }, 1000);
        }
      } catch (error: any) {
        console.error('❌ Auth error:', error);
        if (isMounted) {
          setError(error.message || 'An unknown error occurred.');
          setStatus('error');
          setTimeout(() => router.push('/login'), 3000);
        }
      }
    };

    handleCallback();

    return () => {
      isMounted = false;
    };
  }, [searchParams, login, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-6">
      <div className="text-center space-y-4 glass-effect rounded-xl p-8 custom-shadow">
        {status === 'processing' && (
          <>
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto" />
            <p className="text-white text-lg">Setting up your account...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <span className="text-3xl text-white">✓</span>
            </div>
            <p className="text-white text-lg">Success! Redirecting...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto">
              <span className="text-3xl text-white">✗</span>
            </div>
            <p className="text-white text-lg">Authentication Failed</p>
            <p className="text-red-400 text-sm">{error}</p>
          </>
        )}
      </div>
    </div>
  );
}


export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-slate-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-xl text-slate-300">Loading Authentication...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
