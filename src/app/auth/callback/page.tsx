'use client';

import { useEffect, useState, useRef } from 'react';
import { Loader2, AlertCircle, Clock } from 'lucide-react';

export default function AuthCallbackPage() {
  const [message, setMessage] = useState('Processing authentication...');
  const [error, setError] = useState<string | null>(null);
  const [isRateLimit, setIsRateLimit] = useState(false);
  const hasProcessed = useRef(false);

  useEffect(() => {
    // CRITICAL: Only run once
    if (hasProcessed.current) {
      console.log("⚠️ Callback already processed, skipping");
      return;
    }
    hasProcessed.current = true;

    const processAuth = () => {
      try {
        console.log('🔥 CALLBACK STARTED');
        
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        const token = hashParams.get('token');
        const callbackError = hashParams.get('error');

        // Immediately clean the URL for security
        window.history.replaceState(null, '', window.location.pathname);

        console.log('🎫 Token exists:', !!token);
        console.log('❌ Error exists:', !!callbackError);

        if (callbackError) {
          console.error('💥 Deriv error:', callbackError);
          
          if (callbackError.toLowerCase().includes('blocked') || 
              callbackError.toLowerCase().includes('approved a login') ||
              callbackError.toLowerCase().includes('few moments ago')) {
            setIsRateLimit(true);
            setError('Rate limit');
            setMessage('Please wait before trying again');
          } else {
            setError(callbackError);
            setMessage('Authentication failed');
          }
          return;
        }

        if (!token) {
          console.error('💥 No token in URL');
          setError('No token found');
          setMessage('No authentication token found');
          return;
        }

        console.log('💾 Saving token...');
        
        // CRITICAL: Only save token, don't call any auth functions
        localStorage.setItem('deriv_token', token);
        
        const saved = localStorage.getItem('deriv_token');
        console.log('✅ Token saved:', saved === token);
        
        setMessage('Authentication successful! Redirecting...');
        
        // CRITICAL: Use hard redirect, not router
        setTimeout(() => {
          console.log('🚀 Redirecting to /dashboard');
          window.location.href = '/dashboard';
        }, 500); // A small delay can help ensure localStorage has persisted
        
      } catch (e: any) {
        console.error('💥 CALLBACK ERROR:', e);
        setError(e.message);
        setMessage('Error: ' + e.message);
      }
    };

    processAuth();
  }, []); // Empty deps array - run ONCE

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-6 p-4 text-center bg-slate-900">
      {isRateLimit ? (
        <div className="max-w-md space-y-6 glass-effect rounded-xl p-8 custom-shadow">
          <div className="flex justify-center">
            <div className="bg-yellow-500/20 p-4 rounded-full">
              <Clock className="h-12 w-12 text-yellow-500" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Please Wait</h2>
            <p className="text-slate-300">
              Multiple login attempts were detected.
            </p>
            <p className="text-slate-400 text-sm">
              To protect your account, please wait 2-3 minutes before trying again.
            </p>
          </div>

          <button
            onClick={() => window.location.href = '/login'}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
          >
            Back to Login
          </button>
        </div>
      ) : error ? (
        <div className="max-w-md space-y-6 glass-effect rounded-xl p-8 custom-shadow">
          <div className="flex justify-center">
            <div className="bg-red-500/20 p-4 rounded-full">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Authentication Failed</h2>
            <p className="text-slate-300">{message}</p>
          </div>

          <button
            onClick={() => window.location.href = '/login'}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
          >
            Back to Login
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-slate-300">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-xl">{message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
