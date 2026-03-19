import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export async function GET(request: NextRequest) {
  try {
    const account = request.nextUrl.searchParams.get('account');

    console.log('💰 Fetching REAL balance for:', account);
    
    if (!account) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Account not found in request' },
        { status: 401 }
      );
    }
    
    // Fetch token from Redis
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    const userToken = await redis.get(`user_token:${account}`);

    if (!userToken) {
      return NextResponse.json(
        { success: false, error: 'User token not found. Please re-link account.' },
        { status: 401 }
      );
    }

    console.log('✅ Found user token, fetching balance from Deriv...');

    // Fetch REAL balance from Deriv using user's token
    const { WebSocket } = await import('ws');
    const ws = new WebSocket(
      `wss://ws.derivws.com/websockets/v3?app_id=${process.env.NEXT_PUBLIC_DERIV_APP_ID}`
    );

    const balance = await new Promise<number>((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Timeout'));
      }, 10000);

      ws.on('open', () => {
        console.log('🔌 Connected to Deriv');
        ws.send(JSON.stringify({ authorize: userToken }));
      });

      ws.on('message', (data: any) => {
        const response = JSON.parse(data.toString());
        console.log('📥 Deriv response:', response);

        if (response.error) {
          clearTimeout(timeout);
          ws.close();
          reject(new Error(response.error.message));
          return;
        }

        if (response.authorize) {
          console.log('✅ Authorized as:', response.authorize.loginid);
          console.log('💰 Real balance:', response.authorize.balance);
          
          clearTimeout(timeout);
          ws.close();
          resolve(parseFloat(response.authorize.balance));
        }
      });

      ws.on('error', (error) => {
        clearTimeout(timeout);
        ws.close();
        reject(error);
      });
    });

    console.log(`✅ REAL balance for ${account}: $${balance}`);

    return NextResponse.json({
      success: true,
      balance: balance,
      account: account,
      source: 'deriv_api',
    });

  } catch (error: any) {
    console.error('❌ Balance fetch error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
