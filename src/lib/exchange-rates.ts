import { Redis } from '@upstash/redis';

function getRedisClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error('Redis credentials not configured');
  }

  return new Redis({ url, token });
}

// Default rates
const DEFAULT_DEPOSIT_RATE = 130;
const DEFAULT_WITHDRAW_RATE = 124;

export async function getDepositRate(): Promise<number> {
  try {
    const redis = getRedisClient();
    const rate = await redis.get('exchange_rate:deposit');
    return rate ? Number(rate) : DEFAULT_DEPOSIT_RATE;
  } catch (error) {
    console.error('Failed to get deposit rate:', error);
    return DEFAULT_DEPOSIT_RATE;
  }
}

export async function getWithdrawRate(): Promise<number> {
  try {
    const redis = getRedisClient();
    const rate = await redis.get('exchange_rate:withdraw');
    return rate ? Number(rate) : DEFAULT_WITHDRAW_RATE;
  } catch (error) {
    console.error('Failed to get withdraw rate:', error);
    return DEFAULT_WITHDRAW_RATE;
  }
}

export async function setDepositRate(rate: number): Promise<void> {
  const redis = getRedisClient();
  await redis.set('exchange_rate:deposit', rate);
  console.log('✅ Deposit rate updated to:', rate);
}

export async function setWithdrawRate(rate: number): Promise<void> {
  const redis = getRedisClient();
  await redis.set('exchange_rate:withdraw', rate);
  console.log('✅ Withdraw rate updated to:', rate);
}
