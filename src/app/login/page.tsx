'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  
  const [authUrl, setAuthUrl] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [hasAccount, setHasAccount] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // If user is already logged in via context, go to dashboard
  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  // Check for local account on mount
  useEffect(() => {
    const userInfo = localStorage.getItem('user_info');
    const userHasPassword = localStorage.getItem('user_has_password');
    if (userInfo && userHasPassword) {
      const user = JSON.parse(userInfo);
      setEmail(user.email);
      setHasAccount(true);
    }
  }, []);

  // Handle auth errors from callback
  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      toast({
        title: 'Authentication Failed',
        description: 'There was an error during the linking process. Please try again.',
        variant: 'destructive',
      });
      router.replace('/login', { scroll: false });
    }
  }, [searchParams, toast, router]);

  // Construct the Deriv OAuth URL
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
  
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    const storedPassword = localStorage.getItem('user_password');
    if (password === storedPassword) {
      console.log('✅ Password correct, redirecting...');
      router.push('/dashboard');
    } else {
      toast({
        title: 'Incorrect Password',
        description: 'The password you entered is incorrect. Please try again.',
        variant: 'destructive',
      });
      setIsLoggingIn(false);
    }
  };
  
  if (isLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-900">
              <Loader2 className="w-16 h-16 animate-spin text-blue-500"/>
          </div>
      );
  }

  // Prevent flash of login form if user is already logged in
  if (user) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-slate-900">
      <div className="w-full max-w-md glass-effect rounded-xl p-8 custom-shadow slide-in">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-blue-500">
            Abepay
          </h2>
          <p className="text-gray-400 mt-2">
            {hasAccount ? 'Welcome back! Log in to your account.' : 'Instant deposits and withdrawals'}
          </p>
        </div>

        {hasAccount ? (
          <form onSubmit={handlePasswordLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
              <input 
                id="email"
                type="email" 
                value={email}
                disabled
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-gray-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <div className="relative">
                <input 
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <button 
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200 flex items-center justify-center disabled:bg-blue-800"
              >
                {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <a 
                href={authUrl || '#'} 
                onClick={(e) => {
                  if (!authUrl) {
                    e.preventDefault();
                    toast({ title: 'Please wait', description: 'Generating login link...' });
                  }
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200 flex items-center justify-center"
              >
                Sign Up with Deriv
              </a>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">(You will be redirected to Deriv to link your account)</p>
            </div>
          </div>
        )}
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
