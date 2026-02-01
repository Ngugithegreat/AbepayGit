'use client';

import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

// Global flag to prevent multiple callback executions across re-renders
let callbackHasRun = false;

export default function AuthCallbackPage() {
  const hasExecuted = useRef(false);

  useEffect(() => {
    // TRIPLE CHECK: Prevent execution if already run
    if (hasExecuted.current || callbackHasRun) {
      console.log("⚠️ Callback already executed, skipping");
      return;
    }

    // Set BOTH flags immediately
    hasExecuted.current = true;
    callbackHasRun = true;

    console.log('🔥 CALLBACK EXECUTING ONCE');

    try {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const token = params.get('token');
      const error = params.get('error');

      // Clean URL immediately
      window.history.replaceState(null, '', window.location.pathname);

      if (error) {
        console.error('❌ Error:', error);
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }

      if (!token) {
        console.error('❌ No token');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }

      console.log('💾 Saving token');
      localStorage.setItem('deriv_token', token);
      
      console.log('🚀 Redirecting to dashboard');
      
      // Use setTimeout to ensure localStorage persists
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);

    } catch (err: any) {
      console.error('💥 Error:', err);
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    }
  }, []);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-900">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
        <p className="text-xl text-slate-300">Completing login...</p>
        <p className="text-sm text-slate-500 mt-2">Please wait</p>
      </div>
    </div>
  );
}
