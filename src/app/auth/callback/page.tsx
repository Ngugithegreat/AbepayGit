
export const dynamic = 'force-dynamic';

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    const processAuth = async () => {
      try {
        const token = searchParams.get('token1');
        const accounts = searchParams.get('acct1');

        if (!token || !accounts) {
          throw new Error('Missing parameters');
        }

        console.log('🔐 Processing OAuth callback...');

        // Store token temporarily
        sessionStorage.setItem('temp_oauth_token', token);
        sessionStorage.setItem('temp_oauth_accounts', accounts);

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
                balance: data.authorize.balance,
              });
            }
          };

          ws.onerror = () => {
            clearTimeout(timeout);
            ws.close();
            reject(new Error('Connection failed'));
          };
        });

        // Store user info temporarily
        sessionStorage.setItem('temp_user_info', JSON.stringify(userInfo));

        console.log('✅ User info fetched, redirecting to confirmation...');
        setStatus('success');

        // Redirect to confirmation page
        setTimeout(() => {
          router.push('/deriv-confirmation');
        }, 500);

      } catch (err) {
        console.error('❌ Auth error:', err);
        setStatus('error');
        setTimeout(() => router.push('/login'), 2000);
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
            <p className="text-white text-lg">Connecting to Deriv...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <span className="text-3xl">✓</span>
            </div>
            <p className="text-white text-lg">Connected! Setting up...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto">
              <span className="text-3xl">✗</span>
            </div>
            <p className="text-white text-lg">Connection failed</p>
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

    