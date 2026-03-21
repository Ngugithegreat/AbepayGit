'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const redirect = async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const hasPassword = localStorage.getItem('user_has_password');
      if (hasPassword === 'true') {
        router.replace('/welcome-back');
      } else {
        router.replace('/login');
      }
    };
    redirect();
  }, [router]);
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-8">
        <div className="w-24 h-24 rounded-3xl bg-primary/20 flex items-center justify-center shadow-2xl mx-auto">
          <span className="text-6xl font-black text-primary">A</span>
        </div>
        <h1 className="text-5xl font-black text-foreground">ABEPAY</h1>
        <p className="text-muted-foreground">Instant Transactions</p>
        <div className="flex justify-center gap-2 pt-8">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-primary/80 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
