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
      <h1 className="text-3xl font-bold mb-6 text-foreground">M-Pesa Setup</h1>
      
      <Card className="p-6 mb-6 bg-card border-border">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Register Callback URLs</h2>
        <p className="text-muted-foreground mb-4">
          This will register your callback URLs with Safaricom so they know where to send payment notifications.
        </p>
        
        <div className="space-y-2 mb-6 text-muted-foreground">
          <div>
            <strong>Confirmation URL:</strong>
            <br />
            <code className="text-sm bg-muted border border-border p-1 rounded">
              https://abepay-git-auib.vercel.app/api/mpesa/callback
            </code>
          </div>
          <div>
            <strong>Validation URL:</strong>
            <br />
            <code className="text-sm bg-muted border border-border p-1 rounded">
              https://abepay-git-auib.vercel.app/api/mpesa/validate
            </code>
          </div>
        </div>

        <Button 
          onClick={registerURLs} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Registering...' : 'Register URLs with Safaricom'}
        </Button>
      </Card>

      {result && (
        <Card className={`p-6 ${result.success ? 'bg-success/10 border-success/30' : 'bg-destructive/10 border-destructive/30'}`}>
          <h3 className={`font-semibold mb-2 ${result.success ? 'text-success' : 'text-destructive'}`}>
            {result.success ? '✅ Success!' : '❌ Error'}
          </h3>
          <pre className="text-sm overflow-auto text-foreground">
            {JSON.stringify(result, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}
