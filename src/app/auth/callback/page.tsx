'use client';

import { useEffect, useState, useRef } from 'react';
import { Loader2, AlertCircle, Clock } from 'lucide-react';

export default function AuthCallbackPage() {
  const [message, setMessage] = useState('Processing authentication...');
  const [error, setError] = useState<string | null>(null);
  const [isRateLimit, setIsRateLimit] = useState(false);
  const hasRun = useRef(false);

  useEffect(() => {
    // Prevent double execution in development
    if (hasRun.current) return;
    hasRun.current = true;

    console.log('🔥 === CALLBACK PAGE LOADED ===');
    console.log('📍 URL:', window.location.href);

    try {
      // Extract token from URL hash
      const hash = window.location.hash.substring(1);
      console.log('🔗 Hash:', hash);

      const params = new URLSearchParams(hash);
      const token = params.get('token');
      const callbackError = params.get('error');

      console.log('🎫 Has token:', !!token);
      console.log('❌ Has error:', !!callbackError);

      // Handle errors from Deriv
      if (callbackError) {
        console.error('💥 Deriv returned error:', callbackError);
        
        // Check if it's a rate limit error
        const isRateLimitError = 
          callbackError.toLowerCase().includes('blocked') ||
          callbackError.toLowerCase().includes('approved a login') ||
          callbackError.toLowerCase().includes('few moments');

        if (isRateLimitError) {
          setIsRateLimit(true);
          setMessage('Too many login attempts. Please wait 2-3 minutes.');
        } else {
          setError(callbackError);
          setMessage('Authentication failed');
        }
        
        // Clean URL
        window.history.replaceState(null, '', '/auth/callback');
        return;
      }

      // No token found
      if (!token) {
        console.error('💥 No token in URL');
        setError('No token received');
        setMessage('Authentication failed - no token');
        window.history.replaceState(null, '', '/auth/callback');
        return;
      }

      // SUCCESS - Save token
      console.log('💾 Saving token to localStorage...');
      console.log('🔑 Token preview:', token.substring(0, 20) + '...');
      
      localStorage.setItem('deriv_token', token);
      
      // Verify it saved
      const saved = localStorage.getItem('deriv_token');
      if (saved !== token) {
        console.error('💥 Token failed to save!');
        setError('Storage error');
        setMessage('Failed to save authentication');
        return;
      }

      console.log('✅ Token saved successfully');
      
      // Clean URL
      window.history.replaceState(null, '', '/auth/callback');
      
      setMessage('Success! Redirecting to dashboard...');
      
      // Redirect after brief delay
      setTimeout(() => {
        console.log('🚀 Redirecting to dashboard...');
        window.location.href = '/dashboard';
      }, 800);

    } catch (err: any) {
      console.error('💥 Callback error:', err);
      setError(err.message || 'Unknown error');
      setMessage('An error occurred');
    }
  }, []);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-6 p-4 bg-slate-900">
      {isRateLimit ? (
        <div className="max-w-md space-y-6 glass-effect rounded-xl p-8">
          <div className="flex justify-center">
            <div className="bg-yellow-500/20 p-4 rounded-full">
              <Clock className="h-12 w-12 text-yellow-500" />
            </div>
          </div>
          
          <div className="space-y-3 text-center">
            <h2 className="text-2xl font-bold text-white">Please Wait</h2>
            <p className="text-slate-300">
              Multiple login attempts detected
            </p>
            <p className="text-slate-400 text-sm">
              For security, please wait 2-3 minutes before trying again
            </p>
          </div>

          <button
            onClick={() => { window.location.href = '/login'; }}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
          >
            Back to Login
          </button>
        </div>
      ) : error ? (
        <div className="max-w-md space-y-6 glass-effect rounded-xl p-8">
          <div className="flex justify-center">
            <div className="bg-red-500/20 p-4 rounded-full">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
          </div>
          
          <div className="space-y-3 text-center">
            <h2 className="text-2xl font-bold text-white">Authentication Failed</h2>
            <p className="text-slate-300">{message}</p>
            <p className="text-slate-500 text-xs">{error}</p>
          </div>

          <button
            onClick={() => { window.location.href = '/login'; }}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="space-y-4 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
          <p className="text-xl text-slate-300">{message}</p>
        </div>
      )}
    </div>
  );
}
