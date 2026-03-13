import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export async function POST(request: NextRequest) {
  try {
    const { account, token } = await request.json();

    if (!account || !token) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    // Just store the token - nothing else!
    await redis.set(`user_token:${account}`, token);

    console.log(`✅ Token stored for ${account}`);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('❌ Token storage error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
