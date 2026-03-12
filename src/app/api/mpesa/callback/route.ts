import { NextRequest, NextResponse } from 'next/server';
import { calculateUSD, EXCHANGE_RATES } from '@/lib/deriv-api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📞 M-Pesa Callback received:', JSON.stringify(body, null, 2));

    const { Body } = body;
    if (!Body || !Body.stkCallback) {
      console.error('❌ Invalid callback structure');
      return NextResponse.json(
        { ResultCode: 0, ResultDesc: 'Received' },
        { status: 200 }
      );
    }

    const { stkCallback } = Body;
    const { ResultCode, ResultDesc, CheckoutRequestID, CallbackMetadata } = stkCallback;

    console.log('Result Code:', ResultCode);
    console.log('Result Description:', ResultDesc);

    if (ResultCode === 0) {
      // Payment successful
      console.log('✅ M-Pesa payment successful!');

      // Extract transaction details
      const metadata = CallbackMetadata?.Item || [];
      const paymentDetails: any = {};

      metadata.forEach((item: any) => {
        paymentDetails[item.Name] = item.Value;
      });

      const kesAmount = paymentDetails.Amount || 0;
      const mpesaReceipt = paymentDetails.MpesaReceiptNumber || '';
      const phoneNumber = paymentDetails.PhoneNumber || '';
      const transactionDate = paymentDetails.TransactionDate || '';

      // CRITICAL: Get client account from the ORIGINAL request
      // Since M-Pesa doesn't return AccountReference in callback,
      // we need to store the mapping when we initiate the STK push

      // For now, log the issue
      console.log('💰 Transaction Details:', {
        amount: kesAmount,
        receipt: mpesaReceipt,
        phone: phoneNumber,
        date: transactionDate,
        checkoutRequestID: CheckoutRequestID
      });

      // Calculate USD
      const usdAmount = calculateUSD(kesAmount, EXCHANGE_RATES.DEPOSIT);

      console.log(`💵 ${kesAmount} KES = $${usdAmount} USD`);

      // TODO: We need to map CheckoutRequestID to derivAccount
      // This requires storing the mapping in a database when STK push is sent

      console.log('⚠️ Need to implement CheckoutRequestID → Deriv Account mapping');
      console.log('⚠️ Storing transaction as pending until we have mapping');

      // Store this transaction with mpesaReceipt as key
      // Admin can manually credit it later

      return NextResponse.json(
        { ResultCode: 0, ResultDesc: 'Success' },
        { status: 200 }
      );

    } else {
      console.log('❌ Payment failed:', ResultDesc);

      return NextResponse.json(
        { ResultCode: 0, ResultDesc: 'Acknowledged' },
        { status: 200 }
      );
    }

  } catch (error: any) {
    console.error('💥 Callback error:', error);
    
    return NextResponse.json(
      { ResultCode: 0, ResultDesc: 'Received' },
      { status: 200 }
    );
  }
}
