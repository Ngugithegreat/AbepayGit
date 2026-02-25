
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Check if user has completed setup (has password)
      const hasPassword = localStorage.getItem('user_has_password');
      const userName = localStorage.getItem('user_name');
      
      if (hasPassword && userName) {
        // Returning user
        router.push('/welcome-back');
      } else {
        // New user or incomplete setup
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 flex items-center justify-center">
      <div className="text-center space-y-8 animate-fade-in">
        {/* Logo */}
        <div className="animate-scale-in">
          <div className="flex flex-col items-center gap-4">
            {/* Logo Icon */}
            <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl">
              <span className="text-6xl font-black text-white">A</span>
            </div>
            {/* App Name */}
            <h1 className="text-5xl font-black text-white tracking-tight">
              ABEPAY
            </h1>
          </div>
        </div>

        {/* Tagline */}
        <div className="space-y-1 animate-slide-up text-white/90">
          <p className="text-xl font-medium">Instant Transactions</p>
          <p className="text-lg">Without Wasting Time</p>
        </div>

        {/* Loading dots */}
        <div className="flex justify-center gap-2 pt-8">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
