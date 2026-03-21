
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

  const DERIV_APP_ID = '123981';
  const [derivOAuthUrl, setDerivOAuthUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
        const redirectUri = `${window.location.protocol}//${window.location.host}/auth/callback`;
        const url = `https://oauth.deriv.com/oauth2/authorize?app_id=${DERIV_APP_ID}&redirect_uri=${redirectUri}&scope=read+payments+trade+trading_information&l=EN&brand=deriv`;
        setDerivOAuthUrl(url);
    }
  }, []);


  useEffect(() => {
    // Check if user already has an account
    const userInfo = localStorage.getItem('user_info');
    const hasPassword = localStorage.getItem('user_has_password');
    
    if (userInfo && hasPassword === 'true') {
      try {
        const user = JSON.parse(userInfo);
        setEmail(user.email || '');
        setHasAccount(true);
      } catch(e) {
        console.error("Failed to parse user info", e);
        localStorage.clear();
        sessionStorage.clear();
        setHasAccount(false);
      }
    }
  }, []);

  const hashPassword = async (pwd: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pwd);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoading) {
      console.log('⏸️ Already logging in, ignoring...');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      console.log('🔐 Login attempt started');
      
      const storedHash = localStorage.getItem('user_password');
      
      if (!storedHash) {
        console.log('❌ No stored password found');
        setError("No account found. Please register first.");
        setIsLoading(false);
        return;
      }

      console.log('🔑 Verifying password...');
      
      const enteredHash = await hashPassword(password);
      
      if (enteredHash === storedHash) {
        console.log('✅ Password correct! Redirecting to dashboard...');
        
        // Use window.location.href for full page reload
        window.location.href = '/dashboard';
      } else {
        console.log('❌ Password incorrect');
        setError('Incorrect password. Please try again.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('💥 Login error:', error);
      setError('Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3B5998] to-[#2d4373] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center shadow-xl">
              <span className="text-4xl font-black text-white">A</span>
            </div>
          </div>
          <h1 className="text-4xl font-black text-white">ABEPAY</h1>
          <p className="text-white/80">Instant Transactions</p>
        </div>

        {/* Login Form or OAuth Button */}
        {hasAccount ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-xl space-y-6 border border-white/20">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
              <p className="text-white/80 text-sm">Enter your password to continue</p>
            </div>

            <form onSubmit={handlePasswordLogin} className="space-y-4">
              {/* Email (pre-filled, disabled) */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full h-14 px-4 border-2 border-white/20 rounded-xl bg-white/10 text-white font-medium placeholder-white/60"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="Enter your password"
                    className="w-full h-14 px-4 pr-12 border-2 border-white/20 rounded-xl bg-white/10 text-white focus:border-white focus:outline-none placeholder-white/60"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3">
                  <p className="text-white text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !password}
                className="w-full h-14 bg-white/90 hover:bg-white text-[#3B5998] disabled:bg-white/40 disabled:text-[#3B5998]/50 rounded-xl font-semibold text-lg shadow-lg transition-all"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Logging in...
                  </span>
                ) : (
                  'Login'
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('This will log you out. Continue?')) {
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.reload();
                  }
                }}
                className="w-full text-sm text-white/80 hover:text-white font-medium"
              >
                Use a different account
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-xl space-y-6 border border-white/20">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Get Started</h2>
              <p className="text-white/80 text-sm">Connect with your Deriv account</p>
            </div>
            
            <a
              href={derivOAuthUrl}
              className="block w-full h-14 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-xl font-semibold text-lg shadow-lg transition-all flex items-center justify-center"
            >
              Login with Deriv
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
