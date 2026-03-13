'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      const token1 = searchParams.get('token1');
      const accounts = searchParams.get('acct1'); // This contains account info string

      if (token1 && accounts) {
        try {
          // This will authorize and set the user state for the current session
          await login(token1);
          
          // This will store the token persistently in Redis for backend APIs (like balance check)
          const response = await fetch('/api/user/store-oauth-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: token1, accounts }),
          });

          const data = await response.json();

          if (data.success) {
            router.push('/deriv-confirmation');
          } else {
            setError(data.error || 'Failed to finalize account setup.');
            setIsProcessing(false);
          }
        } catch (e: any) {
          setError(e.message || 'An unexpected error occurred during login.');
          setIsProcessing(false);
        }
      } else {
        setError('Authentication failed. No token received from Deriv.');
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [searchParams, router, login]);
  
  if (isProcessing) {
      return (
          <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
              <p className="text-white text-lg">Connecting to your account...</p>
            </div>
          </div>
      );
  }

  if (error) {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-red-900/50 border border-red-700 rounded-2xl p-8 space-y-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Authentication Failed</h2>
                    <p className="text-red-300">{error}</p>
                </div>
                <button
                    onClick={() => router.push('/login')}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold"
                >
                    Back to Login
                </button>
            </div>
        </div>
    )
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-900">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
        <p className="text-xl text-slate-300">Completing login...</p>
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
