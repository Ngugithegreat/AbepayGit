
import { NextRequest, NextResponse } from 'next/server';
import { calculateBalanceFromTransactions } from '@/lib/calculate-balance';
import { Redis } from '@upstash/redis';

export async function GET(request: NextRequest) {
  try {
    const clientAccount = request.nextUrl.searchParams.get('account');
    
    if (!clientAccount) {
      return NextResponse.json(
        { success: false, error: 'Account not specified' },
        { status: 400 }
      );
    }
    
    console.log(`🔍 Calculating balance for ${clientAccount} from statement...`);
    
    // Calculate balance from Deriv statement
    const balance = await calculateBalanceFromTransactions(clientAccount);

    console.log(`✅ Calculated balance for ${clientAccount}: $${balance}`);
    
    // Update Redis with this authoritative balance.
    // This makes subsequent loads faster and keeps our records in sync.
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    await redis.set(`balance:${clientAccount}`, balance);
    console.log(`🔄 Synced calculated balance to Redis for ${clientAccount}`);


    return NextResponse.json({
      success: true,
      balance: balance,
      account: clientAccount,
    });

  } catch (error: any) {
    console.error('❌ Balance calculation error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
