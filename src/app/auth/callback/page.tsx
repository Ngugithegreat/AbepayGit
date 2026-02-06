'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

export default function AuthCallbackPage() {
  const { handleLogin } = useAuth();
  const router = useRouter();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const processAuth = async () => {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const token = params.get('token');
      const error = params.get('error');

      if (error) {
        console.error('Deriv Auth Error:', error);
        router.replace('/login?error=' + encodeURIComponent(error));
        return;
      }

      if (token) {
        const success = await handleLogin(token);
        if (success) {
          router.replace('/dashboard');
        } else {
          router.replace('/login?error=auth_failed');
        }
      } else {
        console.error('No token found in callback.');
        router.replace('/login?error=auth_failed');
      }
    };

    processAuth();
  }, [handleLogin, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-900">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
        <p className="text-xl text-slate-300">Completing login...</p>
        <p className="text-sm text-slate-500 mt-2">Please wait while we securely log you in.</p>
      </div>
    </div>
  );
}
