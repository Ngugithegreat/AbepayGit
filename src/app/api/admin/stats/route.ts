
import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export async function GET(request: NextRequest) {
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    // Get all transaction keys
    const txKeys = await redis.keys('transaction:*');
    
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    let depositCount = 0;
    let withdrawalCount = 0;
    let todayRevenue = 0;

    const today = new Date().toISOString().split('T')[0];
    
    if (txKeys.length > 0) {
        const transactions = await redis.mget(...txKeys);

        for (const tx of transactions) {
            if (!tx) continue;
            const txData = tx as any;

            if (txData.type === 'deposit') {
                totalDeposits += txData.usdAmount || 0;
                depositCount++;
                
                const txDate = new Date(txData.timestamp).toISOString().split('T')[0];
                if (txDate === today) {
                // 5% commission on deposits
                todayRevenue += (txData.usdAmount || 0) * 0.05; 
                }
            } else if (txData.type === 'withdrawal') {
                totalWithdrawals += txData.usdAmount || 0;
                withdrawalCount++;
            }
        }
    }


    // Get active users (users with transaction history)
    const userTxKeys = await redis.keys('user_transactions:*');
    const activeUsers = userTxKeys.length;

    // Get pending transactions (example logic)
    const pendingTxKeys = await redis.keys('pending:*');
    const pendingTransactions = pendingTxKeys.length;

    return NextResponse.json({
      success: true,
      stats: {
        totalDeposits,
        totalWithdrawals,
        activeUsers,
        pendingTransactions,
        todayRevenue,
        depositCount,
        withdrawalCount,
      },
    });

  } catch (error: any) {
    console.error('❌ Stats error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

    