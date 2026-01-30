import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { apiToken } = await request.json();

  if (!apiToken) {
    return NextResponse.json({ error: 'API Token is required.' }, { status: 400 });
  }

  const paymentAgentToken = process.env.DERIV_API_TOKEN;
  const appId = process.env.DERIV_APP_ID;

  console.log(`Using Payment Agent Token (server-side): ${paymentAgentToken}`);
  console.log(`Using App ID (server-side): ${appId}`);
  console.log(`Validating User's API Token (from client): ${apiToken}`);

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Simulate a successful validation
  if (apiToken === 'invalid-token') { // Example of how to handle an invalid token
      return NextResponse.json({ error: 'Invalid API Token.' }, { status: 401 });
  }

  const mockAccountDetails = {
    isLinked: true,
    linkedAccountId: 'CR1234567',
    linkedAccountName: 'Real User',
    linkedAccountBalance: 2500.50,
  };

  return NextResponse.json(mockAccountDetails);
}
