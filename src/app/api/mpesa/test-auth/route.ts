import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
    const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
    
    console.log('Testing M-Pesa auth...');
    console.log('Consumer Key exists:', !!CONSUMER_KEY);
    console.log('Consumer Secret exists:', !!CONSUMER_SECRET);
    console.log('Consumer Key length:', CONSUMER_KEY?.length);
    console.log('Consumer Secret length:', CONSUMER_SECRET?.length);
    console.log('Consumer Key (first 10):', CONSUMER_KEY?.substring(0, 10));
    console.log('Consumer Secret (first 10):', CONSUMER_SECRET?.substring(0, 10));
    
    if (!CONSUMER_KEY || !CONSUMER_SECRET) {
      return NextResponse.json({
        error: 'M-Pesa credentials not configured',
        hasKey: !!CONSUMER_KEY,
        hasSecret: !!CONSUMER_SECRET,
      }, { status: 500 });
    }

    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
    
    console.log('Calling M-Pesa OAuth...');
    
    const response = await fetch(
      'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
        },
      }
    );

    console.log('Response status:', response.status);
    const text = await response.text();
    console.log('Response body:', text);

    if (response.ok) {
      const data = JSON.parse(text);
      return NextResponse.json({
        success: true,
        message: 'Credentials are valid!',
        tokenLength: data.access_token?.length,
        expiresIn: data.expires_in,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Auth failed',
        status: response.status,
        body: text,
      }, { status: response.status });
    }

  } catch (error: any) {
    console.error('Test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
