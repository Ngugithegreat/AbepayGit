'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
export default function WelcomeBackPage() {
  const router = useRouter();
  const [userName, setUserName] = useState('User');
  useEffect(() => {
    const userInfo = localStorage.getItem('user_info');
    if (!userInfo) {
      router.replace('/login');
      return;
    }
    try {
      const user = JSON.parse(userInfo);
      let name = user.fullname || user.name || 'User';
      name = name.replace(/^(Mr\.?|Ms\.?|Mrs\.?)\s+/i, '');
      const firstName = name.split(' ')[0];
      setUserName(firstName);
    } catch (e) {
      console.error('Error parsing user info', e);
    }
    const timer = setTimeout(() => {
      router.push('/login');
    }, 3000);
    return () => clearTimeout(timer);
  }, [router]);
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center space-y-8">
        <div className="w-24 h-24 rounded-3xl bg-primary/20 flex items-center justify-center shadow-2xl mx-auto">
          <span className="text-6xl font-black text-primary">A</span>
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-black text-foreground">
            Hi, {userName}! 👋
          </h1>
          <p className="text-xl text-muted-foreground">Welcome back to ABEPAY</p>
          <p className="text-muted-foreground/70">Continue with your session</p>
        </div>
        <div className="flex justify-center gap-2 pt-8">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-primary/80 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
