'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Phone } from 'lucide-react';

export default function SetupMpesaPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [userDetails, setUserDetails] = useState<any>(null);

  useEffect(() => {
    // Get temp user info from session
    const tempUserInfo = sessionStorage.getItem('temp_user_info');
    
    if (!tempUserInfo) {
      router.push('/login');
      return;
    }

    setUserDetails(JSON.parse(tempUserInfo));
  }, [router]);

  const validatePhone = (phone: string) => {
    // Remove spaces and validate Kenyan phone number
    const cleaned = phone.replace(/\s+/g, '');
    
    // Valid formats: 0712345678, 712345678, +254712345678, 254712345678
    const phoneRegex = /^(\+254|254|0)?[17]\d{8}$/;
    
    return phoneRegex.test(cleaned);
  };

  const formatPhone = (phone: string) => {
    // Convert to format: 254712345678
    let cleaned = phone.replace(/\s+/g, '');
    
    if (cleaned.startsWith('+254')) {
      return cleaned.substring(1);
    } else if (cleaned.startsWith('0')) {
      return '254' + cleaned.substring(1);
    } else if (cleaned.startsWith('254')) {
      return cleaned;
    } else {
      return '254' + cleaned;
    }
  };

  const handleContinue = () => {
    if (!phone.trim()) {
      setError('Please enter your M-Pesa phone number');
      return;
    }

    if (!validatePhone(phone)) {
      setError('Invalid phone number. Use format: 0712345678');
      return;
    }

    // Store M-Pesa phone number
    const formattedPhone = formatPhone(phone);
    sessionStorage.setItem('temp_mpesa_phone', formattedPhone);

    console.log('✅ M-Pesa phone saved:', formattedPhone);

    // Go to create password
    router.push('/create-password');
  };

  if (!userDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#3B5998] to-[#2d4373] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3B5998] to-[#2d4373] flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-2xl">
            <Phone className="w-16 h-16 text-white" strokeWidth={2.5} />
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-white">Set Up M-Pesa</h1>
          <p className="text-white/80 text-sm">
            Enter your M-Pesa phone number for withdrawals
          </p>
        </div>

        {/* Info */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 space-y-2">
          <p className="text-sm text-white/80">
            📱 This number will be used to receive withdrawals
          </p>
          <p className="text-sm text-white/80">
            ✅ Make sure it's registered with M-Pesa
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              M-Pesa Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setError('');
                }}
                placeholder="0712345678"
                className="w-full h-14 pl-12 pr-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:border-white focus:outline-none"
              />
            </div>
            {error && (
              <p className="text-red-400 text-sm mt-2">{error}</p>
            )}
          </div>

          <button
            onClick={handleContinue}
            className="w-full h-14 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-semibold text-lg shadow-xl transition-all"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
