import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// This endpoint manually sets a user's balance (admin only)
export async function POST(request: NextRequest) {
  try {
    const { account, balance } = await request.json();

    if (!account || balance === undefined) {
      return NextResponse.json(
        { success: false, error: 'Account and balance required' },
        { status: 400 }
      );
    }

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    await redis.set(`balance:${account}`, balance.toString());

    console.log(`✅ Manually set balance for ${account}: $${balance}`);

    return NextResponse.json({
      success: true,
      message: `Balance set to $${balance} for ${account}`,
    });

  } catch (error: any) {
    console.error('❌ Balance sync error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
