import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, kesAmount, phone, verificationCode, account } = body;

    console.log('💸 Processing withdrawal with verification...');
    console.log('Amount:', amount, 'USD');
    console.log('KES Amount:', kesAmount);
    console.log('Phone:', phone);
    console.log('Verification Code:', verificationCode ? '***PROVIDED***' : 'MISSING');

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

    // Use dynamic import for ws
    const ws = await import('ws');
    const socket = new ws.WebSocket('wss://ws.derivws.com/websockets/v3?app_id=123981');

    const withdrawResult = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket.close();
        reject(new Error('Withdrawal verification timeout'));
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

        if (response.authorize) {
          console.log('✅ Authorized, submitting withdrawal with verification code...');
          socket.send(JSON.stringify({
            paymentagent_withdraw: 1,
            amount: parseFloat(amount.toFixed(2)),
            currency: 'USD',
            paymentagent_loginid: process.env.DERIV_PAYMENT_AGENT_ACCOUNT,
            verification_code: verificationCode,
            dry_run: 0,
          }));
        } else if (response.paymentagent_withdraw !== undefined) {
          clearTimeout(timeout);
          socket.close();

          // Check if it's a success (paymentagent_withdraw: 1 and has transaction_id)
          if (response.paymentagent_withdraw === 1 && response.transaction_id) {
            console.log('✅ Withdrawal verified and approved by Deriv!');
            console.log('Transaction ID:', response.transaction_id);
            resolve({ 
              success: true, 
              transaction_id: response.transaction_id,
              paymentagent_name: response.paymentagent_name 
            });
          } else if (response.error) {
            console.log('❌ Withdrawal error:', response.error);
            reject(new Error(response.error.message));
          } else {
            console.log('❌ Withdrawal failed:', response);
            reject(new Error('Withdrawal verification failed'));
          }
        } else if (response.error) {
          clearTimeout(timeout);
          socket.close();
          console.log('❌ Deriv error:', response.error.message);
          reject(new Error(response.error.message));
          return;
        }
      });

      socket.on('error', (error: any) => {
        clearTimeout(timeout);
        socket.close();
        reject(error);
      });
    });

    console.log('✅ Deriv withdrawal successful, sending M-Pesa...');

    // Send money via M-Pesa B2C
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
        { ex: 86400 * 7 }
      );

      return NextResponse.json(
        { success: false, error: 'Deriv withdrawal succeeded but M-Pesa transfer failed. Contact support.' },
        { status: 500 }
      );
    }

    console.log('✅ M-Pesa sent! Withdrawal complete!');

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
      mpesaReceipt: b2cData.conversationId || b2cData.OriginatorConversationID,
    };

    await redis.set(
      `transaction:withdrawal:${Date.now()}`,
      JSON.stringify(withdrawalTx),
      { ex: 86400 * 90 }
    );

    // Store transaction with better error handling
    try {
      const userTxKey = `user_transactions:${account}`;
      
      // Try to get existing transactions
      let txArray = [];
      try {
        const existingTxs = await redis.get(userTxKey);
        if (existingTxs && typeof existingTxs === 'string') {
          txArray = JSON.parse(existingTxs);
        } else if (Array.isArray(existingTxs)) {
          txArray = existingTxs;
        }
      } catch (e) {
        console.log('⚠️ Could not parse existing transactions, starting fresh');
        // Delete the corrupted key
        await redis.del(userTxKey);
        txArray = [];
      }
      
      // Add new transaction
      txArray.unshift(withdrawalTx);
      
      // Save back to Redis
      await redis.set(userTxKey, JSON.stringify(txArray.slice(0, 100)));
      console.log('✅ Transaction saved to user history');
    } catch (storageError) {
      console.error('⚠️ Failed to save to transaction history:', storageError);
      // Don't fail the whole withdrawal for this
    }

    return NextResponse.json({
      success: true,
      message: 'Withdrawal successful',
      transaction: withdrawalTx,
    });

  } catch (error: any) {
    console.error('❌ Withdrawal process error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Withdrawal failed. Please check the verification code.' },
      { status: 500 }
    );
  }
}
