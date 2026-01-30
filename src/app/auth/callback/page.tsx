'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState('Processing authentication...');
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

        console.log('🔐 Callback received:', { hasToken: !!token, hasError: !!callbackError });

        // Clean URL immediately
        window.history.replaceState(null, '', window.location.pathname);

        if (callbackError) {
          console.error('❌ Auth error:', callbackError);
          setError(callbackError);
          setMessage('Authentication failed');
          setTimeout(() => router.replace('/login'), 2000);
          return;
        }

        if (!token) {
          console.error('❌ No token found');
          setError('No token');
          setMessage('No authentication token found');
          setTimeout(() => router.replace('/login'), 2000);
          return;
        }

        console.log('💾 Storing token directly...');
        
        // CRITICAL: Store token IMMEDIATELY in localStorage
        // Don't wait for any auth context or verification
        localStorage.setItem('deriv_token', token);
        
        setMessage('Token saved! Redirecting...');
        
        // Wait a moment for localStorage to persist
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('✅ Token stored, redirecting to dashboard');
        
        // Redirect to dashboard
        // The dashboard's layout will verify the token
        window.location.href = '/dashboard';
        
      } catch (e: any) {
        console.error('❌ Callback error:', e);
        setError(e.message);
        setMessage('Authentication error');
        setTimeout(() => router.replace('/login'), 2000);
      }
    };

    processAuth();
  }, [router]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 p-4 text-center bg-slate-900">
      <div className={`flex items-center gap-2 ${error ? 'text-red-400' : 'text-slate-300'}`}>
        {!error && <Loader2 className="h-6 w-6 animate-spin" />}
        <span className="text-lg">{message}</span>
      </div>
      {error && <p className="text-sm text-slate-500">Error: {error}</p>}
    </div>
  );
}
