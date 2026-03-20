import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, kesAmount, phone, verificationCode, account } = body;

    console.log('💸 Processing withdrawal with verification code...');

    if (!amount || !phone || !verificationCode || !account) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
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
      return NextResponse.json(
        { success: false, error: 'User token not found' },
        { status: 400 }
      );
    }

    console.log('🔐 Verifying withdrawal with Deriv...');

    // Connect to Deriv WebSocket to verify and withdraw
    const ws = await import('ws');
    const socket = new ws.WebSocket('wss://ws.derivws.com/websockets/v3?app_id=123981');

    const withdrawResult = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket.close();
        reject(new Error('Withdrawal verification timeout'));
      }, 30000);

      socket.on('open', () => {
        // Authorize first
        socket.send(JSON.stringify({
          authorize: userToken,
        }));
      });

      socket.on('message', (data: any) => {
        const response = JSON.parse(data.toString());

        if (response.error) {
          clearTimeout(timeout);
          socket.close();
          reject(new Error(response.error.message));
          return;
        }

        // After authorization, request paymentagent_withdraw with verification code
        if (response.authorize) {
          console.log('✅ Authorized, requesting withdrawal with verification...');
          socket.send(JSON.stringify({
            paymentagent_withdraw: 1,
            amount: parseFloat(amount.toFixed(2)),
            currency: 'USD',
            paymentagent_loginid: process.env.DERIV_PAYMENT_AGENT_ACCOUNT,
            verification_code: verificationCode, // ← The code from email
            dry_run: 0,
          }));
        }

        // Handle withdrawal response
        if (response.paymentagent_withdraw) {
          clearTimeout(timeout);
          socket.close();

          if (response.paymentagent_withdraw === 2) {
            // Success!
            console.log('✅ Withdrawal verified and approved by Deriv!');
            resolve({ success: true, transaction_id: response.paymentagent_withdraw });
          } else {
            reject(new Error('Withdrawal failed'));
          }
        }
      });

      socket.on('error', (error: any) => {
        clearTimeout(timeout);
        socket.close();
        reject(error);
      });
    });

    console.log('✅ Deriv withdrawal successful, sending M-Pesa...');

    // Now send money via M-Pesa B2C
    const b2cResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/b2c`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: phone,
        amount: kesAmount,
        account: account,
      }),
    });

    const b2cData = await b2cResponse.json();

    if (!b2cData.success) {
      console.error('❌ M-Pesa B2C failed:', b2cData.error);
      
      // Store failed withdrawal for manual processing
      await redis.set(
        `failed_withdrawal:${Date.now()}`,
        JSON.stringify({
          account,
          phone,
          amount,
          kesAmount,
          error: b2cData.error,
          timestamp: new Date().toISOString(),
        }),
        { ex: 86400 * 7 } // Keep for 7 days
      );

      return NextResponse.json(
        { success: false, error: 'M-Pesa transfer failed. Contact support.' },
        { status: 500 }
      );
    }

    console.log('✅ Withdrawal complete!');

    // Store withdrawal transaction
    const withdrawalTx = {
      id: `withdrawal_${Date.now()}`,
      type: 'withdrawal',
      account: account,
      usdAmount: amount,
      kesAmount: kesAmount,
      phone: phone,
      status: 'completed',
      timestamp: new Date().toISOString(),
      mpesaReceipt: b2cData.conversationId,
    };

    await redis.set(
      `transaction:withdrawal:${Date.now()}`,
      JSON.stringify(withdrawalTx),
      { ex: 86400 * 90 }
    );

    // Add to user transactions
    const userTxKey = `user_transactions:${account}`;
    const existingTxs = await redis.get(userTxKey) || '[]';
    const txArray = JSON.parse(existingTxs as string);
    txArray.unshift(withdrawalTx);
    await redis.set(userTxKey, JSON.stringify(txArray.slice(0, 100)));

    return NextResponse.json({
      success: true,
      message: 'Withdrawal successful',
      transaction: withdrawalTx,
    });

  } catch (error: any) {
    console.error('❌ Withdrawal process error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Withdrawal failed' },
      { status: 500 }
    );
  }
}
