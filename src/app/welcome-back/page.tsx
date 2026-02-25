'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AbepayLogo } from '@/components/branding/abepay-logo';
import { Fingerprint, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WelcomeBackPage() {
  const router = useRouter();
  const [userName, setUserName] = useState('User');
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    // Get user's name from localStorage
    const userJson = localStorage.getItem('deriv_user');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        setUserName(user.fullname || 'User');
      } catch (e) {
        console.error("Failed to parse user data from localStorage", e);
      }
    }

    // Check if biometric authentication is available
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = () => {
    // Check if Web Authentication API is available
    if (window.PublicKeyCredential) {
      setBiometricAvailable(true);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      // Implement biometric authentication
      // For now, simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Biometric auth failed:', error);
      // Fall back to password
      router.push('/password-login');
    }
  };

  const handlePasswordLogin = () => {
    router.push('/password-login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <AbepayLogo size="lg" />
        </div>

        {/* Welcome Message */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome Back!
          </h1>
          <p className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            Hi {userName} 👋
          </p>
          <p className="text-gray-600">
            Continue where you left off
          </p>
        </div>

        {/* Login Options */}
        <div className="space-y-4">
          {/* Biometric Login */}
          {biometricAvailable && (
            <Button
              onClick={handleBiometricLogin}
              className="w-full h-16 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all"
            >
              <div className="flex items-center gap-3">
                <Fingerprint className="w-6 h-6" />
                <span>Login with Biometrics</span>
              </div>
            </Button>
          )}

          {/* Face ID Option (iOS) */}
          <Button
            onClick={handleBiometricLogin}
            variant="outline"
            className="w-full h-16 border-2 border-blue-200 hover:border-blue-400 rounded-2xl font-semibold text-lg"
          >
            <div className="flex items-center gap-3 text-blue-600">
              <Scan className="w-6 h-6" />
              <span>Login with Face ID</span>
            </div>
          </Button>

          {/* Password Login */}
          <Button
            onClick={handlePasswordLogin}
            variant="ghost"
            className="w-full h-14 text-gray-600 hover:text-gray-900"
          >
            Use Password Instead
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 pt-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500">Total Deposits</p>
            <p className="text-2xl font-bold text-green-600">24</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500">Total Volume</p>
            <p className="text-2xl font-bold text-blue-600">$2.4K</p>
          </div>
        </div>
      </div>
    </div>
  );
}
