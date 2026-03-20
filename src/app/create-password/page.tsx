
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Shield } from 'lucide-react';

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export default function CreatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Check if user came from confirmation and mpesa setup
    const tempUserInfo = sessionStorage.getItem('temp_user_info');
    const tempMpesaPhone = sessionStorage.getItem('temp_mpesa_phone');
    if (!tempUserInfo || !tempMpesaPhone) {
      router.push('/login');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      setError('Password must be 8+ characters, with an uppercase letter, a number, and a special character.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSaving(true);

    try {
      // Get temp data
      const token = sessionStorage.getItem('temp_oauth_token');
      const accounts = sessionStorage.getItem('temp_oauth_accounts');
      const userInfoStr = sessionStorage.getItem('temp_user_info');
      const mpesaPhone = sessionStorage.getItem('temp_mpesa_phone');

      if (!token || !userInfoStr) {
        throw new Error('Missing session data. Please start the login process again.');
      }

      const userInfo = JSON.parse(userInfoStr);

      console.log('💾 Saving user data:', userInfo);

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Store EVERYTHING in localStorage
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

      console.log('✅ User data saved to localStorage');

      // Save token to Redis for balance API
      await fetch('/api/user/save-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account: userInfo.loginid,
          token: token,
        }),
      });

      // Save M-Pesa phone to Redis
      if (mpesaPhone) {
        await fetch('/api/user/save-mpesa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            account: userInfo.loginid,
            phone: mpesaPhone,
          }),
        });
      }

      // Clear temp data
      sessionStorage.clear();

      console.log('✅ Account setup complete!');

      // Instead of going to login, go straight to dashboard
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Setup error:', error);
      setError(error.message || 'Failed to complete setup');
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center shadow-2xl">
              <Lock className="w-16 h-16 text-secondary-foreground" strokeWidth={2.5} />
            </div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-xl bg-gradient-to-br from-secondary/80 to-secondary/70 flex items-center justify-center">
              <Shield className="w-6 h-6 text-secondary-foreground" />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Create Password</h1>
          <p className="text-muted-foreground text-sm">
            Choose a strong password to secure your account.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your new password"
              className="w-full h-14 px-4 bg-input border border-border rounded-xl text-foreground placeholder-muted-foreground focus:border-secondary focus:outline-none"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              className="w-full h-14 px-4 bg-input border border-border rounded-xl text-foreground placeholder-muted-foreground focus:border-secondary focus:outline-none"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {error && (
            <p className="text-destructive text-sm text-center bg-destructive/10 p-3 rounded-lg">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full h-14 bg-gradient-to-r from-secondary to-secondary/90 hover:from-secondary/90 hover:to-secondary/80 text-secondary-foreground rounded-xl font-semibold text-lg shadow-xl transition-all disabled:opacity-50"
          >
            {isSaving ? <span className="loader h-5 w-5 border-2 rounded-full"></span> : 'Finish Setup'}
          </button>
        </form>
      </div>
    </div>
  );
}
