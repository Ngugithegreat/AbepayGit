import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, account } = body;

    console.log('💸 Initiating withdrawal verification request...');
    console.log('Amount:', amount, 'USD');
    console.log('Account:', account);

    if (!amount || !account) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (amount < 1 || amount > 2000) {
      return NextResponse.json(
        { success: false, error: 'Amount must be between $1 and $2,000' },
        { status: 400 }
      );
    }

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    const userToken = await redis.get(`user_token:${account}`);
    
    if (!userToken) {
      console.log('❌ User token not found');
      return NextResponse.json(
        { success: false, error: 'User token not found. Please log in again.' },
        { status: 400 }
      );
    }

    console.log('✅ User token found, requesting verification email...');

    const ws = await import('ws');
    const socket = new ws.WebSocket('wss://ws.derivws.com/websockets/v3?app_id=123981');

    const result = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket.close();
        reject(new Error('Request timeout'));
      }, 30000);

      socket.on('open', () => {
        console.log('🔌 Connected to Deriv');
        socket.send(JSON.stringify({
          authorize: userToken,
        }));
      });

      socket.on('message', (data: any) => {
        const response = JSON.parse(data.toString());
        console.log('📨 Deriv response:', JSON.stringify(response, null, 2));

        if (response.error) {
          clearTimeout(timeout);
          socket.close();
          console.log('❌ Deriv error:', response.error);
          reject(new Error(response.error.message));
          return;
        }

        if (response.authorize) {
          console.log('✅ Authorized, requesting verification email...');
          
          // Request verification email for paymentagent_withdraw
          socket.send(JSON.stringify({
            verify_email: response.authorize.email,
            type: 'paymentagent_withdraw',
          }));
        }

        if (response.verify_email) {
          clearTimeout(timeout);
          socket.close();
          
          if (response.verify_email === 1) {
            console.log('✅ Verification email sent successfully!');
            resolve({ success: true });
          } else {
            console.log('⚠️ Unexpected verify_email response:', response);
            resolve({ success: true });
          }
        }
      });

      socket.on('error', (error: any) => {
        clearTimeout(timeout);
        socket.close();
        console.log('❌ WebSocket error:', error);
        reject(error);
      });
    });

    console.log('✅ Verification email request completed');

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your Deriv email',
    });

  } catch (error: any) {
    console.error('❌ Withdrawal initiate error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send verification email' },
      { status: 500 }
    );
  }
}
