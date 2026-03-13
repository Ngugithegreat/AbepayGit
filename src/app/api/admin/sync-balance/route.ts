import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// This endpoint manually sets a user's balance (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { account, balance } = body;

    console.log('🔄 Sync request:', { account, balance });

    if (!account) {
      return NextResponse.json(
        { success: false, error: 'Account is required' },
        { status: 400 }
      );
    }

    if (balance === undefined || balance === null || balance === '') {
      return NextResponse.json(
        { success: false, error: 'Balance is required' },
        { status: 400 }
      );
    }

    const balanceValue = parseFloat(balance);

    if (isNaN(balanceValue)) {
      return NextResponse.json(
        { success: false, error: 'Invalid balance value' },
        { status: 400 }
      );
    }

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    // Store as number, not string
    await redis.set(`balance:${account}`, balanceValue);

    console.log(`✅ Balance set for ${account}: $${balanceValue}`);

    return NextResponse.json({
      success: true,
      message: `Balance set to $${balanceValue} for ${account}`,
      account,
      balance: balanceValue,
    });

  } catch (error: any) {
    console.error('❌ Balance sync error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
