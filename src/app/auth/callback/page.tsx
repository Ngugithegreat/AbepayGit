'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState('');
  const hasProcessed = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      // Check if already processed in this component instance
      if (hasProcessed.current) {
        console.log('⏭️ Callback already processed, skipping...');
        return;
      }

      // Check if recently processed in this session
      const lastProcessed = sessionStorage.getItem('auth_processed_at');
      if (lastProcessed) {
        const timeSince = Date.now() - parseInt(lastProcessed);
        if (timeSince < 30000) { // 30 seconds
          console.log('⏭️ Recently processed, redirecting to dashboard...');
          router.push('/dashboard');
          return;
        }
      }

      const token1 = searchParams.get('token1');
      const accounts = searchParams.get('acct1');

      if (!token1 || !accounts) {
        console.error('❌ Missing OAuth parameters');
        setError('Authentication parameters are missing.');
        setStatus('error');
        setTimeout(() => router.push('/login'), 3000);
        return;
      }

      // Mark as processed
      hasProcessed.current = true;
      sessionStorage.setItem('auth_processed_at', Date.now().toString());

      try {
        console.log('🔄 Processing OAuth callback (ONE TIME)...');
        
        // Step 1: Login
        await login(token1, accounts);

        // Step 2: Store OAuth token
        const response = await fetch('/api/user/store-oauth-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: token1,
            accounts: accounts,
          }),
        });

        const data = await response.json();

        if (data.success) {
          console.log('✅ Authentication complete!');
          setStatus('success');
          
          // Wait then redirect
          setTimeout(() => {
            router.push('/dashboard');
          }, 1000);
        } else {
          throw new Error(data.error || 'Token storage failed');
        }
      } catch (error: any) {
        console.error('❌ Auth error:', error);
        setError(error.message || 'An unknown error occurred.');
        setStatus('error');
        
        // Clear the processed flag on error
        hasProcessed.current = false;
        sessionStorage.removeItem('auth_processed_at');
        
        setTimeout(() => router.push('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, login, router]);

  if (status === 'error') {
    return (
       <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center p-6">
        <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto shadow-xl">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="space-y-2">
              <p className="text-white text-xl font-semibold">Oops! Something went wrong</p>
              <p className="text-red-200">{error}</p>
              <p className="text-white/80 text-sm">Redirecting back to login...</p>
            </div>
        </div>
      </div>
    );
  }
  
  if (status === 'success') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center p-6">
            <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center mx-auto shadow-xl">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <p className="text-white text-xl font-semibold">Success!</p>
                  <p className="text-white/80 text-sm">Redirecting to your dashboard...</p>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 flex items-center justify-center p-6">
      <div className="text-center space-y-6">
        <div className="w-20 h-20 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
        <div className="space-y-2">
          <p className="text-white text-xl font-semibold">Setting up your account...</p>
          <p className="text-white/80 text-sm">This will only take a moment</p>
        </div>
      </div>
    </div>
  );
}
