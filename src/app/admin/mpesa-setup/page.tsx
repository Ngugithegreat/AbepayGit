'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function MpesaSetupPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const registerURLs = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/mpesa/register-urls', {
        method: 'POST',
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-white">M-Pesa Setup</h1>
      
      <Card className="p-6 mb-6 bg-slate-800 border-slate-700">
        <h2 className="text-xl font-semibold mb-4 text-white">Register Callback URLs</h2>
        <p className="text-gray-400 mb-4">
          This will register your callback URLs with Safaricom so they know where to send payment notifications.
        </p>
        
        <div className="space-y-2 mb-6 text-gray-300">
          <div>
            <strong>Confirmation URL:</strong>
            <br />
            <code className="text-sm bg-slate-700 border border-slate-600 p-1 rounded">
              https://abepay-git-auib.vercel.app/api/mpesa/callback
            </code>
          </div>
          <div>
            <strong>Validation URL:</strong>
            <br />
            <code className="text-sm bg-slate-700 border border-slate-600 p-1 rounded">
              https://abepay-git-auib.vercel.app/api/mpesa/validate
            </code>
          </div>
        </div>

        <Button 
          onClick={registerURLs} 
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {loading ? 'Registering...' : 'Register URLs with Safaricom'}
        </Button>
      </Card>

      {result && (
        <Card className={`p-6 ${result.success ? 'bg-green-900/50 border-green-700' : 'bg-red-900/50 border-red-700'}`}>
          <h3 className={`font-semibold mb-2 ${result.success ? 'text-green-300' : 'text-red-300'}`}>
            {result.success ? '✅ Success!' : '❌ Error'}
          </h3>
          <pre className="text-sm overflow-auto text-white">
            {JSON.stringify(result, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}
