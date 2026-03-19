import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export async function POST(request: NextRequest) {
  try {
    const userToken = request.cookies.get('deriv_token')?.value;
    const derivAccount = request.cookies.get('deriv_account')?.value;

    if (!userToken || !derivAccount) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Missing session data' }, { status: 401 });
    }

    const { amount, kesAmount, phone, verificationCode } = await request.json();

    if (!amount || !kesAmount || !phone || !verificationCode) {
      return NextResponse.json({ success: false, error: 'Missing required withdrawal data' }, { status: 400 });
    }

    console.log('💸 Processing withdrawal:', { derivAccount, amount, kesAmount, phone });

    // Step 1: Verify code with Deriv and deduct balance
    const { WebSocket } = await import('ws');
    const ws = new WebSocket(
      `wss://ws.derivws.com/websockets/v3?app_id=${process.env.NEXT_PUBLIC_DERIV_APP_ID}`
    );

    const derivResult = await new Promise<any>((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Timeout'));
      }, 30000);

      ws.on('open', () => {
        ws.send(JSON.stringify({ authorize: userToken }));
      });

      let authorized = false;

      ws.on('message', (data: any) => {
        const response = JSON.parse(data.toString());
        console.log('📥 Deriv response:', response);

        if (response.error) {
          clearTimeout(timeout);
          ws.close();
          reject(new Error(response.error.message));
          return;
        }

        if (response.authorize && !authorized) {
          authorized = true;
          console.log('✅ Authorized, processing withdrawal with verification code...');

          // Process withdrawal with verification code
          ws.send(JSON.stringify({
            paymentagent_withdraw: 1,
            amount: amount,
            currency: 'USD',
            verification_code: verificationCode,
          }));
          return;
        }

        if (response.paymentagent_withdraw) {
          clearTimeout(timeout);
          ws.close();

          if (response.paymentagent_withdraw.paymentagent_name) {
             console.log('✅ Deriv withdrawal successful');
             resolve({
                success: true,
                transaction_id: response.paymentagent_withdraw.transaction_id,
             });
          } else {
             reject(new Error("Withdrawal failed. The code may be incorrect or expired."));
          }
        }
      });

      ws.on('error', (error) => {
        clearTimeout(timeout);
        ws.close();
        reject(error);
      });
    });

    // Step 2: Send KES to user's M-Pesa via B2C
    console.log('💰 Sending KES to M-Pesa:', kesAmount, phone);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const b2cResponse = await fetch(`${appUrl}/api/mpesa/b2c`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: phone,
        amount: kesAmount,
        account: derivAccount,
      }),
    });

    const b2cData = await b2cResponse.json();

    if (!b2cData.success) {
      console.error('❌ M-Pesa B2C failed:', b2cData.error);
      
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });
      await redis.set(`failed_withdrawal:${Date.now()}`, JSON.stringify({
        account: derivAccount,
        amount,
        kesAmount,
        phone,
        derivTxId: derivResult.transaction_id,
        error: b2cData.error,
        timestamp: Date.now(),
      }), { ex: 86400 * 7 }); // Keep for 7 days

      return NextResponse.json({
        success: false,
        error: 'Payment processing failed. Please contact support with reference: ' + derivResult.transaction_id,
      }, { status: 500 });
    }

    // Step 3: Record the transaction in Redis
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    const transactionId = `WTH-${Date.now()}`;
    const transaction = {
      id: transactionId,
      type: 'withdrawal',
      kesAmount,
      usdAmount: amount,
      mpesaReceipt: b2cData.conversationId, 
      derivAccount: derivAccount,
      phoneNumber: phone,
      transactionId: derivResult.transaction_id,
      timestamp: Date.now(),
      status: 'processing', // Will be updated by b2c-result callback
    };

    await redis.set(`transaction:${transactionId}`, JSON.stringify(transaction));
    await redis.lpush(`user_transactions:${derivAccount}`, transactionId);

    console.log('💾 Withdrawal transaction saved:', transactionId);
    console.log('✅ Withdrawal complete!');

    return NextResponse.json({
      success: true,
      message: 'Withdrawal successful',
      kesAmount,
      phone,
    });

  } catch (error: any) {
    console.error('❌ Withdrawal process error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
