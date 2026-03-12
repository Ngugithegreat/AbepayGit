import { put, del, list } from '@vercel/blob';

interface PendingDeposit {
  checkoutRequestID: string;
  derivAccount: string;
  phoneNumber: string;
  kesAmount: number;
  timestamp: number;
}

// Get blob token from environment
function getBlobToken() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error('BLOB_READ_WRITE_TOKEN not configured');
  }
  return token;
}

// Store pending deposit
export async function storePendingDeposit(deposit: PendingDeposit) {
  try {
    const key = `pending-${deposit.checkoutRequestID}.json`;
    
    const blob = await put(key, JSON.stringify(deposit), {
      access: 'private',
      addRandomSuffix: false,
      token: getBlobToken(), // ADD THIS!
    });
    
    console.log('📝 Stored pending deposit in Blob:', blob.url);
    return blob;
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
    
    // List blobs to find the file
    const { blobs } = await list({
      prefix: key,
      token: getBlobToken(), // ADD THIS!
    });

    if (blobs.length === 0) {
      console.log('❌ No pending deposit found for:', checkoutRequestID);
      return null;
    }

    // Get the blob content
    const response = await fetch(blobs[0].url);
    const text = await response.text();
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
    
    // Find the blob URL first
    const { blobs } = await list({
      prefix: key,
      token: getBlobToken(), // ADD THIS!
    });

    if (blobs.length > 0) {
      await del(blobs[0].url, {
        token: getBlobToken(), // ADD THIS!
      });
      
      console.log('🗑️ Removed pending deposit:', checkoutRequestID);
    }
  } catch (error) {
    console.error('Failed to remove pending deposit:', error);
  }
}

// Get all pending deposits (for admin)
export async function getAllPendingDeposits(): Promise<PendingDeposit[]> {
  try {
    const { blobs } = await list({
      prefix: 'pending-',
      token: getBlobToken(), // ADD THIS!
    });
    
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
