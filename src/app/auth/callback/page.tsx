'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CallbackContent() {
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
          throw new Error('Missing parameters');
        }

        // Store token
        localStorage.setItem('deriv_token1', token);
        localStorage.setItem('deriv_accounts', accounts);

        // Get user info via WebSocket
        const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=123981');

        const userInfo = await new Promise<any>((resolve, reject) => {
          const timeout = setTimeout(() => {
            ws.close();
            reject(new Error('Timeout'));
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
              });
            }
          };

          ws.onerror = () => {
            clearTimeout(timeout);
            ws.close();
            reject(new Error('Connection failed'));
          };
        });

        // Store user info
        localStorage.setItem('deriv_loginid', userInfo.loginid);
        localStorage.setItem('user_info', JSON.stringify({
          loginid: userInfo.loginid,
          email: userInfo.email,
          name: userInfo.fullname,
        }));

        // Save token to Redis
        await fetch('/api/user/save-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            account: userInfo.loginid,
            token: token,
          }),
        });

        setStatus('success');
        setTimeout(() => router.replace('/dashboard'), 1000);

      } catch (err:any) {
        console.error('Auth error:', err);
        setError(err.message);
        setStatus('error');
        setTimeout(() => router.replace('/login'), 2000);
      }
    };

    processAuth();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
      <div className="text-center space-y-6">
        {status === 'processing' && (
          <>
            <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
            <p className="text-white text-lg">Setting up your account...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <span className="text-3xl">✓</span>
            </div>
            <p className="text-white text-lg">Success! Redirecting...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto">
              <span className="text-3xl">✗</span>
            </div>
            <p className="text-white text-lg">Authentication failed</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
