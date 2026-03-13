
export async function calculateBalanceFromTransactions(clientAccount: string): Promise<number> {
  const { WebSocket } = await import('ws');
  const apiToken = process.env.DERIV_PAYMENT_AGENT_TOKEN;
  
  const ws = new WebSocket(
    `wss://ws.derivws.com/websockets/v3?app_id=${process.env.NEXT_PUBLIC_DERIV_APP_ID}`
  );

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('Timeout'));
    }, 15000);

    ws.on('open', () => {
      ws.send(JSON.stringify({ authorize: apiToken }));
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
        // Get payment agent statement (shows all our transfers)
        ws.send(JSON.stringify({
          statement: 1,
          description: 1,
          limit: 1000,
        }));
      }

      if (response.statement) {
        clearTimeout(timeout);
        ws.close();

        // Calculate balance from transactions
        let balance = 0;
        
        response.statement.transactions.forEach((tx: any) => {
          // Look for transfers to this client
          if (tx.action_type === 'transfer' && 
              tx.longcode && 
              tx.longcode.includes(clientAccount)) {
            balance += parseFloat(tx.amount);
          }
        });

        resolve(balance);
      }
    });

    ws.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}
