import { NextRequest, NextResponse } from 'next/server';
import { WebSocket } from 'ws';
import { Redis } from '@upstash/redis';

// This endpoint simulates processing the withdrawal after user provides a verification code
// and then "pays out" the user via M-Pesa.
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

    console.log('PROCESS WITHDRAWAL:', { derivAccount, amount, verificationCode });

    // Step 1: Verify the code with Deriv and complete the transfer
    // In a real scenario, you'd call the 'cashier' API with the verification code.
    // e.g. ws.send(JSON.stringify({ cashier: 1, withdraw: 1, ..., verification_code: verificationCode }));
    // For this demo, we'll accept any code that isn't '000000' (as a test for failure)
    
    if (verificationCode === '000000') {
      console.log('❌ Simulated withdrawal failure: Invalid code');
      return NextResponse.json({ success: false, error: 'Invalid verification code.' }, { status: 400 });
    }
    
    console.log('✅ Deriv verification code accepted (simulated)');

    // Step 2: Now that funds are "withdrawn" from Deriv, send them to the user via M-Pesa B2C
    // TODO: This requires a real M-Pesa B2C API integration.
    // For now, we will simulate this and log it.
    console.log(`📱 M-PESA B2C PAYOUT (SIMULATED): Send ${kesAmount} KES to ${phone}`);


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
      mpesaReceipt: `SIM_${Date.now()}`, // Simulated M-Pesa receipt
      derivAccount: derivAccount,
      phoneNumber: phone,
      transactionId: `deriv_sim_${Date.now()}`,
      timestamp: Date.now(),
      status: 'completed',
    };

    await redis.set(
      `transaction:${transactionId}`,
      JSON.stringify(transaction)
    );

    await redis.lpush(
      `user_transactions:${derivAccount}`,
      transactionId
    );

    console.log('💾 Withdrawal transaction saved:', transactionId);

    return NextResponse.json({ success: true, message: 'Withdrawal processed successfully.' });

  } catch (error: any) {
    console.error('❌ Error processing withdrawal:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
