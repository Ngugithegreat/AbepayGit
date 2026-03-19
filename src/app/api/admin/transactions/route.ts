
import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export async function GET(request: NextRequest) {
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    // Get all transactions
    const txKeys = await redis.keys('transaction:*');
    const transactions = [];

    if (txKeys.length > 0) {
        const txData = await redis.mget(...txKeys);
        for (const tx of txData) {
            if(tx) {
                transactions.push(tx);
            }
        }
    }
    
    // Sort by timestamp (newest first)
    transactions.sort((a: any, b: any) => b.timestamp - a.timestamp);

    return NextResponse.json({
      success: true,
      transactions,
    });

  } catch (error: any) {
    console.error('❌ Transactions error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

    