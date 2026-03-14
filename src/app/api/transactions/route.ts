import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export async function GET(request: NextRequest) {
  try {
    const derivAccount = request.cookies.get('deriv_account')?.value;

    if (!derivAccount) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Account not found in session' },
        { status: 401 }
      );
    }

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    // Get transaction IDs for this user
    const transactionIds = await redis.lrange(
      `user_transactions:${derivAccount}`,
      0,
      49 // Last 50 transactions
    );

    if (transactionIds.length === 0) {
      return NextResponse.json({
        success: true,
        transactions: [],
      });
    }

    // Fetch transaction details
    const transactions = [];
    if (transactionIds.length > 0) {
      // Using mget for batch fetching
      const transactionData = await redis.mget(
        ...transactionIds.map(id => `transaction:${id}`)
      );

      for (const data of transactionData) {
        if (data) {
          const transaction = typeof data === 'string' ? JSON.parse(data) : data;
          transactions.push(transaction);
        }
      }
    }
    
    // Sort by timestamp descending
    transactions.sort((a, b) => b.timestamp - a.timestamp);

    return NextResponse.json({
      success: true,
      transactions,
    });

  } catch (error: any) {
    console.error("Transaction fetch error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
