'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AbepayLogo } from '@/components/branding/abepay-logo';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PasswordLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Implement password verification
      // For now, simulate
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      router.push('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <AbepayLogo size="md" />
        </div>

        {/* Welcome Message */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">
            Secure Access
          </h1>
          <p className="text-gray-600">
            Thank you for choosing <span className="font-semibold text-blue-600">ABEPAY</span>
          </p>
        </div>

        {/* Password Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Enter Your Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full h-14 pl-12 pr-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-lg"
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
          </div>

          <Button
            type="submit"
            disabled={isLoading || !password}
            className="w-full h-14 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>

          <button
            type="button"
            className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Forgot Password?
          </button>
        </form>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <Lock className="w-4 h-4" />
          <span>256-bit encryption • Your data is secure</span>
        </div>
      </div>
    </div>
  );
}
