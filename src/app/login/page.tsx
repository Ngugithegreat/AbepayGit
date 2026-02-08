
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { isLinked, isLoading, user } = useAuth();
  const [authUrl, setAuthUrl] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && isLinked) {
      router.replace('/dashboard');
    }
  }, [isLoading, isLinked, router]);

  // Handle auth errors from callback
  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      toast({
        title: 'Authentication Failed',
        description: 'There was an error during the linking process. Please try again.',
        variant: 'destructive',
      });
      // Clean up the URL
      router.replace('/login', { scroll: false });
    }
  }, [searchParams, toast, router]);

  // Construct the Deriv OAuth URL for the "Sign Up" link
  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_DERIV_APP_ID;
    
    if (appId && typeof window !== 'undefined') {
      const redirectUri = `${window.location.protocol}//${window.location.host}/auth/callback`;
      
      const derivAuthUrl = new URL('https://oauth.deriv.com/oauth2/authorize');
      derivAuthUrl.searchParams.set('app_id', appId);
      derivAuthUrl.searchParams.set('redirect_uri', redirectUri);
      derivAuthUrl.searchParams.set('scope', 'read+payments+trade+trading_information');
      derivAuthUrl.searchParams.set('prompt', 'login');

      setAuthUrl(derivAuthUrl.toString());
    }
  }, []);
  
  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (user && user.email.toLowerCase() === email.toLowerCase()) {
      router.replace('/dashboard');
    } else {
      toast({
        title: 'Invalid Details',
        description: "We couldn't find an account with that email. Please Sign Up to link your Deriv account first.",
        variant: 'destructive',
      });
    }
  };

  if (isLoading || (isLinked && !user)) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 p-4 text-center bg-slate-900">
        <div className="flex items-center gap-2 text-slate-300">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg">Loading your session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-slate-900">
      <div className="w-full max-w-md glass-effect rounded-xl p-8 custom-shadow slide-in">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-blue-500">
            Abepay
          </h2>
          <p className="text-gray-400 mt-2">Instant deposits and withdrawals</p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
            <input 
              id="email"
              name="email"
              type="email" 
              autoComplete="email"
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input 
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            />
          </div>

          <div>
            <button 
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200 flex items-center justify-center"
            >
              Sign In
            </button>
          </div>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-400">
            Don't have an account?{' '}
            <a 
              href={authUrl || '#'} 
              onClick={(e) => {
                if (!authUrl) {
                  e.preventDefault();
                  toast({ title: 'Please wait', description: 'Generating login link...' });
                }
              }}
              className="font-medium text-blue-500 hover:text-blue-400"
            >
              Sign Up
            </a>
          </p>
          <p className="text-xs text-gray-500 mt-2">(You will be redirected to Deriv to link your account)</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
