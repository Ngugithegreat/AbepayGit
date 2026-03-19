import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📥 B2C Result:', JSON.stringify(body, null, 2));

    const result = body.Result;
    if (!result) {
      console.error('❌ Invalid B2C result format received');
      return NextResponse.json({ ResultCode: 1, ResultDesc: 'Invalid format' });
    }
    
    const resultCode = result.ResultCode;
    const conversationId = result.ConversationID;

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    if (resultCode === 0) {
      // Payment successful
      const transactionId = result.ResultParameters?.ResultParameter?.find(
        (p: any) => p.Key === 'TransactionID'
      )?.Value;
      
      const amount = result.ResultParameters?.ResultParameter?.find(
        (p: any) => p.Key === 'TransactionAmount'
      )?.Value;

      console.log('✅ B2C Payment successful:', {
        conversationId,
        transactionId,
        amount,
      });

      // Here you would find the original transaction by conversationId and update its status
      // For now, we'll log it to Redis.
      await redis.set(`b2c_result:${conversationId}`, JSON.stringify({
        success: true,
        transactionId,
        amount,
        timestamp: Date.now(),
      }), { ex: 86400 * 7 }); // Expire after 7 days

      // TODO: Find transaction in user_transactions and update status to 'completed'

    } else {
      // Payment failed
      console.error('❌ B2C Payment failed:', result.ResultDesc);

      await redis.set(`b2c_result:${conversationId}`, JSON.stringify({
        success: false,
        error: result.ResultDesc,
        resultCode: resultCode,
        timestamp: Date.now(),
      }), { ex: 86400 * 7 });

      // TODO: Find transaction and update status to 'failed'
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });

  } catch (error: any) {
    console.error('❌ B2C result error:', error);
    return NextResponse.json({ ResultCode: 1, ResultDesc: 'Failed' });
  }
}
