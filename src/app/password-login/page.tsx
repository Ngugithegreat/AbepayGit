
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verify password
    const storedPassword = localStorage.getItem('user_password');
    
    if (password === storedPassword) {
      // Success - go to dashboard
      router.push('/dashboard');
    } else {
      setError('Incorrect password');
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
            Thank you for choosing
            <br />
            ABEPAY Payment Agent
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Enter Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••••"
                className="w-full h-14 px-4 border-2 border-gray-200 rounded-xl text-gray-900 focus:border-blue-500 focus:outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
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
            className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl font-semibold text-lg shadow-lg transition-all"
          >
            Login
          </button>

          <button
            type="button"
            className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Forgot Password?
          </button>
        </form>
      </div>

      {/* Privacy Notice */}
      <p className="text-center text-xs text-gray-500 mt-8">
        At ABEPAY, we are On Your Side and we value your data privacy.
        <br />
        Read our <span className="text-blue-600 underline">Privacy Notice</span>.
      </p>
    </div>
  );
}
