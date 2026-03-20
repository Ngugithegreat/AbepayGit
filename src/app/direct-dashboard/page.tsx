'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DirectDashboard() {
  const router = useRouter();

  useEffect(() => {
    // Set test credentials
    localStorage.setItem('deriv_loginid', 'CR2542302');
    localStorage.setItem('user_has_password', 'true');
    localStorage.setItem('user_info', JSON.stringify({
      loginid: 'CR2542302',
      email: 'test@example.com',
      name: 'Test User',
      fullname: 'Test User'
    }));
    localStorage.setItem('mpesa_phone', '254712345678');

    console.log('✅ Test credentials set');
    
    // Wait then go to dashboard
    setTimeout(() => {
      router.push('/dashboard');
    }, 1000);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p>Setting up test credentials...</p>
      </div>
    </div>
  );
}
