
import { NextRequest, NextResponse } from 'next/server';
import { 
  getMpesaConfig, 
  generateMpesaPassword, 
  generateTimestamp, 
  formatPhoneNumber,
  MPESA_CONFIG 
} from '@/lib/mpesa-config';
import { storePendingDeposit } from '@/lib/pending-deposits';
import { depositSchema as apiDepositSchema } from '@/lib/validation';
import { depositRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const derivAccount = request.cookies.get('deriv_account')?.value;
    if (!derivAccount) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Account not found in session' }, { status: 401 });
    }

    const body = await request.json();

    // 1. Input Validation
    const validated = apiDepositSchema.safeParse({
        ...body,
        amount: Number(body.amount) // ensure amount is a number
    });

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: validated.error.errors[0].message },
        { status: 400 }
      );
    }
    
    const { phone, amount } = validated.data;

    // 2. Rate Limiting
    const identifier = derivAccount; // Rate limit by Deriv account ID
    const { success: limitReached } = await depositRateLimit.limit(identifier);

    if (!limitReached) {
      return NextResponse.json(
        { success: false, error: 'Too many deposit requests. Please try again in an hour.' },
        { status: 429 }
      );
    }

    console.log('💰 Initiating M-Pesa STK Push:', { phone, amount, derivAccount });
    
    const formattedPhone = formatPhoneNumber(phone);

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

    const stkPushPayload = {
      BusinessShortCode: config.SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
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
        kesAmount: amount,
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
