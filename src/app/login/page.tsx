'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [hasAccount, setHasAccount] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const DERIV_APP_ID = process.env.NEXT_PUBLIC_DERIV_APP_ID || '123981';
  const [authUrl, setAuthUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const redirectUri = `${window.location.protocol}//${window.location.host}/auth/callback`;
      const derivAuthUrl = new URL('https://oauth.deriv.com/oauth2/authorize');
      derivAuthUrl.searchParams.set('app_id', DERIV_APP_ID);
      derivAuthUrl.searchParams.set('redirect_uri', redirectUri);
      derivAuthUrl.searchParams.set('scope', 'read+payments+trade+trading_information');
      setAuthUrl(derivAuthUrl.toString());
    }
  }, [DERIV_APP_ID]);

  useEffect(() => {
    const userInfo = localStorage.getItem('user_info');
    const hasPassword = localStorage.getItem('user_has_password');
    if (userInfo && hasPassword === 'true') {
      try {
        const user = JSON.parse(userInfo);
        setEmail(user.email);
        setHasAccount(true);
      } catch (e) {
        localStorage.clear();
        setHasAccount(false);
      }
    }
  }, []);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setError('');
    try {
      const storedHash = localStorage.getItem('user_password');
      if (!storedHash) {
        setError('No account found. Please register first.');
        setIsLoading(false);
        return;
      }
      const hashPassword = async (pwd: string) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(pwd);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
      };
      const enteredHash = await hashPassword(password);
      if (enteredHash === storedHash) {
        window.location.href = '/dashboard';
      } else {
        setError('Wrong password. Please try again.');
        setIsLoading(false);
      }
    } catch (error) {
      setError('Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center shadow-xl">
              <span className="text-4xl font-black text-primary">A</span>
            </div>
          </div>
          <h1 className="text-4xl font-black text-foreground">ABEPAY</h1>
          <p className="text-muted-foreground">Instant Transactions</p>
        </div>

        {hasAccount ? (
          <div className="glass-effect rounded-2xl p-8 custom-shadow space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">Welcome Back</h2>
              <p className="text-muted-foreground text-sm">Enter your password to continue</p>
            </div>
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full h-14 px-4 border border-border rounded-xl bg-input text-foreground font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full h-14 px-4 pr-12 border border-border bg-input rounded-xl focus:border-primary focus:outline-none text-foreground"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">{error}</div>
              )}
              <button
                type="submit"
                disabled={isLoading || !password}
                className="w-full h-14 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground rounded-xl font-semibold text-lg shadow-lg transition-all flex items-center justify-center"
              >
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Login'}
              </button>
              <button
                type="button"
                onClick={() => { if (confirm('This will log you out. Are you sure?')) { localStorage.clear(); sessionStorage.clear(); window.location.reload(); } }}
                className="w-full text-sm text-primary hover:text-primary/80 font-medium"
              >
                Use a different account
              </button>
            </form>
          </div>
        ) : (
          <div className="glass-effect rounded-2xl p-8 custom-shadow space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">Get Started</h2>
              <p className="text-muted-foreground text-sm">Connect with your Deriv account</p>
            </div>
            
            <a
              href={authUrl}
              className="block w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold text-lg shadow-lg transition-all flex items-center justify-center"
            >
              Login with Deriv
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
