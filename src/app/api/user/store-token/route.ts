import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export async function POST(request: NextRequest) {
  try {
    const { account, token, email, name } = await request.json();

    if (!account || !token) {
      return NextResponse.json(
        { success: false, error: 'Account and token required' },
        { status: 400 }
      );
    }

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    // Store user's API token securely
    await redis.set(`user_token:${account}`, token);
    
    // Store user info
    await redis.set(`user_info:${account}`, JSON.stringify({
      email,
      name,
      account,
      created: Date.now(),
    }));

    console.log(`✅ Stored API token for ${account}`);

    return NextResponse.json({
      success: true,
      message: 'Token stored successfully',
    });

  } catch (error: any) {
    console.error('❌ Token storage error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
