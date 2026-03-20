'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const hasPassword = localStorage.getItem('user_has_password');
    
    // Use setTimeout to avoid blocking and potential race conditions on initial load
    setTimeout(() => {
      if (hasPassword === 'true') {
        // Has account - go to dashboard directly
        router.replace('/dashboard');
      } else {
        // No account - go to login
        router.replace('/login');
      }
    }, 100);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
      <div className="text-center space-y-8">
        <div className="w-24 h-24 rounded-3xl bg-white/20 flex items-center justify-center shadow-2xl mx-auto">
          <span className="text-6xl font-black text-white">A</span>
        </div>
        <h1 className="text-5xl font-black text-white">ABEPAY</h1>
      </div>
    </div>
  );
}
