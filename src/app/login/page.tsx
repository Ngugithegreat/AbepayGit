
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
  }, [DERIV_APP_ID]);


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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#3B5998] to-[#2d4373] flex items-center justify-center shadow-xl">
              <span className="text-4xl font-black text-white">A</span>
            </div>
          </div>
          <h1 className="text-4xl font-black text-gray-900">ABEPAY</h1>
          <p className="text-gray-600">Instant Transactions</p>
        </div>

        {/* Login Form or OAuth Button */}
        {hasAccount ? (
          <div className="bg-white rounded-2xl p-8 shadow-xl space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
              <p className="text-gray-600 text-sm">Enter your password to continue</p>
            </div>

            <form onSubmit={handlePasswordLogin} className="space-y-4">
              {/* Email (pre-filled, disabled) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full h-14 px-4 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-medium"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full h-14 px-4 pr-12 border-2 border-gray-200 rounded-xl focus:border-[#3B5998] focus:outline-none text-gray-900"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !password}
                className="w-full h-14 bg-gradient-to-r from-[#3B5998] to-[#2d4373] hover:from-[#2d4373] hover:to-[#1e2e4f] disabled:from-gray-300 disabled:to-gray-300 text-white rounded-xl font-semibold text-lg shadow-lg transition-all"
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
                className="w-full text-sm text-[#3B5998] hover:text-[#2d4373] font-medium"
              >
                Use a different account
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 shadow-xl space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Get Started</h2>
              <p className="text-gray-600 text-sm">Connect with your Deriv account</p>
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

    