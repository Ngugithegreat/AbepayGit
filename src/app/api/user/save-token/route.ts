import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export async function POST(request: NextRequest) {
  try {
    const { account, token } = await request.json();

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    await redis.set(`user_token:${account}`, token);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
