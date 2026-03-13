
import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export async function GET(request: NextRequest) {
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    // Test write
    await redis.set('test-balance:CR2542302', 1.01);
    console.log('✅ Wrote test balance');

    // Test read
    const value = await redis.get('test-balance:CR2542302');
    console.log('📊 Read value:', value, 'Type:', typeof value);

    // Set actual balance
    await redis.set('balance:CR2542302', 1.01);
    console.log('✅ Set actual balance');

    // Read actual balance
    const actualBalance = await redis.get('balance:CR2542302');
    console.log('💰 Actual balance:', actualBalance, 'Type:', typeof actualBalance);

    return NextResponse.json({
      success: true,
      testValue: value,
      actualBalance: actualBalance,
      message: 'Redis test complete - check logs',
    });

  } catch (error: any) {
    console.error('❌ Redis test error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
