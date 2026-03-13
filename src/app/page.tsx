'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      // Show splash for 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if user has an account
      const hasPassword = localStorage.getItem('user_has_password');
      
      if (hasPassword === 'true') {
        // Returning user - show welcome back
        router.push('/welcome-back');
      } else {
        // New user - go to login
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-8 animate-fade-in">
        <div className="animate-scale-in">
          <div className="w-24 h-24 rounded-3xl bg-primary/10 backdrop-blur-sm flex items-center justify-center shadow-2xl mx-auto">
            <span className="text-6xl font-black text-primary">A</span>
          </div>
          <h1 className="text-5xl font-black text-foreground mt-4">ABEPAY</h1>
        </div>

        <div className="space-y-1 text-muted-foreground">
          <p className="text-xl font-medium">Instant Transactions</p>
          <p className="text-lg">Without Wasting Time</p>
        </div>

        <div className="flex justify-center gap-2 pt-8">
          <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-foreground/80 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
