'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showTokenPrompt, setShowTokenPrompt] = useState(false);
  const [apiToken, setApiToken] = useState('');
  const [userData, setUserData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const token1 = searchParams.get('token1');
      
      if (token1) {
        try {
          // Get user data from our new API
          const response = await fetch('/api/deriv/get-user-info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: token1 }),
          });

          const data = await response.json();
          
          if (data.success) {
            // Store temporary token and user data to use in confirmation page
            localStorage.setItem('deriv_token', token1);
            localStorage.setItem('deriv_user', JSON.stringify(data.user));
            setUserData(data.user);
            setShowTokenPrompt(true);
          } else {
            setError(data.error || 'Failed to retrieve user information.');
          }
        } catch (e: any) {
          setError(e.message || 'An unexpected error occurred.');
        } finally {
          setIsProcessing(false);
        }
      } else {
         setError('Authentication failed. No token received from Deriv.');
         setIsProcessing(false);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  const handleTokenSubmit = async () => {
    if (!apiToken || !userData) return;
    setIsProcessing(true);
    setError('');

    try {
        // Store the user's API token
        const response = await fetch('/api/user/store-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                account: userData.loginid,
                token: apiToken,
                email: userData.email,
                name: userData.fullname,
            }),
        });

        const data = await response.json();

        if (data.success) {
            // Also store the user's API token in localStorage for the auth context to pick up
            localStorage.setItem('user_api_token', apiToken);
            router.push('/deriv-confirmation');
        } else {
            setError(data.error || 'Failed to store token.');
        }
    } catch (e: any) {
        setError(e.message || 'An unexpected error occurred.');
    } finally {
        setIsProcessing(false);
    }
  };
  
  if (isProcessing && !showTokenPrompt) {
      return (
          <div className="min-h-screen bg-black flex items-center justify-center">
              <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
                  <p className="text-white">Authorizing with Deriv...</p>
              </div>
          </div>
      );
  }

  if (error) {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-red-900/50 border border-red-700 rounded-2xl p-8 space-y-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Authentication Failed</h2>
                    <p className="text-red-300">{error}</p>
                </div>
                <button
                    onClick={() => router.push('/login')}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold"
                >
                    Back to Login
                </button>
            </div>
        </div>
    )
  }

  if (showTokenPrompt) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-gray-900 rounded-2xl p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">
              One More Step!
            </h2>
            <p className="text-gray-400 text-sm">
              Create an API token so we can access your account balance
            </p>
          </div>

          <div className="bg-blue-900/30 rounded-xl p-4 space-y-3 text-sm text-gray-300">
            <p className="font-semibold text-white">How to create an API token:</p>
            <ol className="space-y-2 list-decimal list-inside">
              <li>Go to Deriv.com → Settings → API Token</li>
              <li>Click "Create new token"</li>
              <li>Enable: Read, Trading, Payments</li>
              <li>Copy the token and paste below</li>
            </ol>
            <a
              href="https://app.deriv.com/account/api-token"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium mt-3"
            >
              Open API Token Page →
            </a>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Paste Your API Token
            </label>
            <input
              type="text"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="Enter your Deriv API token"
              className="w-full h-12 px-4 bg-gray-800 border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button
            onClick={handleTokenSubmit}
            disabled={!apiToken || isProcessing}
            className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:from-gray-700 disabled:to-gray-700 text-white rounded-xl font-semibold flex items-center justify-center"
          >
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Continue'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-900">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
        <p className="text-xl text-slate-300">Completing login...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-slate-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-xl text-slate-300">Loading Authentication...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
