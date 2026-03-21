'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
export default function DerivConfirmationPage() {
  const router = useRouter();
  const [userDetails, setUserDetails] = useState<any>(null);
  useEffect(() => {
    const tempUserInfo = sessionStorage.getItem('temp_user_info');
    if (!tempUserInfo) {
      router.push('/login');
      return;
    }
    setUserDetails(JSON.parse(tempUserInfo));
  }, [router]);
  const handleConfirm = () => {
    router.push('/setup-mpesa');
  };
  const handleReject = () => {
    sessionStorage.clear();
    router.push('/login');
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
          <div className="w-32 h-32 rounded-3xl bg-success/20 flex items-center justify-center shadow-2xl">
            <CheckCircle className="w-16 h-16 text-success" strokeWidth={2.5} />
          </div>
        </div>
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-foreground">Welcome!</h1>
          <p className="text-muted-foreground">
            You have successfully signed in to Deriv.
            <br />
            Please confirm that these are your details.
          </p>
        </div>
        <div className="glass-effect rounded-2xl p-6 custom-shadow">
          <div className="text-center space-y-2">
            <p className="text-2xl font-bold text-foreground">{userDetails.fullname}</p>
            <p className="text-muted-foreground text-sm">{userDetails.email}</p>
            <p className="text-primary font-mono text-lg">{userDetails.loginid}</p>
          </div>
        </div>
        <div className="space-y-3">
          <button
            onClick={handleConfirm}
            className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-semibold text-lg shadow-xl transition-all"
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
