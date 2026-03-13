import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export async function GET(request: NextRequest) {
  try {
    const account = request.nextUrl.searchParams.get('account');
    
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
    const balance = await redis.get(`balance:${account}`);
    const balanceValue = balance ? parseFloat(balance as string) : 0;

    console.log(`💰 Balance for ${account}: $${balanceValue}`);

    return NextResponse.json({
      success: true,
      balance: balanceValue,
      account,
    });

  } catch (error: any) {
    console.error('❌ Balance fetch error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
