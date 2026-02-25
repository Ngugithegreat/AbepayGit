
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WelcomeBackPage() {
  const router = useRouter();
  const [userName, setUserName] = useState('User');

  useEffect(() => {
    // Get first name from localStorage
    const fullName = localStorage.getItem('user_name') || 'User';
    const firstName = fullName.split(' ')[0];
    setUserName(firstName);
  }, []);

  const handleLogin = async () => {
    // Check if biometric is enabled
    const biometricEnabled = localStorage.getItem('biometric_enabled') === 'true';
    
    if (biometricEnabled && window.PublicKeyCredential) {
      try {
        // Attempt biometric authentication
        // For now, simulate
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Success - go to dashboard
        router.push('/dashboard');
      } catch (error) {
        // Biometric failed - go to password login
        router.push('/password-login');
      }
    } else {
      // No biometric - go to password login
      router.push('/password-login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-12">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <span className="text-5xl font-black text-white">A</span>
            </div>
          </div>
          <h1 className="text-4xl font-black text-white">ABEPAY</h1>
          <p className="text-white/80 text-sm">Payment Agent KE</p>
        </div>

        {/* Welcome Message */}
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-white">
            Hi {userName}
          </h2>
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          className="w-full h-14 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-2xl font-semibold text-lg transition-all shadow-xl border border-white/30"
        >
          Login
        </button>

        {/* Privacy Notice */}
        <p className="text-center text-xs text-white/60 px-4">
          At ABEPAY, we are On Your Side and we value your data privacy.
          <br />
          Read our <span className="underline">Privacy Notice</span>.
        </p>
      </div>
    </div>
  );
}
