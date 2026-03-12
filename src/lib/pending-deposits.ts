import { kv } from '@vercel/kv';

interface PendingDeposit {
  checkoutRequestID: string;
  derivAccount: string;
  phoneNumber: string;
  kesAmount: number;
  timestamp: number;
}

// Store pending deposit (expires after 1 hour)
export async function storePendingDeposit(deposit: PendingDeposit) {
  try {
    await kv.set(
      `pending:${deposit.checkoutRequestID}`,
      JSON.stringify(deposit),
      { ex: 3600 } // Expire after 1 hour
    );
    console.log('📝 Stored pending deposit in KV:', deposit.checkoutRequestID);
  } catch (error) {
    console.error('Failed to store pending deposit:', error);
  }
}

// Get pending deposit
export async function getPendingDeposit(
  checkoutRequestID: string
): Promise<PendingDeposit | null> {
  try {
    const data = await kv.get(`pending:${checkoutRequestID}`);
    
    if (!data) {
      console.log('❌ No pending deposit found for:', checkoutRequestID);
      return null;
    }

    const deposit = typeof data === 'string' ? JSON.parse(data) : data;
    console.log('✅ Found pending deposit:', deposit);
    return deposit as PendingDeposit;
  } catch (error) {
    console.error('Failed to get pending deposit:', error);
    return null;
  }
}

// Remove pending deposit
export async function removePendingDeposit(checkoutRequestID: string) {
  try {
    await kv.del(`pending:${checkoutRequestID}`);
    console.log('🗑️ Removed pending deposit:', checkoutRequestID);
  } catch (error) {
    console.error('Failed to remove pending deposit:', error);
  }
}

// Get all pending deposits (for admin)
export async function getAllPendingDeposits(): Promise<PendingDeposit[]> {
  try {
    const keys = await kv.keys('pending:*');
    const deposits: PendingDeposit[] = [];

    for (const key of keys) {
      const data = await kv.get(key);
      if (data) {
        const deposit = typeof data === 'string' ? JSON.parse(data) : data;
        deposits.push(deposit as PendingDeposit);
      }
    }

    return deposits;
  } catch (error) {
    console.error('Failed to get all pending deposits:', error);
    return [];
  }
}
