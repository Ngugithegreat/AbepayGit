// API Route: /api/mpesa/initiate
// This initiates the M-Pesa STK Push (sends payment prompt to user's phone)

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

    // Validation
    if (!phone || !amount) {
      return NextResponse.json(
        { success: false, error: 'Phone number and amount are required' },
        { status: 400 }
      );
    }

    // Validate phone number
    const formattedPhone = formatPhoneNumber(phone);
    if (!isValidKenyanPhone(formattedPhone)) {
      return NextResponse.json(
        { success: false, error: 'Invalid Kenyan phone number' },
        { status: 400 }
      );
    }

    // Validate amount
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 1) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount. Minimum is KES 1' },
        { status: 400 }
      );
    }

    console.log('💰 Initiating M-Pesa STK Push:', {
      phone: formattedPhone,
      amount: numAmount
    });

    // Step 1: Get M-Pesa access token
    const config = getMpesaConfig();
    const auth = Buffer.from(`${config.CONSUMER_KEY}:${config.CONSUMER_SECRET}`).toString('base64');

    console.log('🔐 Getting M-Pesa access token...');
    const authResponse = await fetch(config.AUTH_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });

    if (!authResponse.ok) {
      console.error('❌ Auth failed:', await authResponse.text());
      throw new Error('Failed to authenticate with M-Pesa');
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    console.log('✅ Access token received');

    // Step 2: Generate timestamp and password
    const timestamp = generateTimestamp();
    const password = generateMpesaPassword(config.SHORTCODE, config.PASSKEY, timestamp);

    // Step 3: Initiate STK Push
    const stkPushPayload = {
      BusinessShortCode: config.SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(numAmount), // M-Pesa requires integer
      PartyA: formattedPhone,
      PartyB: config.SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: MPESA_CONFIG.CALLBACK_URL,
      AccountReference: MPESA_CONFIG.ACCOUNT_REFERENCE,
      TransactionDesc: MPESA_CONFIG.TRANSACTION_DESC,
    };

    console.log('📤 Sending STK Push request...');
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

    // Check if STK push was successful
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
          error: stkData.ResponseDescription || stkData.errorMessage || 'STK push failed'
        },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('💥 M-Pesa initiate error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
