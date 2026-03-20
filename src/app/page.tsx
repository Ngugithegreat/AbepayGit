'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const hasPassword = localStorage.getItem('user_has_password');
    
    if (hasPassword === 'true') {
      // Has account - go to dashboard directly
      router.replace('/dashboard');
    } else {
      // No account - go to login
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
