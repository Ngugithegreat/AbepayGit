'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const { handleLogin } = useAuth();
  const router = useRouter();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const processAuth = async () => {
      const error = searchParams.get('error');
      if (error) {
        console.error('Deriv Auth Error:', searchParams.get('error_description') || error);
        router.replace('/login?error=' + encodeURIComponent(error));
        return;
      }

      // Find the first token in the query parameters (e.g., token1, token2, etc.)
      const token = searchParams.get('token1');

      if (token) {
        const success = await handleLogin(token);
        if (success) {
          router.replace('/dashboard');
        } else {
          router.replace('/login?error=auth_failed');
        }
      } else {
        console.error('No token found in callback URL query parameters.');
        router.replace('/login?error=no_token_found');
      }
    };

    processAuth();
    
  }, [searchParams, handleLogin, router]);

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