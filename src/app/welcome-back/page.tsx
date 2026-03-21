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
      // Extract first name and remove titles
      let name = user.fullname || user.name || 'User';
      
      // Remove titles like Mr, Ms, Mrs
      name = name.replace(/^(Mr\.?|Ms\.?|Mrs\.?)\s+/i, '');
      
      // Get first name only
      const firstName = name.split(' ')[0];
      
      setUserName(firstName);
    } catch (e) {
      console.error('Error parsing user info', e);
    }

    // Redirect to login after 3 seconds
    const timer = setTimeout(() => {
      router.push('/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3B5998] to-[#2d4373] flex items-center justify-center p-6">
      <div className="text-center space-y-8 animate-fade-in">
        <div className="w-24 h-24 rounded-3xl bg-white/20 flex items-center justify-center shadow-2xl mx-auto">
          <span className="text-6xl font-black text-white">A</span>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-4xl font-black text-white">
            Hi, {userName}! 👋
          </h1>
          <p className="text-xl text-white/90">Welcome back to ABEPAY</p>
          <p className="text-white/70">Continue with your session</p>
        </div>

        <div className="flex justify-center gap-2 pt-8">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
