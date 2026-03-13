
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock } from 'lucide-react';

export default function PasswordLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Get stored password
      const storedPassword = localStorage.getItem('user_password');

      if (!storedPassword) {
        setError('No account found. Please register first.');
        setIsLoading(false);
        return;
      }

      // Verify password
      if (password === storedPassword) {
        console.log('✅ Login successful!');
        
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        setError('Incorrect password. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col p-6">
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center space-y-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center">
            <span className="text-2xl font-black text-white">A</span>
          </div>
          <span className="text-2xl font-black bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
            ABEPAY
          </span>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome Back
          </h1>
          <p className="text-gray-600">
            Thank you for choosing ABEPAY
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter Your Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full h-14 pl-12 pr-12 border-2 border-gray-200 rounded-xl text-gray-900 focus:border-blue-500 focus:outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {error && (
              <p className="text-red-500 text-sm mt-2">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !password}
            className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:from-gray-300 disabled:to-gray-300 text-white rounded-xl font-semibold text-lg shadow-lg transition-all"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>

          <button
            type="button"
            onClick={() => router.push('/login')}
            className="w-full text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            Back to Login
          </button>
        </form>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <Lock className="w-4 h-4" />
          <span>256-bit encryption • Your data is secure</span>
        </div>
      </div>

      {/* Privacy Notice */}
      <p className="text-center text-xs text-gray-500 mt-8">
        At ABEPAY, we are On Your Side and we value your data privacy.
        <br />
        Read our <span className="text-blue-600 underline cursor-pointer">Privacy Notice</span>.
      </p>
    </div>
  );
}
