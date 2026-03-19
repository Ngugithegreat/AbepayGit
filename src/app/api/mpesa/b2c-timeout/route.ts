import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('⏰ B2C Timeout:', JSON.stringify(body, null, 2));

    const conversationId = body?.ConversationID;

    if (conversationId) {
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });
      // Log the timeout for administrative review
      await redis.set(`b2c_timeout:${conversationId}`, JSON.stringify(body), { ex: 86400 * 7 });
    }
    
    // TODO: Handle timeout - notify admin, find transaction and mark as 'timed_out'

    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });

  } catch (error: any) {
    console.error('❌ B2C timeout error:', error);
    return NextResponse.json({ ResultCode: 1, ResultDesc: 'Failed' });
  }
}
