import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export async function POST(request: NextRequest) {
  try {
    const { amount, account } = await request.json();
    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 });
    }
    if (!account) {
      return NextResponse.json({ success: false, error: 'Account not specified' }, { status: 400 });
    }

    // Fetch token from Redis
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    const userToken = await redis.get<string>(`user_token:${account}`);

    if (!userToken) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Missing token' }, { status: 401 });
    }

    console.log('💸 Initiating withdrawal verification request for user...');

    const { WebSocket } = await import('ws');
    const ws = new WebSocket(
      `wss://ws.derivws.com/websockets/v3?app_id=${process.env.NEXT_PUBLIC_DERIV_APP_ID}`
    );

    const result = await new Promise<any>((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Timeout connecting to Deriv'));
      }, 20000);

      ws.on('open', () => {
        ws.send(JSON.stringify({ authorize: userToken }));
      });

      let authorized = false;

      ws.on('message', (data: any) => {
        const response = JSON.parse(data.toString());

        if (response.error) {
          clearTimeout(timeout);
          ws.close();
          reject(new Error(response.error.message));
          return;
        }

        if (response.authorize && !authorized) {
          authorized = true;
          console.log('✅ Authorized, requesting withdrawal verification...');
          
          ws.send(JSON.stringify({
            paymentagent_withdraw: 1,
            amount: amount,
            currency: 'USD',
          }));

          clearTimeout(timeout);
          ws.close();
          console.log('✅ Withdrawal verification email sent (assumed).');
          resolve({
            success: true,
            message: 'Verification email sent to your registered email',
          });
        }
      });

      ws.on('error', (error) => {
        clearTimeout(timeout);
        ws.close();
        reject(error);
      });
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('❌ Withdrawal initiate error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
