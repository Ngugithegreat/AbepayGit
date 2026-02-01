'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { isLinked, isLoading } = useAuth();
  const [authUrl, setAuthUrl] = useState('');

  // This effect handles redirecting the user if they are already logged in.
  useEffect(() => {
    if (!isLoading && isLinked) {
      router.replace('/dashboard');
    }
  }, [isLoading, isLinked, router]);

  // Handle errors shown on the login page (e.g., from a failed callback)
  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      toast({
        title: 'Authentication Failed',
        description:
          'There was an error during the login process. Please try again.',
        variant: 'destructive',
      });
    }
  }, [searchParams, toast]);

  // Construct the Deriv OAuth URL. This runs on the client-side.
  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_DERIV_APP_ID;
    if (appId && typeof window !== 'undefined') {
      const redirectUri = `${window.location.protocol}//${window.location.host}/auth/callback`;
      
      // The crucial fix: Adding `prompt=login` to the URL.
      // This FORCES Deriv to show the username/password screen every single time,
      // preventing it from using a cached session. This ensures every login is a 
      // completely fresh attempt.
      const derivAuthUrl = new URL('https://oauth.deriv.com/oauth2/authorize');
      derivAuthUrl.searchParams.set('app_id', appId);
      derivAuthUrl.searchParams.set('redirect_uri', redirectUri);
      derivAuthUrl.searchParams.set('scope', 'read+payments+trade+trading_information');
      derivAuthUrl.searchParams.set('prompt', 'login'); // This is the key parameter

      setAuthUrl(derivAuthUrl.toString());
    }
  }, []);

  // Show a loading spinner while the auth state is being determined.
  // This prevents the login form from flashing on the screen for an already-logged-in user.
  if (isLoading || isLinked) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 p-4 text-center bg-slate-900">
        <div className="flex items-center gap-2 text-slate-300">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg">Loading your session...</span>
        </div>
      </div>
    );
  }

  // Render the login page if the user is not authenticated.
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-slate-900">
      <div className="w-full max-w-md glass-effect rounded-xl p-8 custom-shadow slide-in">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-blue-500">
            Deriv M-Pesa Connect
          </h2>
          <p className="text-gray-400 mt-2">Instant deposits and withdrawals</p>
        </div>

        <button
          onClick={() => authUrl && (window.location.href = authUrl)}
          disabled={!authUrl}
          className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition duration-200 flex items-center justify-center border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i className="fas fa-external-link-alt mr-2"></i> Login & Link with Deriv
        </button>
      </div>
    </div>
  );
}
