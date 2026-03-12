// Deriv Payment Agent API Integration

interface TransferResult {
  success: boolean;
  transaction_id?: number;
  error?: string;
}

// Exchange rates (KES to USD)
export const EXCHANGE_RATES = {
  DEPOSIT: 130,   // User pays 130 KES per 1 USD
  WITHDRAW: 124,  // User receives 124 KES per 1 USD
};

// Calculate USD from KES
export function calculateUSD(kes: number, rate: number): number {
  return parseFloat((kes / rate).toFixed(2));
}

// Calculate KES from USD
export function calculateKES(usd: number, rate: number): number {
  return Math.round(usd * rate);
}

// Transfer funds to client via Deriv Payment Agent
export async function transferToClient(
  clientAccount: string,
  amountUSD: number
): Promise<TransferResult> {
  try {
    console.log('💸 Starting Deriv transfer:', {
      to: clientAccount,
      amount: amountUSD,
    });

    const apiToken = process.env.DERIV_PAYMENT_AGENT_TOKEN;
    const appId = process.env.NEXT_PUBLIC_DERIV_APP_ID;

    if (!apiToken) {
      throw new Error('DERIV_PAYMENT_AGENT_TOKEN not configured');
    }

    // Use Deriv's WebSocket endpoint via HTTP polling
    const wsUrl = `wss://ws.derivws.com/websockets/v3?app_id=${appId}`;
    
    // For serverless, we'll use the ws library
    const { WebSocket } = await import('ws');
    
    return new Promise((resolve) => {
      const ws = new WebSocket(wsUrl);
      const timeout = setTimeout(() => {
        ws.close();
        resolve({ success: false, error: 'Connection timeout' });
      }, 20000);

      let authorized = false;

      ws.on('open', () => {
        console.log('🔌 WebSocket connected, authorizing...');
        ws.send(JSON.stringify({ authorize: apiToken }));
      });

      ws.on('message', (data: any) => {
        const response = JSON.parse(data.toString());
        console.log('📥 Response:', response);

        if (response.error) {
          clearTimeout(timeout);
          ws.close();
          resolve({
            success: false,
            error: response.error.message,
          });
          return;
        }

        if (response.authorize && !authorized) {
          authorized = true;
          console.log('✅ Authorized, sending transfer...');
          
          // Send transfer request
          ws.send(JSON.stringify({
            paymentagent_transfer: 1,
            transfer_to: clientAccount,
            amount: amountUSD,
            currency: 'USD',
            description: 'M-Pesa deposit via ABEPAY',
          }));
        }

        if (response.paymentagent_transfer) {
          clearTimeout(timeout);
          ws.close();
          console.log('🎉 Transfer complete!');
          
          resolve({
            success: true,
            transaction_id: response.paymentagent_transfer.transaction_id,
          });
        }
      });

      ws.on('error', (error) => {
        clearTimeout(timeout);
        ws.close();
        resolve({
          success: false,
          error: error.message,
        });
      });
    });

  } catch (error: any) {
    console.error('💥 Transfer exception:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}


// Verify client account exists
export async function verifyDerivAccount(
  accountId: string
): Promise<{ valid: boolean; account?: any; error?: string }> {
  try {
    // This would verify the account exists in Deriv
    // For now, basic validation
    if (!accountId || accountId.length < 5) {
      return { valid: false, error: 'Invalid account ID' };
    }

    // TODO: Implement actual Deriv account verification
    // You'll need to use the Deriv API to check if the account exists

    return { valid: true };

  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}
