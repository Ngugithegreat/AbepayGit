'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

export default function CreatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    // Get temp data from sessionStorage
    const tempUserInfo = sessionStorage.getItem('temp_user_info');
    if (!tempUserInfo) {
      router.push('/login');
      return;
    }
    setUserInfo(JSON.parse(tempUserInfo));
  }, [router]);

  const hashPassword = async (pwd: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pwd);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const token = sessionStorage.getItem('temp_oauth_token');
      const accounts = sessionStorage.getItem('temp_oauth_accounts');
      const mpesaPhone = sessionStorage.getItem('temp_mpesa_phone');

      if (!token || !userInfo) {
        throw new Error('Missing session data');
      }

      console.log('💾 Saving user data...');

      const hashedPassword = await hashPassword(password);

      // Save EVERYTHING to localStorage
      localStorage.setItem('deriv_token1', token);
      localStorage.setItem('deriv_accounts', accounts || '');
      localStorage.setItem('deriv_loginid', userInfo.loginid);
      localStorage.setItem('user_info', JSON.stringify({
        loginid: userInfo.loginid,
        email: userInfo.email,
        name: userInfo.fullname,
        fullname: userInfo.fullname,
      }));
      localStorage.setItem('user_password', hashedPassword);
      localStorage.setItem('user_has_password', 'true');
      
      if (mpesaPhone) {
        localStorage.setItem('mpesa_phone', mpesaPhone);
      }

      console.log('✅ Data saved to localStorage');

      // Save to Redis
      await fetch('/api/user/save-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account: userInfo.loginid, token }),
      });

      if (mpesaPhone) {
        await fetch('/api/user/save-mpesa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ account: userInfo.loginid, phone: mpesaPhone }),
        });
      }

      // Clear temp data
      sessionStorage.clear();

      console.log('✅ Account setup complete!');

      // Redirect to LOGIN page so user can enter their new password
      router.push('/login');

    } catch (error) {
      console.error('Setup error:', error);
      setError('Failed to complete setup');
    }
  };

  if (!userInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#3B5998] to-[#2d4373] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3B5998] to-[#2d4373] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-xl space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Create Password</h2>
          <p className="text-white/80 text-sm">Secure your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (min 8 characters)"
                className="w-full h-14 px-4 pr-12 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-white/60 focus:border-white focus:outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Confirm Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className="w-full h-14 px-4 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-white/60 focus:border-white focus:outline-none"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full h-14 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-semibold text-lg shadow-lg"
          >
            Complete Setup
          </button>
        </form>
      </div>
    </div>
  );
}
