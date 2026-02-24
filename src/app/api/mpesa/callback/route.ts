import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📞 M-Pesa Callback received:', JSON.stringify(body, null, 2));

    // Extract callback data
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
      console.log('✅ Payment successful!');

      const metadata = CallbackMetadata?.Item || [];
      const paymentDetails: any = {};

      metadata.forEach((item: any) => {
        paymentDetails[item.Name] = item.Value;
      });

      console.log('💰 Transaction Details:', paymentDetails);

      // TODO: Trigger Deriv transfer here
      // For now, just log it

      return NextResponse.json(
        { ResultCode: 0, ResultDesc: 'Success' },
        { status: 200 }
      );

    } else {
      // Payment failed
      console.log('❌ Payment failed:', ResultDesc);

      return NextResponse.json(
        { ResultCode: 0, ResultDesc: 'Acknowledged' },
        { status: 200 }
      );
    }

  } catch (error: any) {
    console.error('💥 Callback error:', error);
    
    // Always return 200 to M-Pesa to avoid retries
    return NextResponse.json(
      { ResultCode: 0, ResultDesc: 'Received' },
      { status: 200 }
    );
  }
}
