import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Starting URL registration with Safaricom...');
    
    // Production credentials
    const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
    const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
    const SHORTCODE = process.env.MPESA_SHORTCODE || '4098227';
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://abepay-git-auib.vercel.app';
    
    if (!CONSUMER_KEY || !CONSUMER_SECRET) {
      return NextResponse.json(
        { error: 'M-Pesa credentials not configured' },
        { status: 500 }
      );
    }

    // Step 1: Get OAuth token
    console.log('📝 Getting OAuth token...');
    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
    
    const authResponse = await fetch(
      'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
        },
      }
    );

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error('Auth failed:', errorText);
      throw new Error(`Auth failed: ${errorText}`);
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;
    console.log('✅ Got access token');

    // Step 2: Register URLs
    console.log('📝 Registering callback URLs...');
    
    const registerPayload = {
      ShortCode: SHORTCODE,
      ResponseType: 'Completed',
      ConfirmationURL: `${APP_URL}/api/mpesa/callback`,
      ValidationURL: `${APP_URL}/api/mpesa/validate`,
    };

    console.log('Payload:', JSON.stringify(registerPayload, null, 2));

    const registerResponse = await fetch(
      'https://api.safaricom.co.ke/mpesa/c2b/v1/registerurl',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerPayload),
      }
    );

    const result = await registerResponse.json();
    console.log('📥 Registration response:', result);

    if (registerResponse.ok && result.ResponseCode === '0') {
      return NextResponse.json({
        success: true,
        message: 'URLs registered successfully!',
        details: result,
        registeredURLs: {
          confirmation: registerPayload.ConfirmationURL,
          validation: registerPayload.ValidationURL,
        },
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.ResponseDescription || 'Registration failed',
        details: result,
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('💥 Registration error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        stack: error.stack 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check current configuration
export async function GET() {
  return NextResponse.json({
    message: 'Use POST to register URLs',
    currentConfig: {
      shortcode: process.env.MPESA_SHORTCODE || '4098227',
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://abepay-git-auib.vercel.app',
      confirmationURL: `${process.env.NEXT_PUBLIC_APP_URL || 'https://abepay-git-auib.vercel.app'}/api/mpesa/callback`,
      validationURL: `${process.env.NEXT_PUBLIC_APP_URL || 'https://abepay-git-auib.vercel.app'}/api/mpesa/validate`,
    },
    instructions: 'Send POST request to this endpoint to register URLs with Safaricom',
  });
}
