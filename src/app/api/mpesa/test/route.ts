import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const consumerKey = 'bCGR2Chy7fYP33xVAE76Act2DkZgldut';
    const consumerSecret = '7seqLATsgmmvpkAa';
    const authUrl = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
    
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    
    console.log('Testing M-Pesa connection...');
    console.log('Auth URL:', authUrl);
    console.log('Authorization header:', `Basic ${auth.substring(0, 20)}...`);
    
    const response = await fetch(authUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });
    
    console.log('Response status:', response.status);
    const text = await response.text();
    console.log('Response body:', text);
    
    return NextResponse.json({
      status: response.status,
      ok: response.ok,
      body: text,
    });
    
  } catch (error: any) {
    console.error('Test error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
