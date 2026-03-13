'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Always go to login page. It will handle the logic.
      router.push('/login');
    };

    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-8 animate-fade-in">
        {/* Logo */}
        <div className="animate-scale-in">
          <div className="flex flex-col items-center gap-4">
            {/* Logo Icon */}
            <div className="w-24 h-24 rounded-3xl bg-primary/10 backdrop-blur-sm flex items-center justify-center shadow-2xl">
              <span className="text-6xl font-black text-primary">A</span>
            </div>
            {/* App Name */}
            <h1 className="text-5xl font-black text-foreground tracking-tight">
              ABEPAY
            </h1>
          </div>
        </div>

        {/* Tagline */}
        <div className="space-y-1 animate-slide-up text-foreground/90">
          <p className="text-xl font-medium">Instant Transactions</p>
          <p className="text-lg">Without Wasting Time</p>
        </div>

        {/* Loading dots */}
        <div className="flex justify-center gap-2 pt-8">
          <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-foreground/80 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
