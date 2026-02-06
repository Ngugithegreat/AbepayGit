'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

export default function AuthCallbackPage() {
  const { handleLogin } = useAuth();
  const router = useRouter();
  // We keep useSearchParams to ensure the page is dynamic
  const searchParams = useSearchParams();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const processAuth = async () => {
      // Combine query and hash parameters into a single URLSearchParams object
      const allParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      hashParams.forEach((value, key) => {
        if (!allParams.has(key)) {
          allParams.append(key, value);
        }
      });

      const error = allParams.get('error');

      if (error) {
        console.error('Deriv Auth Error:', allParams.get('error_description') || error);
        router.replace('/login?error=' + encodeURIComponent(error));
        return;
      }

      // Find the first token in the parameters (e.g., token1, token2, etc.)
      let token: string | null = null;
      for (const [key, value] of allParams.entries()) {
        if (key.startsWith('token')) {
          token = value;
          break; // Use the first token we find
        }
      }

      if (token) {
        const success = await handleLogin(token);
        if (success) {
          router.replace('/dashboard');
        } else {
          router.replace('/login?error=auth_failed');
        }
      } else {
        console.error('No token found in callback URL.');
        router.replace('/login?error=auth_failed');
      }
    };

    // Ensure window is available before processing
    if (typeof window !== 'undefined') {
      processAuth();
    }
  }, [handleLogin, router, searchParams]);

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
