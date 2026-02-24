import { NextRequest, NextResponse } from 'next/server';
import { 
  getMpesaConfig, 
  generateMpesaPassword, 
  generateTimestamp, 
  formatPhoneNumber,
  isValidKenyanPhone,
  MPESA_CONFIG 
} from '@/lib/mpesa-config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, amount } = body;

    console.log('💰 Initiating M-Pesa STK Push:', { phone, amount });

    // Validation
    if (!phone || !amount) {
      console.error('❌ Missing phone or amount');
      return NextResponse.json(
        { success: false, error: 'Phone number and amount are required' },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhoneNumber(phone);
    if (!isValidKenyanPhone(formattedPhone)) {
      console.error('❌ Invalid phone:', formattedPhone);
      return NextResponse.json(
        { success: false, error: 'Invalid Kenyan phone number. Use format: 0712345678' },
        { status: 400 }
      );
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 1) {
      console.error('❌ Invalid amount:', numAmount);
      return NextResponse.json(
        { success: false, error: 'Invalid amount. Minimum is KES 1' },
        { status: 400 }
      );
    }

    // Get config
    const config = getMpesaConfig();
    console.log('📋 Config:', {
      shortcode: config.SHORTCODE,
      authUrl: config.AUTH_URL,
      stkUrl: config.STK_PUSH_URL,
      hasKey: !!config.CONSUMER_KEY,
      hasSecret: !!config.CONSUMER_SECRET,
      keyLength: config.CONSUMER_KEY?.length,
    });

    if (!config.CONSUMER_KEY || !config.CONSUMER_SECRET) {
      console.error('❌ Missing credentials');
      return NextResponse.json(
        { success: false, error: 'M-Pesa credentials not configured' },
        { status: 500 }
      );
    }

    // Step 1: Get access token
    const auth = Buffer.from(`${config.CONSUMER_KEY}:${config.CONSUMER_SECRET}`).toString('base64');

    console.log('🔐 Getting access token...');
    console.log('Auth URL:', config.AUTH_URL);

    const authResponse = await fetch(config.AUTH_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });

    console.log('Auth response status:', authResponse.status);
    
    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error('❌ Auth failed:', errorText);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to authenticate with M-Pesa',
          details: errorText,
          status: authResponse.status,
        },
        { status: 500 }
      );
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    console.log('✅ Access token received');

    // Step 2: Generate password and timestamp
    const timestamp = generateTimestamp();
    const password = generateMpesaPassword(config.SHORTCODE, config.PASSKEY, timestamp);

    console.log('📝 Generated:', {
      timestamp,
      passwordLength: password.length,
      hasPasskey: !!config.PASSKEY,
    });

    // Step 3: Send STK Push
    const stkPushPayload = {
      BusinessShortCode: config.SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(numAmount),
      PartyA: formattedPhone,
      PartyB: config.SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: MPESA_CONFIG.CALLBACK_URL,
      AccountReference: MPESA_CONFIG.ACCOUNT_REFERENCE,
      TransactionDesc: MPESA_CONFIG.TRANSACTION_DESC,
    };

    console.log('📤 Sending STK Push...');
    console.log('Payload:', JSON.stringify(stkPushPayload, null, 2));

    const stkResponse = await fetch(config.STK_PUSH_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stkPushPayload),
    });

    const stkData = await stkResponse.json();
    console.log('📥 STK Push response:', JSON.stringify(stkData, null, 2));

    if (stkData.ResponseCode === '0') {
      console.log('✅ STK Push sent successfully');
      return NextResponse.json({
        success: true,
        message: 'STK push sent. Please check your phone and enter M-Pesa PIN.',
        checkoutRequestID: stkData.CheckoutRequestID,
        merchantRequestID: stkData.MerchantRequestID,
      });
    } else {
      console.error('❌ STK Push failed:', stkData);
      return NextResponse.json(
        { 
          success: false, 
          error: stkData.ResponseDescription || stkData.errorMessage || stkData.CustomerMessage || 'STK push failed',
          details: stkData,
        },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('💥 M-Pesa error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
