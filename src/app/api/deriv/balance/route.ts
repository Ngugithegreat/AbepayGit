import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Balance API called');
    
    // Get the account to check balance for
    const account = request.nextUrl.searchParams.get('account');
    
    console.log('📋 Requested account:', account);
    
    if (!account) {
      return NextResponse.json(
        { success: false, error: 'Account not specified' },
        { status: 400 }
      );
    }

    const apiToken = process.env.DERIV_PAYMENT_AGENT_TOKEN;

    if (!apiToken) {
      console.error('❌ No API token configured');
      return NextResponse.json(
        { success: false, error: 'API token not configured' },
        { status: 500 }
      );
    }

    console.log('✅ API token found');

    // Connect to Deriv WebSocket
    const { WebSocket } = await import('ws');
    const wsUrl = `wss://ws.derivws.com/websockets/v3?app_id=${process.env.NEXT_PUBLIC_DERIV_APP_ID}`;
    
    console.log('🔌 Connecting to:', wsUrl);
    
    const ws = new WebSocket(wsUrl);

    const balanceData = await new Promise<{ balance: number; currency: string; loginid: string }>((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Connection timeout after 15 seconds'));
      }, 15000);

      let authorized = false;
      let switched = false;

      ws.on('open', () => {
        console.log('🔌 WebSocket connected');
        console.log('🔑 Sending authorize request...');
        ws.send(JSON.stringify({ authorize: apiToken }));
      });

      ws.on('message', (data: any) => {
        const response = JSON.parse(data.toString());
        console.log('📥 Received from Deriv:', JSON.stringify(response, null, 2));

        if (response.error) {
          console.error('❌ Deriv error:', response.error);
          clearTimeout(timeout);
          ws.close();
          reject(new Error(response.error.message));
          return;
        }

        // Step 1: Authorization
        if (response.authorize && !authorized) {
          authorized = true;
          console.log('✅ Authorized successfully');
          console.log('📋 Current loginid:', response.authorize.loginid);
          console.log('📋 Account list:', response.authorize.account_list);
          console.log('💰 Current balance:', response.authorize.balance);
          console.log('💱 Currency:', response.authorize.currency);
          
          // Check if we need to switch accounts
          if (response.authorize.loginid === account) {
            console.log('✅ Already on correct account, requesting balance...');
            ws.send(JSON.stringify({ balance: 1, subscribe: 0 }));
          } else {
            console.log(`🔄 Switching from ${response.authorize.loginid} to ${account}...`);
            ws.send(JSON.stringify({ account_switch: account }));
          }
        }

        // Step 2: Account switch confirmation
        if (response.account_switch && !switched) {
          switched = true;
          console.log('✅ Account switched to:', response.account_switch.loginid);
          console.log('💰 New balance:', response.account_switch.balance);
          console.log('💱 Currency:', response.account_switch.currency);
          
          // Now request balance for this account
          console.log('📊 Requesting balance...');
          ws.send(JSON.stringify({ balance: 1, subscribe: 0 }));
        }

        // Step 3: Balance response
        if (response.balance) {
          clearTimeout(timeout);
          ws.close();
          
          console.log('💰 Balance received!');
          console.log('   Amount:', response.balance.balance);
          console.log('   Currency:', response.balance.currency);
          console.log('   Account:', response.balance.loginid);
          
          resolve({
            balance: parseFloat(response.balance.balance),
            currency: response.balance.currency,
            loginid: response.balance.loginid,
          });
        }
      });

      ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        clearTimeout(timeout);
        ws.close();
        reject(error);
      });

      ws.on('close', () => {
        console.log('🔌 WebSocket closed');
      });
    });

    console.log('✅ Final balance data:', balanceData);

    return NextResponse.json({
      success: true,
      balance: balanceData.balance,
      currency: balanceData.currency,
      account: balanceData.loginid,
    });

  } catch (error: any) {
    console.error('❌ Balance fetch error:', error.message);
    console.error('Stack:', error.stack);
    
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
