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

    if (!apiToken) {
      throw new Error('Deriv API credentials not configured');
    }

    // Use Deriv's HTTP API (more reliable for serverless)
    const response = await fetch('https://api.deriv.com/v1/payment_agent/transfer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        paymentagent_transfer: 1,
        transfer_to: clientAccount,
        amount: amountUSD,
        currency: 'USD',
      }),
      signal: AbortSignal.timeout(15000), // 15 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Deriv API error:', errorText);
      throw new Error(`Deriv API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (data.error) {
      console.error('❌ Deriv transfer error:', data.error);
      return {
        success: false,
        error: data.error.message || 'Transfer failed',
      };
    }
    
    if (data.paymentagent_transfer?.transaction_id) {
        console.log('✅ Deriv transfer successful:', data);
        return {
          success: true,
          transaction_id: data.paymentagent_transfer.transaction_id,
        };
    }

    throw new Error('Transfer response did not contain expected data.');


  } catch (error: any) {
    console.error('💥 Transfer exception:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
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
