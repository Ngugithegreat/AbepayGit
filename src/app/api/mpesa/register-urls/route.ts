import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Starting URL registration with Safaricom (Production)...');
    
    // Production credentials from environment
    const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
    const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
    const SHORTCODE = '4098227'; // Production shortcode
    
    if (!CONSUMER_KEY || !CONSUMER_SECRET) {
      return NextResponse.json(
        { error: 'M-Pesa credentials not configured in environment variables' },
        { status: 500 }
      );
    }

    // Step 1: Get Production OAuth token
    console.log('📝 Getting Production OAuth token...');
    console.log('Using endpoint: https://api.safaricom.co.ke/oauth/v1/generate');
    
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
      console.error('❌ OAuth failed:', errorText);
      return NextResponse.json({
        success: false,
        error: 'Failed to get OAuth token',
        status: authResponse.status,
        details: errorText,
      }, { status: authResponse.status });
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;
    console.log('✅ Got access token, expires in:', authData.expires_in);

    // Step 2: Register URLs using Production endpoint
    console.log('📝 Registering C2B URLs (Production)...');
    console.log('Using endpoint: https://api.safaricom.co.ke/mpesa/c2b/v1/registerurl');
    
    const registerPayload = {
      ShortCode: SHORTCODE,
      ResponseType: 'Completed',
      ConfirmationURL: 'https://abepay-git-auib.vercel.app/api/mpesa/callback',
      ValidationURL: 'https://abepay-git-auib.vercel.app/api/mpesa/validate',
    };

    console.log('📦 Payload:', JSON.stringify(registerPayload, null, 2));

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

    const responseText = await registerResponse.text();
    console.log('📥 Raw response:', responseText);
    console.log('📥 Response status:', registerResponse.status);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      result = { rawResponse: responseText };
    }

    console.log('📥 Parsed response:', JSON.stringify(result, null, 2));

    // Check for success
    if (registerResponse.ok || registerResponse.status === 200) {
      return NextResponse.json({
        success: true,
        message: 'URLs registered successfully with Safaricom!',
        details: result,
        registeredURLs: {
          shortcode: SHORTCODE,
          confirmation: registerPayload.ConfirmationURL,
          validation: registerPayload.ValidationURL,
          responseType: registerPayload.ResponseType,
        },
      });
    } else {
      // Registration failed
      return NextResponse.json({
        success: false,
        error: 'URL registration failed',
        status: registerResponse.status,
        details: result,
        message: 'Please share this error with Safaricom API support',
      }, { status: registerResponse.status });
    }

  } catch (error: any) {
    console.error('💥 Registration error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
