
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    const handleAuth = async () => {
      const token1 = searchParams.get('token1');
      const accounts = searchParams.get('acct1');

      if (!token1 || !accounts) {
        setStatus('error');
        setTimeout(() => router.push('/login'), 2000);
        return;
      }

      try {
        console.log('🔐 Storing auth data...');

        // Just store directly in localStorage - NO API CALLS
        localStorage.setItem('deriv_token1', token1);
        localStorage.setItem('deriv_accounts', accounts);

        // Get user info ONCE
        const { WebSocket } = (await import('ws')) as any;
        const ws = new WebSocket(
          `wss://ws.derivws.com/websockets/v3?app_id=${process.env.NEXT_PUBLIC_DERIV_APP_ID}`
        );

        const userInfo = await new Promise<any>((resolve, reject) => {
          const timeout = setTimeout(() => {
            ws.close();
            reject(new Error('Timeout'));
          }, 10000);

          ws.on('open', () => {
            ws.send(JSON.stringify({ authorize: token1 }));
          });

          ws.on('message', (data: any) => {
            const response = JSON.parse(data.toString());

            if (response.error) {
              clearTimeout(timeout);
              ws.close();
              reject(new Error(response.error.message));
              return;
            }

            if (response.authorize) {
              clearTimeout(timeout);
              ws.close();
              resolve({
                loginid: response.authorize.loginid,
                email: response.authorize.email,
                fullname: response.authorize.fullname,
                balance: response.authorize.balance,
              });
            }
          });

          ws.on('error', (error: any) => {
            clearTimeout(timeout);
            ws.close();
            reject(error);
          });
        });

        // Store user info
        localStorage.setItem('deriv_loginid', userInfo.loginid);
        localStorage.setItem('user_info', JSON.stringify({
          loginid: userInfo.loginid,
          email: userInfo.email,
          name: userInfo.fullname,
        }));

        // Store token in Redis for balance fetching
        await fetch('/api/user/store-token-simple', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            account: userInfo.loginid,
            token: token1,
          }),
        });

        console.log('✅ Auth complete!');
        setStatus('success');

        // Redirect to dashboard
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);

      } catch (error: any) {
        console.error('❌ Auth error:', error);
        setStatus('error');
        setTimeout(() => router.push('/login'), 2000);
      }
    };

    handleAuth();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
      <div className="text-center space-y-6">
        {status === 'processing' && (
          <>
            <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
            <p className="text-white text-xl">Setting up your account...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <span className="text-3xl">✓</span>
            </div>
            <p className="text-white text-xl">Success!</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto">
              <span className="text-3xl">✗</span>
            </div>
            <p className="text-white text-xl">Authentication failed</p>
          </>
        )}
      </div>
    </div>
  );
}
