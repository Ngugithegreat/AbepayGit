import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userAccount = url.searchParams.get('account');

    if (!userAccount) {
      return NextResponse.json(
        { success: false, error: 'Account required' },
        { status: 400 }
      );
    }

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    const userTxKey = `user_transactions:${userAccount}`;
    
    let transactions = [];
    
    try {
      const data = await redis.get(userTxKey);
      
      if (data) {
        if (typeof data === 'string') {
          transactions = JSON.parse(data);
        } else if (Array.isArray(data)) {
          transactions = data;
        }
      }
    } catch (error) {
      console.error('Failed to fetch transactions, resetting key:', error);
      await redis.del(userTxKey);
      transactions = [];
    }

    return NextResponse.json({
      success: true,
      transactions: transactions,
    });

  } catch (error: any) {
    console.error('Transaction fetch error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
