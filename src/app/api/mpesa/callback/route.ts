import { NextRequest, NextResponse } from 'next/server';
import { transferToClient, calculateUSD, EXCHANGE_RATES } from '@/lib/deriv-api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📞 M-Pesa Callback received:', JSON.stringify(body, null, 2));

    const { Body } = body;
    if (!Body || !Body.stkCallback) {
      console.error('❌ Invalid callback structure');
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Received' }, { status: 200 });
    }

    const { stkCallback } = Body;
    const { ResultCode, ResultDesc, CheckoutRequestID, CallbackMetadata } = stkCallback;
    
    // The AccountReference should contain the Deriv loginid we passed in the initiate request
    const clientAccount = (stkCallback as any).AccountReference;

    console.log('Result Code:', ResultCode);
    console.log('Result Description:', ResultDesc);
    console.log('Client Account from Ref:', clientAccount);

    if (ResultCode === 0) {
      // Payment successful
      console.log('✅ M-Pesa payment successful!');

      const metadata = CallbackMetadata?.Item || [];
      const paymentDetails: any = {};
      metadata.forEach((item: any) => { paymentDetails[item.Name] = item.Value; });
      
      const kesAmount = paymentDetails.Amount;
      
      if (!clientAccount || !kesAmount) {
        console.error('❌ CRITICAL: Missing client account or amount in callback. Cannot credit user.', { clientAccount, kesAmount });
        // Still return success to M-Pesa to prevent retries, but log the error for manual intervention.
        return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted but missing data for processing' }, { status: 200 });
      }

      // Calculate USD amount based on the deposit exchange rate
      const amountUSD = calculateUSD(kesAmount, EXCHANGE_RATES.DEPOSIT);
      
      console.log(`💸 Calculated ${amountUSD} USD from ${kesAmount} KES. Preparing to credit Deriv account ${clientAccount}.`);

      // Trigger the Deriv Payment Agent transfer
      const transferResult = await transferToClient(clientAccount, amountUSD);

      if (transferResult.success) {
        console.log(`✅ Successfully transferred ${amountUSD} USD to ${clientAccount}. Deriv Transaction ID: ${transferResult.transaction_id}`);
        // TODO: Save this successful transaction to our internal database
      } else {
        console.error(`❌ FAILED to transfer to Deriv account ${clientAccount}: ${transferResult.error}`);
        // TODO: Log this failure for manual intervention and retry mechanism
      }
      
      // Acknowledge receipt to Safaricom
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' }, { status: 200 });

    } else {
      // Payment failed or was cancelled by the user
      console.log('❌ M-Pesa payment failed or canceled:', ResultDesc);
      // TODO: Update transaction status in our database to 'Failed'
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Acknowledged' }, { status: 200 });
    }

  } catch (error: any) {
    console.error('💥 Callback processing error:', error);
    // Always return 200 to M-Pesa to avoid retries
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Received but failed to process' }, { status: 200 });
  }
}
