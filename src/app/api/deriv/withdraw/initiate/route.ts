'use client';

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

    // Validate amount
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

    // Get user's OAuth token
    const userToken = await redis.get(`user_token:${account}`);
    
    if (!userToken) {
      console.log('❌ User token not found for account:', account);
      return NextResponse.json(
        { success: false, error: 'User token not found. Please log in again.' },
        { status: 400 }
      );
    }

    console.log('✅ User token found, connecting to Deriv...');

    // Use dynamic import for ws
    const ws = await import('ws');
    const socket = new ws.WebSocket('wss://ws.derivws.com/websockets/v3?app_id=123981');

    const result = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket.close();
        reject(new Error('Verification request timeout'));
      }, 30000); // 30 second timeout

      socket.on('open', () => {
        console.log('🔌 Connected to Deriv WebSocket');
        // First, authorize
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

        // After authorization, request withdrawal verification
        if (response.authorize) {
          console.log('✅ Authorized, requesting withdrawal verification...');
          
          // Request paymentagent_withdraw to trigger verification email
          socket.send(JSON.stringify({
            paymentagent_withdraw: 1,
            amount: parseFloat(amount.toFixed(2)),
            currency: 'USD',
            paymentagent_loginid: process.env.DERIV_PAYMENT_AGENT_ACCOUNT,
            dry_run: 0, // Set to 0 to actually trigger the email
          }));
        }

        // Handle withdrawal response
        if (response.paymentagent_withdraw !== undefined) {
          clearTimeout(timeout);
          socket.close();

          // Check if verification is required
          if (response.paymentagent_withdraw === 2) {
            // Success without verification
            console.log('✅ Withdrawal approved without verification');
            resolve({ success: true, requiresVerification: false });
          } else if (response.error && response.error.code === 'PaymentAgentWithdrawError') {
            // This error means verification email was sent
            console.log('✅ Verification email sent by Deriv');
            resolve({ success: true, requiresVerification: true });
          } else {
            // Some other response
            console.log('⚠️ Unexpected response:', response);
            resolve({ success: true, requiresVerification: true });
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

    console.log('✅ Withdrawal verification email sent');

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your Deriv email',
    });

  } catch (error: any) {
    console.error('❌ Withdrawal initiate error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to initiate withdrawal' },
      { status: 500 }
    );
  }
}
