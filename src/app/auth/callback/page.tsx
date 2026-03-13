'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState('');

  useEffect(() => {
    const processAuth = async () => {
      try {
        const token = searchParams.get('token1');
        const accounts = searchParams.get('acct1');

        if (!token || !accounts) {
          throw new Error('Missing auth parameters');
        }

        console.log('🔐 Processing authentication...');

        // Store token immediately
        localStorage.setItem('deriv_token1', token);
        localStorage.setItem('deriv_accounts', accounts);

        // Fetch user info from Deriv directly
        const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=123981');

        const userInfo = await new Promise<any>((resolve, reject) => {
          const timeout = setTimeout(() => {
            ws.close();
            reject(new Error('Connection timeout'));
          }, 10000);

          ws.onopen = () => {
            ws.send(JSON.stringify({ authorize: token }));
          };

          ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.error) {
              clearTimeout(timeout);
              ws.close();
              reject(new Error(data.error.message));
              return;
            }

            if (data.authorize) {
              clearTimeout(timeout);
              ws.close();
              resolve({
                loginid: data.authorize.loginid,
                email: data.authorize.email,
                fullname: data.authorize.fullname,
                balance: data.authorize.balance,
              });
            }
          };

          ws.onerror = () => {
            ws.close();
            reject(new Error('WebSocket connection failed'));
          };
        });

        // Store user info
        localStorage.setItem('deriv_loginid', userInfo.loginid);
        localStorage.setItem('user_info', JSON.stringify({
          loginid: userInfo.loginid,
          email: userInfo.email,
          name: userInfo.fullname,
        }));

        // Store token in Redis for balance API
        await fetch('/api/user/save-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            account: userInfo.loginid,
            token: token,
          }),
        });

        console.log('✅ Authentication successful!');
        setStatus('success');

        // Redirect after short delay
        setTimeout(() => {
          router.replace('/dashboard');
        }, 1000);

      } catch (err: any) {
        console.error('❌ Auth error:', err);
        setError(err.message);
        setStatus('error');
        
        setTimeout(() => {
          router.replace('/login');
        }, 3000);
      }
    };

    processAuth();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center p-6">
      <div className="text-center space-y-6">
        {status === 'processing' && (
          <>
            <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
            <p className="text-white text-lg">Setting up your account...</p>
            <p className="text-white/60 text-sm">Please wait</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-white text-lg font-semibold">Success!</p>
            <p className="text-white/60 text-sm">Redirecting...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-white text-lg font-semibold">Authentication Failed</p>
            <p className="text-white/60 text-sm">{error}</p>
            <p className="text-white/40 text-xs">Redirecting to login...</p>
          </>
        )}
      </div>
    </div>
  );
}
