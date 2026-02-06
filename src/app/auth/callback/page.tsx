'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    console.log('🔥 Callback started');

    const token = searchParams.get('token1');
    const error = searchParams.get('error');

    if (error) {
      console.error('❌ Auth error:', error);
      window.location.href = '/login?error=auth_failed';
      return;
    }

    if (!token) {
      console.error('❌ No token found');
      window.location.href = '/login?error=auth_failed';
      return;
    }

    console.log('✅ Token received');
    localStorage.setItem('deriv_token', token);
    
    console.log('🚀 Redirecting to dashboard');
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 500);
  }, [searchParams]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-900">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
        <p className="text-xl text-slate-300">Completing login...</p>
      </div>
    </div>
  );
}
