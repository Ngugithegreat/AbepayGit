'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Shield } from 'lucide-react';

export default function CreatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    const tempUserInfo = sessionStorage.getItem('temp_user_info');
    if (!tempUserInfo) { router.push('/login'); return; }
    setUserInfo(JSON.parse(tempUserInfo));
  }, [router]);

  const hashPassword = async (pwd: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pwd);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    try {
      const token = sessionStorage.getItem('temp_oauth_token');
      const accounts = sessionStorage.getItem('temp_oauth_accounts');
      const mpesaPhone = sessionStorage.getItem('temp_mpesa_phone');
      if (!token || !userInfo) throw new Error('Missing session data');
      const hashedPassword = await hashPassword(password);
      localStorage.setItem('deriv_token1', token);
      localStorage.setItem('deriv_accounts', accounts || '');
      localStorage.setItem('deriv_loginid', userInfo.loginid);
      localStorage.setItem('user_info', JSON.stringify({ loginid: userInfo.loginid, email: userInfo.email, name: userInfo.fullname, fullname: userInfo.fullname }));
      localStorage.setItem('user_password', hashedPassword);
      localStorage.setItem('user_has_password', 'true');
      if (mpesaPhone) localStorage.setItem('mpesa_phone', mpesaPhone);
      await fetch('/api/user/save-token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ account: userInfo.loginid, token }) });
      if (mpesaPhone) await fetch('/api/user/save-mpesa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ account: userInfo.loginid, phone: mpesaPhone }) });
      sessionStorage.clear();
      router.push('/login');
    } catch (error) {
      setError('Failed to complete setup. Please try again.');
    }
  };

  if (!userInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">

        {/* Glowing Icon */}
        <div className="flex justify-center">
          <div className="relative">
            {/* Outer glow */}
            <div className="absolute inset-0 rounded-3xl bg-primary/20 blur-2xl scale-150" />
            {/* Floating dots */}
            <div className="absolute -top-3 -right-3 w-3 h-3 rounded-full bg-primary/70 animate-pulse" />
            <div className="absolute -bottom-2 -left-4 w-2 h-2 rounded-full bg-secondary/60 animate-pulse" style={{ animationDelay: '0.5s' }} />
            <div className="absolute top-1/2 -right-6 w-2 h-2 rounded-full bg-warning/50 animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute -top-5 left-4 w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse" style={{ animationDelay: '1.5s' }} />
            {/* Main icon with shield badge */}
            <div className="relative">
              <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center shadow-2xl" style={{ boxShadow: '0 0 40px rgba(139, 92, 246, 0.4)' }}>
                <Lock className="w-14 h-14 text-white" strokeWidth={2.5} />
              </div>
              {/* Shield badge */}
              <div className="absolute -bottom-3 -right-3 w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg border-2 border-background">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2 mt-4">
          <h1 className="text-2xl font-bold text-foreground">Create Password</h1>
          <p className="text-muted-foreground text-sm">Please create and confirm your password to continue</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (min 8 characters)"
                className="w-full h-14 px-4 pr-12 bg-input border border-border rounded-xl text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Confirm Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className="w-full h-14 px-4 bg-input border border-border rounded-xl text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
              required
            />
          </div>
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}
          <button
            type="submit"
            className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold text-lg transition-all"
            style={{ boxShadow: '0 0 20px rgba(139, 92, 246, 0.35)' }}
          >
            Complete Setup
          </button>
        </form>
      </div>
    </div>
  );
}
