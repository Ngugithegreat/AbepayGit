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
    return /^(\+254|254|0)?[17]\d{8}$/.test(cleaned);
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
    sessionStorage.setItem('temp_mpesa_phone', formatPhone(phone));
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

        {/* Glowing Icon */}
        <div className="flex justify-center">
          <div className="relative">
            {/* Outer glow */}
            <div className="absolute inset-0 rounded-3xl bg-secondary/20 blur-2xl scale-150" />
            {/* Floating dots */}
            <div className="absolute -top-3 -right-3 w-3 h-3 rounded-full bg-primary/60 animate-pulse" />
            <div className="absolute -bottom-2 -left-4 w-2 h-2 rounded-full bg-secondary/70 animate-pulse" style={{ animationDelay: '0.5s' }} />
            <div className="absolute top-1/2 -right-6 w-2 h-2 rounded-full bg-accent/60 animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute -top-5 left-4 w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: '1.5s' }} />
            {/* Main icon */}
            <div className="relative w-32 h-32 rounded-3xl bg-gradient-to-br from-secondary/80 to-secondary flex items-center justify-center shadow-2xl" style={{ boxShadow: '0 0 40px rgba(14, 165, 233, 0.4)' }}>
              <Phone className="w-16 h-16 text-white" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Set Up M-Pesa</h1>
          <p className="text-muted-foreground text-sm">Enter your M-Pesa number for withdrawals</p>
        </div>

        {/* Info card */}
        <div className="glass-effect rounded-2xl p-4 space-y-2">
          <p className="text-sm text-muted-foreground">📱 This number will be used to receive withdrawals</p>
          <p className="text-sm text-muted-foreground">✅ Make sure it's registered with M-Pesa</p>
        </div>

        {/* Input */}
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
            className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold text-lg transition-all"
            style={{ boxShadow: '0 0 20px rgba(139, 92, 246, 0.35)' }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
