import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export async function GET(request: NextRequest) {
  try {
    const account = request.nextUrl.searchParams.get('account');
    
    console.log('💰 Balance request for:', account);
    
    if (!account) {
      return NextResponse.json(
        { success: false, error: 'Account not specified' },
        { status: 400 }
      );
    }

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    // Get balance from Redis
    const balanceData = await redis.get(`balance:${account}`);
    
    console.log('📊 Raw balance data:', balanceData);
    
    // Handle different data types
    let balance = 0;
    
    if (balanceData !== null && balanceData !== undefined) {
      if (typeof balanceData === 'number') {
        balance = balanceData;
      } else if (typeof balanceData === 'string') {
        balance = parseFloat(balanceData);
      }
    }

    console.log(`✅ Final balance for ${account}: $${balance}`);

    return NextResponse.json({
      success: true,
      balance: balance,
      account: account,
    });

  } catch (error: any) {
    console.error('❌ Balance fetch error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
