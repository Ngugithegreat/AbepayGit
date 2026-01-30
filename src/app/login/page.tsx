'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { isLinked, isLoading } = useAuth();
  const [authUrl, setAuthUrl] = useState('');

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
        toast({
            title: "Authentication Failed",
            description: "There was an error during the login process. Please try again.",
            variant: "destructive"
        });
    }

    if (isLinked) {
        router.replace('/dashboard');
    }

  }, [searchParams, toast, isLinked, router]);

   useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_DERIV_APP_ID;
    if (appId && typeof window !== 'undefined') {
      const redirectUri = `${window.location.protocol}//${window.location.host}/auth/callback`;
      setAuthUrl(`https://oauth.deriv.com/oauth2/authorize?app_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read+payments+trade`);
    }
  }, []);

  if (isLoading || isLinked) {
     return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-900">
        <div className="loader h-12 w-12 rounded-full border-4 border-slate-500"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-slate-900">
      <div className="w-full max-w-md glass-effect rounded-xl p-8 custom-shadow slide-in">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-blue-500">Deriv M-Pesa Connect</h2>
          <p className="text-gray-400 mt-2">Instant deposits and withdrawals</p>
        </div>
        
        <button 
            onClick={() => authUrl && router.push(authUrl)}
            disabled={!authUrl}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition duration-200 flex items-center justify-center border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed">
            <i className="fas fa-external-link-alt mr-2"></i> Login with Deriv
        </button>
      </div>
    </div>
  );
}
