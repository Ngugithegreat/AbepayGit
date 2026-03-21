'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';

export default function DerivConfirmationPage() {
  const router = useRouter();
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

  const handleConfirm = () => {
    // User confirmed their details - go to M-Pesa setup
    router.push('/setup-mpesa');
  };

  const handleReject = () => {
    // Clear temp data and go back to login
    sessionStorage.clear();
    router.push('/login');
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
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-2xl">
              <CheckCircle className="w-16 h-16 text-white" strokeWidth={2.5} />
            </div>
            {/* Decorative elements */}
            <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-white/20" />
            <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-green-500/40" />
            <div className="absolute top-1/2 -right-8 w-4 h-4 rounded-full bg-yellow-400/60" />
            <div className="absolute -top-6 right-4 w-3 h-3 rounded-full bg-white/30" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-white">
            Welcome!
          </h1>
          <p className="text-white/80">
            You have successfully signed in to Deriv.
            <br />
            Please confirm that these are your details.
          </p>
        </div>

        {/* User Details */}
        <div className="space-y-4 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
          <div className="text-center space-y-2">
            <p className="text-2xl font-bold text-white">
              {userDetails.fullname}
            </p>
            <p className="text-white/80 text-sm">
              {userDetails.email}
            </p>
            <p className="text-green-400 font-mono text-lg">
              {userDetails.loginid}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleConfirm}
            className="w-full h-14 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-2xl font-semibold text-lg shadow-xl transition-all"
          >
            These are my details!
          </button>

          <button
            onClick={handleReject}
            className="w-full h-12 text-white/80 hover:text-white font-medium"
          >
            Not my details!
          </button>
        </div>
      </div>
    </div>
  );
}
