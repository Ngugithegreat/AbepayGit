import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { phone, amount, account } = await request.json();

    console.log('💰 B2C Payment Request:', { phone, amount, account });
    
    if (
        !process.env.MPESA_B2C_CONSUMER_KEY ||
        !process.env.MPESA_B2C_CONSUMER_SECRET ||
        !process.env.MPESA_B2C_INITIATOR_NAME ||
        !process.env.MPESA_B2C_SECURITY_CREDENTIAL ||
        !process.env.MPESA_B2C_SHORTCODE
    ) {
        throw new Error('M-Pesa B2C environment variables are not fully configured.');
    }

    // Step 1: Get access token
    const auth = Buffer.from(
      `${process.env.MPESA_B2C_CONSUMER_KEY}:${process.env.MPESA_B2C_CONSUMER_SECRET}`
    ).toString('base64');

    const tokenResponse = await fetch(
      'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
        throw new Error('Failed to obtain M-Pesa access token.');
    }

    console.log('✅ Access token obtained');

    // Step 2: Format phone number (254XXXXXXXXX)
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('+254')) {
      formattedPhone = formattedPhone.substring(1);
    }

    // Step 3: Make B2C request
    const b2cPayload = {
      InitiatorName: process.env.MPESA_B2C_INITIATOR_NAME,
      SecurityCredential: process.env.MPESA_B2C_SECURITY_CREDENTIAL,
      CommandID: 'BusinessPayment',
      Amount: Math.round(amount),
      PartyA: process.env.MPESA_B2C_SHORTCODE,
      PartyB: formattedPhone,
      Remarks: `ABEPAY Withdrawal - ${account}`,
      QueueTimeOutURL: `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/b2c-timeout`,
      ResultURL: `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/b2c-result`,
      Occasion: 'Withdrawal',
    };

    console.log('📤 Sending B2C request...');

    const b2cResponse = await fetch(
      'https://api.safaricom.co.ke/mpesa/b2c/v1/paymentrequest',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(b2cPayload),
      }
    );

    const b2cData = await b2cResponse.json();

    console.log('📥 B2C Response:', b2cData);

    if (b2cResponse.ok && b2cData.ResponseCode === '0') {
      console.log('✅ B2C payment initiated successfully');
      
      return NextResponse.json({
        success: true,
        conversationId: b2cData.ConversationID,
        originatorConversationId: b2cData.OriginatorConversationID,
        message: 'Payment initiated successfully',
      });
    } else {
      console.error('❌ B2C payment failed:', b2cData);
      
      return NextResponse.json({
        success: false,
        error: b2cData.errorMessage || b2cData.ResponseDescription || 'Payment failed',
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('❌ B2C error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
