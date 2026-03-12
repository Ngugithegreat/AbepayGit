
import { NextRequest, NextResponse } from 'next/server';
import { 
  getMpesaConfig, 
  generateMpesaPassword, 
  generateTimestamp, 
  formatPhoneNumber,
  isValidKenyanPhone,
  MPESA_CONFIG 
} from '@/lib/mpesa-config';
import { storePendingDeposit } from '@/lib/pending-deposits';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, amount, derivAccount } = body;

    console.log('💰 Initiating M-Pesa STK Push:', { phone, amount, derivAccount });

    // Validation
    if (!phone || !amount) {
      return NextResponse.json(
        { success: false, error: 'Phone number and amount are required' },
        { status: 400 }
      );
    }

    if (!derivAccount) {
      return NextResponse.json(
        { success: false, error: 'Deriv account is required. Please link your account first.' },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhoneNumber(phone);
    if (!isValidKenyanPhone(formattedPhone)) {
      return NextResponse.json(
        { success: false, error: 'Invalid Kenyan phone number' },
        { status: 400 }
      );
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 1) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount. Minimum is KES 1' },
        { status: 400 }
      );
    }

    const { config, error: configError } = getMpesaConfig();
    if (configError) {
      return NextResponse.json({ success: false, error: configError }, { status: 500 });
    }

    // Get access token
    const auth = Buffer.from(`${config.CONSUMER_KEY}:${config.CONSUMER_SECRET}`).toString('base64');
    
    const authResponse = await fetch(config.AUTH_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });

    if (!authResponse.ok) {
       const errorText = await authResponse.text();
       console.error("M-Pesa Auth API Error:", errorText);
      throw new Error('Failed to authenticate with M-Pesa');
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    // Generate password and timestamp
    const timestamp = generateTimestamp();
    const password = generateMpesaPassword(config.SHORTCODE, config.PASSKEY, timestamp);

    // CRITICAL: Include derivAccount in AccountReference
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
      AccountReference: derivAccount,
      TransactionDesc: `Deposit to ${derivAccount}`,
    };

    console.log('📤 STK Push payload:', JSON.stringify(stkPushPayload, null, 2));

    const stkResponse = await fetch(config.STK_PUSH_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stkPushPayload),
    });

    const stkData = await stkResponse.json();

    if (stkData.ResponseCode === '0') {
      // Store the pending deposit
      await storePendingDeposit({
        checkoutRequestID: stkData.CheckoutRequestID,
        derivAccount: derivAccount,
        phoneNumber: formattedPhone,
        kesAmount: numAmount,
        timestamp: Date.now(),
      });

      console.log('✅ STK Push sent and pending deposit stored');
      
      return NextResponse.json({
        success: true,
        message: 'STK push sent',
        checkoutRequestID: stkData.CheckoutRequestID,
      });

    } else {
      return NextResponse.json(
        { success: false, error: stkData.errorMessage || 'STK push failed' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('💥 M-Pesa error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
