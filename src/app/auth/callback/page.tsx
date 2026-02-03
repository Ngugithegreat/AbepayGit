'use client';

import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const token = params.get('token');
    const error = params.get('error');

    if (error) {
      console.error('Deriv Auth Error:', error);
      window.location.assign('/login?error=' + encodeURIComponent(error));
      return;
    }

    if (token) {
      localStorage.setItem('deriv_token', token);
      window.location.assign('/dashboard');
    } else {
      console.error('No token found in callback.');
      window.location.assign('/login?error=auth_failed');
    }
  }, []);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-900">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
        <p className="text-xl text-slate-300">Completing login...</p>
        <p className="text-sm text-slate-500 mt-2">Please wait while we redirect you.</p>
      </div>
    </div>
  );
}
