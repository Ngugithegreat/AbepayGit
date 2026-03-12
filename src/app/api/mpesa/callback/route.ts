import { NextRequest, NextResponse } from 'next/server';
import { getPendingDeposit, removePendingDeposit } from '@/lib/pending-deposits';
import { transferToClient, calculateUSD, EXCHANGE_RATES } from '@/lib/deriv-api';


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
      // Payment successful
      console.log('✅ Payment successful!');

      // Get the pending deposit info
      const pendingDeposit = getPendingDeposit(CheckoutRequestID);

      if (!pendingDeposit) {
        console.error('❌ No pending deposit found for:', CheckoutRequestID);
        // Acknowledge receipt to M-Pesa even if we can't find it
        return NextResponse.json({ ResultCode: 0, ResultDesc: 'Received' }, { status: 200 });
      }

      console.log('📋 Found pending deposit:', pendingDeposit);

      // Extract payment details from metadata
      const metadata = CallbackMetadata?.Item || [];
      const paymentDetails: any = {};
      metadata.forEach((item: any) => {
        paymentDetails[item.Name] = item.Value;
      });
      const mpesaReceipt = paymentDetails.MpesaReceiptNumber || '';

      // Use KES amount from our stored record for security, not from callback
      const kesAmount = pendingDeposit.kesAmount;
      const usdAmount = calculateUSD(kesAmount, EXCHANGE_RATES.DEPOSIT);

      console.log(`💵 ${kesAmount} KES = $${usdAmount} USD`);
      console.log(`📝 Crediting to account: ${pendingDeposit.derivAccount}`);

      // Transfer USD to Deriv account
      const transferResult = await transferToClient(
        pendingDeposit.derivAccount, 
        usdAmount
      );
      
      if(transferResult.success) {
        console.log('🎉 Deriv transfer completed!', { 
            mpesaReceipt: mpesaReceipt,
            derivTransactionId: transferResult.transaction_id 
        });
        // TODO: Store final transaction in a permanent database
      } else {
        console.error('❌ Deriv transfer failed:', transferResult.error);
        // TODO: Handle failed transfer (e.g., alert admin, schedule retry)
      }


      // Remove from pending
      removePendingDeposit(CheckoutRequestID);

      console.log('🎉 Deposit processed successfully!');

      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' }, { status: 200 });
    } else {
      console.log('❌ Payment failed:', ResultDesc);
      // Remove from pending list on failure
      if (CheckoutRequestID) {
        removePendingDeposit(CheckoutRequestID);
      }
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Acknowledged' }, { status: 200 });
    }

  } catch (error: any) {
    console.error('💥 Callback error:', error);
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Received' }, { status: 200 });
  }
}
