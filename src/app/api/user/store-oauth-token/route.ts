import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export async function POST(request: NextRequest) {
  try {
    const { token, accounts } = await request.json();

    if (!token || !accounts) {
      return NextResponse.json(
        { success: false, error: 'Token and accounts required' },
        { status: 400 }
      );
    }

    // Get user info using the OAuth token
    const { WebSocket } = await import('ws');
    const ws = new WebSocket(
      `wss://ws.derivws.com/websockets/v3?app_id=${process.env.NEXT_PUBLIC_DERIV_APP_ID}`
    );

    const userInfo = await new Promise<any>((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Timeout connecting to Deriv to get user info'));
      }, 10000);

      ws.on('open', () => {
        ws.send(JSON.stringify({ authorize: token }));
      });

      ws.on('message', (data: any) => {
        const response = JSON.parse(data.toString());

        if (response.error) {
          clearTimeout(timeout);
          ws.close();
          reject(new Error(response.error.message));
          return;
        }

        if (response.authorize) {
          clearTimeout(timeout);
          ws.close();
          resolve(response.authorize);
        }
      });

      ws.on('error', (error) => {
        clearTimeout(timeout);
        ws.close();
        reject(error);
      });
    });

    if (!userInfo || !userInfo.loginid) {
        throw new Error("Could not retrieve user information from Deriv.");
    }
    
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    // Store OAuth token for this account, to be used by backend APIs
    await redis.set(`user_token:${userInfo.loginid}`, token);
    
    // Store user info
    await redis.set(`user_info:${userInfo.loginid}`, JSON.stringify({
      email: userInfo.email,
      name: userInfo.fullname,
      account: userInfo.loginid,
      currency: userInfo.currency,
      created: Date.now(),
    }));

    console.log(`✅ Stored OAuth token for ${userInfo.loginid}`);
    console.log(`💰 Initial balance from Deriv: ${userInfo.balance}`);

    return NextResponse.json({
      success: true,
      user: userInfo,
    });

  } catch (error: any) {
    console.error('❌ Token storage error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
