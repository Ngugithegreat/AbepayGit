import { NextRequest, NextResponse } from 'next/server';
import { getPendingDeposit, removePendingDeposit } from '@/lib/pending-deposits';
import { transferToClient } from '@/lib/deriv-api';
import { getDepositRate } from '@/lib/exchange-rates';
import { Redis } from '@upstash/redis';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📞 M-Pesa Callback:', JSON.stringify(body, null, 2));

    const { Body } = body;
    if (!Body?.stkCallback) {
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Received' }, { status: 200 });
    }

    const { stkCallback } = Body;
    const { ResultCode, ResultDesc, CheckoutRequestID, CallbackMetadata } = stkCallback;

    if (ResultCode === 0) {
      console.log('✅ M-Pesa payment successful!');

      // Get pending deposit from KV storage
      const pendingDeposit = await getPendingDeposit(CheckoutRequestID);

      if (!pendingDeposit) {
        console.error('❌ No pending deposit found for:', CheckoutRequestID);
        
        // Still return 200 to M-Pesa to avoid retries
        return NextResponse.json(
          { ResultCode: 0, ResultDesc: 'Received' },
          { status: 200 }
        );
      }

      console.log('📋 Found pending deposit:', pendingDeposit);

      // Extract payment details
      const metadata = CallbackMetadata?.Item || [];
      const paymentDetails: any = {};
      
      metadata.forEach((item: any) => {
        paymentDetails[item.Name] = item.Value;
      });

      const kesAmount = paymentDetails.Amount || 0;
      const mpesaReceipt = paymentDetails.MpesaReceiptNumber || '';

      // Calculate USD
      const depositRate = await getDepositRate();
      const usdAmount = parseFloat((kesAmount / depositRate).toFixed(2));

      console.log(`💵 ${kesAmount} KES = $${usdAmount} USD`);
      console.log(`📝 Crediting to: ${pendingDeposit.derivAccount}`);

      // Transfer to Deriv account
      const transferResult = await transferToClient(
        pendingDeposit.derivAccount,
        usdAmount
      );

      if (transferResult.success) {
        console.log('🎉 Transfer successful!', transferResult);
        
        // Store transaction history
        const redis = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL!,
          token: process.env.UPSTASH_REDIS_REST_TOKEN!,
        });

        const transaction = {
          id: CheckoutRequestID,
          type: 'deposit',
          kesAmount,
          usdAmount,
          mpesaReceipt,
          derivAccount: pendingDeposit.derivAccount,
          phoneNumber: pendingDeposit.phoneNumber,
          transactionId: transferResult.transaction_id,
          timestamp: Date.now(),
          status: 'completed',
        };

        await redis.set(
          `transaction:${CheckoutRequestID}`,
          JSON.stringify(transaction)
        );

        // Add to user's transaction list
        await redis.lpush(
          `user_transactions:${pendingDeposit.derivAccount}`,
          CheckoutRequestID
        );

        console.log('💾 Transaction saved');
        
        // Remove from pending
        await removePendingDeposit(CheckoutRequestID);
        
      } else {
        console.error('❌ Transfer failed:', transferResult.error);
        
        // Keep in pending for manual processing
        // Admin can retry later
      }

      // Always return 200 to M-Pesa
      return NextResponse.json(
        { ResultCode: 0, ResultDesc: 'Success' },
        { status: 200 }
      );

    } else {
      console.log('❌ Payment failed:', ResultDesc);
      
      // Remove from pending
      if (CheckoutRequestID) {
        await removePendingDeposit(CheckoutRequestID);
      }
      
      return NextResponse.json(
        { ResultCode: 0, ResultDesc: 'Acknowledged' },
        { status: 200 }
      );
    }

  } catch (error: any) {
    console.error('💥 Callback error:', error);
    
    // Always return 200 to avoid M-Pesa retries
    return NextResponse.json(
      { ResultCode: 0, ResultDesc: 'Received' },
      { status: 200 }
    );
  }
}
