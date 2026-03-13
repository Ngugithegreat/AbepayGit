import { NextRequest, NextResponse } from 'next/server';
import { WebSocket } from 'ws';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ success: false, error: 'Token is required' }, { status: 400 });
    }

    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${process.env.NEXT_PUBLIC_DERIV_APP_ID}`);

    const userInfo = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Timeout connecting to Deriv'));
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

    return NextResponse.json({ success: true, user: userInfo });
  } catch (error: any) {
    console.error('User Info fetch error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
