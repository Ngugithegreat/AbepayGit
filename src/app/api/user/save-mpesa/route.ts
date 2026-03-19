
import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export async function POST(request: NextRequest) {
  try {
    const { account, phone } = await request.json();

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    await redis.set(`mpesa_phone:${account}`, phone);

    console.log(`✅ M-Pesa phone saved for ${account}: ${phone}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Save M-Pesa error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
