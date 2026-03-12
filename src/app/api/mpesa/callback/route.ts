import { NextRequest, NextResponse } from 'next/server';
import { getPendingDeposit, removePendingDeposit } from '@/lib/pending-deposits';
import { transferToClient } from '@/lib/deriv-api';


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
      const depositRate = 130;
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
        
        // Remove from pending
        await removePendingDeposit(CheckoutRequestID);
        
        // TODO: Store completed transaction in database
        
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
