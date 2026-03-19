import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export async function GET(request: NextRequest) {
  try {
    const account = request.nextUrl.searchParams.get('account');

    if (!account) {
      return NextResponse.json(
        { success: false, error: 'Account required' },
        { status: 400 }
      );
    }

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    const phone = await redis.get(`mpesa_phone:${account}`);

    return NextResponse.json({
      success: true,
      phone: phone || null,
    });

  } catch (error: any) {
    console.error('❌ Get M-Pesa error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
