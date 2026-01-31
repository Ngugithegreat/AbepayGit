'use client';

import { useEffect, useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const [message, setMessage] = useState('Processing authentication...');
  const [error, setError] = useState<string | null>(null);
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = () => {
      try {
        console.log('🔥 CALLBACK STARTED');
        console.log('📍 Current URL:', window.location.href);
        console.log('🔗 Hash:', window.location.hash);
        
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        const token = hashParams.get('token');
        const callbackError = hashParams.get('error');

        console.log('🎫 Token exists:', !!token);
        console.log('❌ Error exists:', !!callbackError);

        if (callbackError) {
          console.error('💥 Deriv error:', callbackError);
          setError(callbackError);
          setMessage('Authentication failed: ' + callbackError);
          return;
        }

        if (!token) {
          console.error('💥 No token in URL');
          setError('No token found');
          setMessage('No authentication token found');
          return;
        }

        console.log('💾 Saving token to localStorage...');
        console.log('🔑 Token (first 20 chars):', token.substring(0, 20) + '...');
        
        // Save token
        localStorage.setItem('deriv_token', token);
        
        // Verify it was saved
        const saved = localStorage.getItem('deriv_token');
        console.log('✅ Token saved?', saved === token);
        
        setMessage('Token saved! Redirecting in 2 seconds...');
        
        // Hard redirect after 2 seconds
        setTimeout(() => {
          console.log('🚀 Redirecting to /dashboard');
          window.location.href = '/dashboard';
        }, 2000);
        
      } catch (e: any) {
        console.error('💥 CALLBACK ERROR:', e);
        setError(e.message);
        setMessage('Error: ' + e.message);
      }
    };

    processAuth();
  }, []);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 p-4 text-center bg-slate-900">
      <div className={`flex items-center gap-2 ${error ? 'text-red-400' : 'text-slate-300'}`}>
        {!error && <Loader2 className="h-6 w-6 animate-spin" />}
        <span className="text-lg">{message}</span>
      </div>
      {error && (
        <div className="text-sm text-slate-500 space-y-2">
          <p>Error: {error}</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Back to Login
          </button>
        </div>
      )}
      <div className="mt-4 text-xs text-slate-600 max-w-md">
        <p>Check your browser console (F12) for detailed logs</p>
      </div>
    </div>
  );
}
