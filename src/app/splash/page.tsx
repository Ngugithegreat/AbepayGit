'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AbepayLogo } from '@/components/branding/abepay-logo';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      // Wait for splash animation
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Check localStorage for existing session
      const hasSession = localStorage.getItem('deriv_user');
      
      if (hasSession) {
        // Returning user - go to biometric login
        router.push('/welcome-back');
      } else {
        // New user - go to regular login
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
      <div className="text-center space-y-8 animate-fade-in">
        {/* Logo with animation */}
        <div className="animate-scale-in">
          <AbepayLogo size="xl" />
        </div>

        {/* Tagline */}
        <div className="space-y-2 animate-slide-up">
          <p className="text-xl text-gray-600 font-medium">
            Instant Transactions
          </p>
          <p className="text-lg text-gray-500">
            Without Wasting Time
          </p>
        </div>

        {/* Loading indicator */}
        <div className="flex justify-center gap-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
