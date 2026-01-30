
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';

// This is a temporary routing page.
// It handles the OAuth callback and redirects the user to the correct place.
export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLinked } = useAuth();
  
  useEffect(() => {
    const token = searchParams.get('token');
    const hasProcessed = sessionStorage.getItem('auth_processed');

    const processAuth = async () => {
        if (token && !hasProcessed) {
            sessionStorage.setItem('auth_processed', 'true');
            const success = await login(token);
            if (success) {
                router.replace('/dashboard');
            } else {
                router.replace('/login');
            }
        } else if (isLinked) {
            router.replace('/dashboard');
        } else {
            router.replace('/login');
        }
    };

    processAuth();
    
  }, [searchParams, login, router, isLinked]);

  // Clean up session storage on component unmount
  useEffect(() => {
    return () => {
      sessionStorage.removeItem('auth_processed');
    }
  }, []);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 p-4 text-center bg-slate-900">
      <div className="flex items-center gap-2 text-slate-300">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-lg">Initializing...</span>
      </div>
    </div>
  );
}
