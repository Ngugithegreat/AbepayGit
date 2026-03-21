'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';

export default function DerivConfirmationPage() {
  const router = useRouter();
  const [userDetails, setUserDetails] = useState<any>(null);

  useEffect(() => {
    const tempUserInfo = sessionStorage.getItem('temp_user_info');
    if (!tempUserInfo) { router.push('/login'); return; }
    setUserDetails(JSON.parse(tempUserInfo));
  }, [router]);

  const handleConfirm = () => { router.push('/setup-mpesa'); };
  const handleReject = () => { sessionStorage.clear(); router.push('/login'); };

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
            {/* Outer glow ring */}
            <div className="absolute inset-0 rounded-3xl bg-success/20 blur-2xl scale-150" />
            {/* Subtle floating dots */}
            <div className="absolute -top-3 -right-3 w-3 h-3 rounded-full bg-primary/60 animate-pulse" />
            <div className="absolute -bottom-2 -left-4 w-2 h-2 rounded-full bg-success/70 animate-pulse" style={{ animationDelay: '0.5s' }} />
            <div className="absolute top-1/2 -right-6 w-2 h-2 rounded-full bg-warning/60 animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute -top-5 left-4 w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: '1.5s' }} />
            {/* Main icon box */}
            <div className="relative w-32 h-32 rounded-3xl bg-gradient-to-br from-success/80 to-success flex items-center justify-center shadow-2xl" style={{ boxShadow: '0 0 40px rgba(34, 197, 94, 0.4)' }}>
              <CheckCircle className="w-16 h-16 text-white" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-foreground">Welcome!</h1>
          <p className="text-muted-foreground">
            You have successfully signed in to Deriv.
            <br />Please confirm that these are your details.
          </p>
        </div>

        {/* User Details Card */}
        <div className="glass-effect rounded-2xl p-6 custom-shadow">
          <div className="text-center space-y-2">
            <p className="text-2xl font-bold text-foreground">{userDetails.fullname}</p>
            <p className="text-muted-foreground text-sm">{userDetails.email}</p>
            <p className="text-primary font-mono text-lg font-semibold">{userDetails.loginid}</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleConfirm}
            className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-semibold text-lg transition-all"
            style={{ boxShadow: '0 0 20px rgba(139, 92, 246, 0.35)' }}
          >
            These are my details!
          </button>
          <button
            onClick={handleReject}
            className="w-full h-12 text-muted-foreground hover:text-foreground font-medium transition-colors"
          >
            Not my details!
          </button>
        </div>
      </div>
    </div>
  );
}
