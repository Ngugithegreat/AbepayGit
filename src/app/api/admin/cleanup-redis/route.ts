import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { account, password } = body;

    // Simple admin password check
    if (password !== 'abepay2026') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    // Delete the corrupted key
    const userTxKey = `user_transactions:${account}`;
    await redis.del(userTxKey);

    console.log(`✅ Deleted corrupted key: ${userTxKey}`);

    return NextResponse.json({
      success: true,
      message: `Cleaned up transactions for ${account}`,
    });

  } catch (error: any) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
