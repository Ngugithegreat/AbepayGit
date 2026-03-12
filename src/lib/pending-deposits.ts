import { Redis } from '@upstash/redis';

interface PendingDeposit {
  checkoutRequestID: string;
  derivAccount: string;
  phoneNumber: string;
  kesAmount: number;
  timestamp: number;
}

// Initialize Redis client
function getRedisClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error('Redis credentials not configured');
  }

  return new Redis({
    url,
    token,
  });
}

// Store pending deposit (expires after 1 hour)
export async function storePendingDeposit(deposit: PendingDeposit) {
  try {
    const redis = getRedisClient();
    const key = `pending:${deposit.checkoutRequestID}`;
    
    // Store with 1 hour expiration
    await redis.set(key, JSON.stringify(deposit), {
      ex: 3600, // Expire after 1 hour
    });
    
    console.log('📝 Stored pending deposit in Redis:', deposit.checkoutRequestID);
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
    const redis = getRedisClient();
    const key = `pending:${checkoutRequestID}`;
    
    const data = await redis.get(key);
    
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
    const redis = getRedisClient();
    const key = `pending:${checkoutRequestID}`;
    
    await redis.del(key);
    
    console.log('🗑️ Removed pending deposit:', checkoutRequestID);
  } catch (error) {
    console.error('Failed to remove pending deposit:', error);
  }
}

// Get all pending deposits (for admin)
export async function getAllPendingDeposits(): Promise<PendingDeposit[]> {
  try {
    const redis = getRedisClient();
    
    // Get all keys matching pattern
    const keys = await redis.keys('pending:*');
    const deposits: PendingDeposit[] = [];

    for (const key of keys) {
      const data = await redis.get(key);
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
