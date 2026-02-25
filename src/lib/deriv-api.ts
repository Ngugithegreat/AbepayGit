// Deriv Payment Agent API Integration
import WebSocket from 'ws';

interface DerivConfig {
  APP_ID: string;
  API_TOKEN: string;
  AGENT_ACCOUNT: string;
}

// Deriv API configuration
const DERIV_CONFIG: DerivConfig = {
  APP_ID: process.env.NEXT_PUBLIC_DERIV_APP_ID || '',
  API_TOKEN: process.env.DERIV_PAYMENT_AGENT_TOKEN || '',
  AGENT_ACCOUNT: process.env.DERIV_PAYMENT_AGENT_ACCOUNT || '',
};

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

// A helper function to manage a one-off WebSocket request to Deriv API
async function sendDerivRequest(request: object): Promise<any> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${DERIV_CONFIG.APP_ID}`);
    let responseReceived = false;

    const timeout = setTimeout(() => {
      if (!responseReceived) {
        ws.close();
        reject(new Error('Deriv API request timed out after 15 seconds.'));
      }
    }, 15000);

    ws.onopen = () => {
      // Authorize the payment agent
      ws.send(JSON.stringify({ authorize: DERIV_CONFIG.API_TOKEN }));
    };

    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);

      if (data.error) {
        responseReceived = true;
        clearTimeout(timeout);
        ws.close();
        return reject(new Error(data.error.message));
      }

      // Handle authorization response
      if (data.msg_type === 'authorize') {
        if (data.authorize.loginid !== DERIV_CONFIG.AGENT_ACCOUNT) {
          responseReceived = true;
          clearTimeout(timeout);
          ws.close();
          return reject(new Error('Payment Agent token does not match the configured agent account.'));
        }
        // Authorization successful, send the actual transfer request
        ws.send(JSON.stringify(request));
      }
      // Handle the actual request's response
      else if (data.req_id && data.req_id === (request as any).req_id) {
        responseReceived = true;
        clearTimeout(timeout);
        ws.close();
        resolve(data);
      }
    };

    ws.onerror = (err) => {
      if (!responseReceived) {
        responseReceived = true;
        clearTimeout(timeout);
        reject(err);
      }
    };

    ws.onclose = () => {
      if (!responseReceived) {
        clearTimeout(timeout);
        reject(new Error('WebSocket closed before a response was received.'));
      }
    };
  });
}

// Transfer funds to client via Deriv Payment Agent
export async function transferToClient(
  clientAccount: string,
  amountUSD: number,
  currency: string = 'USD'
): Promise<{ success: boolean; transaction_id?: number; error?: string }> {
  try {
    console.log('💸 Initiating Deriv transfer to client:', {
      account: clientAccount,
      amount: amountUSD,
      currency,
    });

    if (!DERIV_CONFIG.API_TOKEN || !DERIV_CONFIG.AGENT_ACCOUNT) {
      throw new Error('Deriv Payment Agent credentials not configured');
    }

    const transferRequest = {
      paymentagent_transfer: 1,
      transfer_to: clientAccount,
      amount: amountUSD,
      currency: currency,
      req_id: Math.floor(Date.now() / 1000), // Unique request ID
    };

    const data = await sendDerivRequest(transferRequest);

    if (data.error) {
      console.error('❌ Deriv transfer failed in response:', data.error);
      return { success: false, error: data.error.message };
    }

    if (data.paymentagent_transfer && data.paymentagent_transfer.transaction_id) {
        console.log('✅ Deriv transfer successful:', data.paymentagent_transfer);
        return {
          success: true,
          transaction_id: data.paymentagent_transfer.transaction_id,
        };
    }

    throw new Error('Transfer response did not contain expected data.');

  } catch (error: any) {
    console.error('💥 Deriv transfer error:', error);
    return { success: false, error: error.message };
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
