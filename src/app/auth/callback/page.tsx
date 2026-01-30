'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const token = params.get('token');
    const error = params.get('error');

    if (token) {
      // We have a token, redirect to a page that can process it securely.
      // We use sessionStorage to prevent reprocessing on refresh.
      window.history.replaceState(null, '', window.location.pathname);
      router.replace(`/?token=${token}`);
    } else if (error) {
      // Handle error case
      router.replace(`/login?error=${error}`);
    } else {
      // No token or error, go to login
      router.replace('/login');
    }
  }, [router]);


  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 p-4 text-center bg-slate-900">
      <div className="flex items-center gap-2 text-slate-300">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-lg">Finalizing authentication...</span>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-slate-900"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <AuthCallback />
        </Suspense>
    );
}
