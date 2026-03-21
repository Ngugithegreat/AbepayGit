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
    const tempUserInfo = sessionStorage.getItem('temp_user_info');
    if (!tempUserInfo) { router.push('/login'); return; }
    setUserDetails(JSON.parse(tempUserInfo));
  }, [router]);

  const validatePhone = (phone: string) => {
    const cleaned = phone.replace(/\s+/g, '');
    const phoneRegex = /^(\+254|254|0)?[17]\d{8}$/;
    return phoneRegex.test(cleaned);
  };

  const formatPhone = (phone: string) => {
    let cleaned = phone.replace(/\s+/g, '');
    if (cleaned.startsWith('+254')) return cleaned.substring(1);
    else if (cleaned.startsWith('0')) return '254' + cleaned.substring(1);
    else if (cleaned.startsWith('254')) return cleaned;
    else return '254' + cleaned;
  };

  const handleContinue = () => {
    if (!phone.trim()) { setError('Please enter your M-Pesa phone number'); return; }
    if (!validatePhone(phone)) { setError('Invalid phone number. Use format: 0712345678'); return; }
    const formattedPhone = formatPhone(phone);
    sessionStorage.setItem('temp_mpesa_phone', formattedPhone);
    router.push('/create-password');
  };

  if (!userDetails) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <div className="w-32 h-32 rounded-3xl bg-primary/20 flex items-center justify-center shadow-2xl">
            <Phone className="w-16 h-16 text-primary" strokeWidth={2.5} />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Set Up M-Pesa</h1>
          <p className="text-muted-foreground text-sm">Enter your M-Pesa phone number for withdrawals</p>
        </div>
        <div className="glass-effect rounded-2xl p-4 space-y-2">
          <p className="text-sm text-muted-foreground">📱 This number will be used to receive withdrawals</p>
          <p className="text-sm text-muted-foreground">✅ Make sure it's registered with M-Pesa</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">M-Pesa Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setError(''); }}
                placeholder="0712345678"
                className="w-full h-14 pl-12 pr-4 bg-input border border-border rounded-xl text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
            {error && <p className="text-destructive text-sm mt-2">{error}</p>}
          </div>
          <button
            onClick={handleContinue}
            className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold text-lg shadow-xl transition-all"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
