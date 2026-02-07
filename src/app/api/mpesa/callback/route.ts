// API Route: /api/mpesa/callback
// This receives payment confirmations from Safaricom

import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for completed transactions (replace with database later)
const completedTransactions = new Map<string, any>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📞 M-Pesa Callback received:', JSON.stringify(body, null, 2));

    // Extract callback data
    const { Body } = body;
    if (!Body || !Body.stkCallback) {
      console.error('❌ Invalid callback structure');
      return NextResponse.json({ ResultCode: 1, ResultDesc: 'Invalid callback' });
    }

    const { stkCallback } = Body;
    const { ResultCode, ResultDesc, CheckoutRequestID, MerchantRequestID, CallbackMetadata } = stkCallback;

    console.log('Result Code:', ResultCode);
    console.log('Result Description:', ResultDesc);

    // ResultCode 0 = Success
    if (ResultCode === 0) {
      console.log('✅ Payment successful!');

      // Extract payment details from metadata
      const metadata = CallbackMetadata?.Item || [];
      const paymentDetails: any = {};

      metadata.forEach((item: any) => {
        paymentDetails[item.Name] = item.Value;
      });

      const transactionData = {
        checkoutRequestID: CheckoutRequestID,
        merchantRequestID: MerchantRequestID,
        amount: paymentDetails.Amount,
        mpesaReceiptNumber: paymentDetails.MpesaReceiptNumber,
        transactionDate: paymentDetails.TransactionDate,
        phoneNumber: paymentDetails.PhoneNumber,
        status: 'completed',
        timestamp: new Date().toISOString(),
      };

      console.log('💰 Transaction Details:', transactionData);

      // Store transaction
      completedTransactions.set(CheckoutRequestID, transactionData);

      // TODO: Trigger Deriv transfer here
      // This is where we'll call the Deriv Payment Agent API
      // For now, we'll just log it
      console.log('🚀 TODO: Transfer to Deriv account');

      // Return success to M-Pesa
      return NextResponse.json({
        ResultCode: 0,
        ResultDesc: 'Success'
      });

    } else {
      // Payment failed or cancelled
      console.log('❌ Payment failed or cancelled:', ResultDesc);

      const failedTransaction = {
        checkoutRequestID: CheckoutRequestID,
        merchantRequestID: MerchantRequestID,
        status: 'failed',
        reason: ResultDesc,
        timestamp: new Date().toISOString(),
      };

      completedTransactions.set(CheckoutRequestID, failedTransaction);

      return NextResponse.json({
        ResultCode: 0,
        ResultDesc: 'Acknowledged'
      });
    }

  } catch (error: any) {
    console.error('💥 Callback error:', error);
    
    // Always return success to M-Pesa to avoid retries
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: 'Received'
    });
  }
}

// GET endpoint to check transaction status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const checkoutRequestID = searchParams.get('checkoutRequestID');

  if (!checkoutRequestID) {
    return NextResponse.json(
      { error: 'checkoutRequestID is required' },
      { status: 400 }
    );
  }

  const transaction = completedTransactions.get(checkoutRequestID);

  if (!transaction) {
    return NextResponse.json({
      status: 'pending',
      message: 'Transaction not yet completed'
    });
  }

  return NextResponse.json(transaction);
}
