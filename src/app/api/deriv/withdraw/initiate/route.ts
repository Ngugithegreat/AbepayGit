'use client';
import { NextRequest, NextResponse } from 'next/server';

// This endpoint simulates initiating a withdrawal from Deriv,
// which would typically send a verification email to the user.
export async function POST(request: NextRequest) {
  try {
    const userToken = request.cookies.get('deriv_token')?.value;

    if (!userToken) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Missing token' }, { status: 401 });
    }

    const { amount } = await request.json();
    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 });
    }

    console.log('💸 Initiating withdrawal request for user...');

    // In a real scenario, you would call Deriv's 'cashier' API
    // with the provider set to 'send_email' or similar to trigger the verification code.
    // e.g. ws.send(JSON.stringify({ cashier: 1, withdraw: 1, provider: 'send_email', amount: amount }));
    
    // For this demo, we will just simulate a successful initiation.
    const { WebSocket } = await import('ws');
    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${process.env.NEXT_PUBLIC_DERIV_APP_ID}`);
    
    const wsAuth = new Promise<boolean>((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('Timeout connecting to Deriv WS'));
        }, 10000);

        ws.on('open', () => {
            ws.send(JSON.stringify({ authorize: userToken }));
        });
        ws.on('message', (data) => {
            const response = JSON.parse(data.toString());
            if (response.error) {
                clearTimeout(timeout);
                ws.close();
                reject(new Error(response.error.message));
            }
            if (response.authorize) {
                clearTimeout(timeout);
                ws.close();
                resolve(true);
            }
        });
        ws.on('error', (err) => {
            clearTimeout(timeout);
            ws.close();
            reject(err);
        });
    });

    await wsAuth;

    console.log('✅ Simulated Deriv withdrawal initiation successfully.');

    // This simulates that Deriv has accepted the request and sent an email.
    return NextResponse.json({ success: true, message: 'Verification email sent.' });

  } catch (error: any) {
    console.error('❌ Error initiating withdrawal:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
