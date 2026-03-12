import { put, get, del, list } from '@vercel/blob';

interface PendingDeposit {
  checkoutRequestID: string;
  derivAccount: string;
  phoneNumber: string;
  kesAmount: number;
  timestamp: number;
}

// Store pending deposit
export async function storePendingDeposit(deposit: PendingDeposit) {
  try {
    const key = `pending-${deposit.checkoutRequestID}.json`;
    
    await put(key, JSON.stringify(deposit), {
      access: 'public',
      addRandomSuffix: false,
    });
    
    console.log('📝 Stored pending deposit in Blob:', deposit.checkoutRequestID);
  } catch (error) {
    console.error('Failed to store pending deposit:', error);
    throw error;
  }
}

// Get pending deposit
export async function getPendingDeposit(
  checkoutRequestID: string
): Promise<PendingDeposit | null> {
  try {
    const key = `pending-${checkoutRequestID}.json`;
    
    const blob = await get(key);
    
    if (!blob) {
      console.log('❌ No pending deposit found for:', checkoutRequestID);
      return null;
    }

    const text = await blob.text();
    const deposit = JSON.parse(text) as PendingDeposit;
    
    console.log('✅ Found pending deposit:', deposit);
    return deposit;
  } catch (error) {
    console.error('Failed to get pending deposit:', error);
    return null;
  }
}

// Remove pending deposit
export async function removePendingDeposit(checkoutRequestID: string) {
  try {
    const key = `pending-${checkoutRequestID}.json`;
    
    await del(key);
    
    console.log('🗑️ Removed pending deposit:', checkoutRequestID);
  } catch (error) {
    console.error('Failed to remove pending deposit:', error);
  }
}

// Get all pending deposits (for admin)
export async function getAllPendingDeposits(): Promise<PendingDeposit[]> {
  try {
    const { blobs } = await list({ prefix: 'pending-' });
    const deposits: PendingDeposit[] = [];

    for (const blob of blobs) {
      try {
        const response = await fetch(blob.url);
        const text = await response.text();
        const deposit = JSON.parse(text) as PendingDeposit;
        deposits.push(deposit);
      } catch (error) {
        console.error('Failed to parse deposit:', error);
      }
    }

    return deposits;
  } catch (error) {
    console.error('Failed to get all pending deposits:', error);
    return [];
  }
}
