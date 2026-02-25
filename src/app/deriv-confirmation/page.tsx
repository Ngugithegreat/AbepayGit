
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { CheckCircle, Loader2 } from 'lucide-react';

function ConfirmationContent() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [userDetails, setUserDetails] = useState({
    name: '',
    email: '',
    account: '',
  });

  useEffect(() => {
    if (user) {
      setUserDetails({
        name: user.fullname || 'User',
        email: user.email || '',
        account: user.loginid || '',
      });
    }
  }, [user]);

  const handleConfirm = () => {
    // Save user details
    localStorage.setItem('user_name', userDetails.name);
    localStorage.setItem('user_email', userDetails.email);
    localStorage.setItem('user_account', userDetails.account);
    
    // Go to create password
    router.push('/create-password');
  };

  const handleReject = () => {
    // Go back to login
    router.push('/login');
  };

  if (isLoading || !user) {
     return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-xl text-slate-300">Fetching your Deriv details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="w-full max-w-md space-y-8">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-purple-600 to-purple-500 flex items-center justify-center shadow-2xl">
              <CheckCircle className="w-16 h-16 text-white" strokeWidth={2.5} />
            </div>
            {/* Decorative elements */}
            <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-white/20" />
            <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-purple-400/40" />
            <div className="absolute top-1/2 -right-8 w-4 h-4 rounded-full bg-orange-400/60" />
            <div className="absolute -top-6 right-4 w-3 h-3 rounded-full bg-white/30" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-white">
            Welcome!
          </h1>
          <p className="text-gray-400">
            You have successfully signed in to Deriv.
            <br />
            Please confirm that these are your details.
          </p>
        </div>

        {/* User Details */}
        <div className="space-y-4 bg-gray-900 rounded-2xl p-6">
          <div className="text-center space-y-2">
            <p className="text-2xl font-bold text-white">
              {userDetails.name}
            </p>
            <p className="text-gray-400 text-sm">
              {userDetails.email}
            </p>
            <p className="text-purple-400 font-mono text-lg">
              {userDetails.account}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleConfirm}
            className="w-full h-14 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white rounded-2xl font-semibold text-lg shadow-xl transition-all"
          >
            These are my details!
          </button>

          <button
            onClick={handleReject}
            className="w-full h-12 text-purple-400 hover:text-purple-300 font-medium"
          >
            Not my details!
          </button>
        </div>
      </div>
    </div>
  );
}


export default function DerivConfirmationPage() {
    return (
        <Suspense>
            <ConfirmationContent />
        </Suspense>
    )
}
