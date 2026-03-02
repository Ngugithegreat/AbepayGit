'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WelcomeBackPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('User');

  useEffect(() => {
    // Get user's FIRST NAME only (not "Mr" or "Ms")
    const fullName = localStorage.getItem('user_name') || 'User';
    
    // Extract first name
    // If name is "Mr Paul Mureithi", extract "Paul"
    // If name is "George Smith", extract "George"
    const nameParts = fullName.split(' ');
    
    // Remove titles like Mr, Ms, Mrs, Dr
    const titles = ['Mr', 'Ms', 'Mrs', 'Dr', 'Prof'];
    const filteredParts = nameParts.filter(part => !titles.includes(part));
    
    // Get first actual name
    const actualFirstName = filteredParts[0] || 'User';
    setFirstName(actualFirstName);
  }, []);

  const handleLogin = async () => {
    const biometricEnabled = localStorage.getItem('biometric_enabled') === 'true';
    
    if (biometricEnabled && window.PublicKeyCredential) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        router.push('/dashboard');
      } catch (error) {
        router.push('/password-login');
      }
    } else {
      router.push('/password-login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-12">
        {/* Logo - Just A with ABEPAY */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <span className="text-5xl font-black text-white">A</span>
            </div>
          </div>
          <h1 className="text-4xl font-black text-white">ABEPAY</h1>
        </div>

        {/* Welcome Message with FIRST NAME */}
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-white">
            Hi {firstName} 👋
          </h2>
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          className="w-full h-14 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-2xl font-semibold text-lg transition-all shadow-xl border border-white/30"
        >
          Login
        </button>

        {/* Privacy Notice */}
        <p className="text-center text-xs text-white/60 px-4">
          At ABEPAY, we are On Your Side and we value your data privacy.
          <br />
          Read our <span className="underline">Privacy Notice</span>.
        </p>
      </div>
    </div>
  );
}
