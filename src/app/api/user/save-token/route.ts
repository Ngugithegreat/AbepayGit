import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export async function POST(request: NextRequest) {
  try {
    const { account, token } = await request.json();

    if (!account || !token) {
        return NextResponse.json({ success: false, error: 'Account and token are required' }, { status: 400 });
    }

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    // Save with an expiry, e.g., 30 days
    await redis.set(`user_token:${account}`, token, { ex: 86400 * 30 });

    console.log(`✅ User token saved for ${account}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Save token error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
