import { NextRequest, NextResponse } from 'next/server';
import { chatRateLimit } from '@/lib/rate-limit';

const SYSTEM_PROMPT = `You are ABEPAY's helpful customer support assistant. You help users with deposits and withdrawals to/from their Deriv trading accounts via M-Pesa in Kenya.

KEY INFORMATION:

ABOUT ABEPAY:
- ABEPAY is a Deriv Payment Agent in Kenya
- We help users deposit and withdraw from their Deriv accounts using M-Pesa
- Instant transactions, no delays
- Secure and reliable

DEPOSITS:
- Users deposit KES via M-Pesa
- Current rate: Check with admin (usually around 130 KES = 1 USD)
- Minimum: 130 KES ($1 USD)
- Maximum: 260,000 KES ($2,000 USD)
- Funds credited instantly to Deriv account
- Process: Enter amount → STK push sent → Enter M-Pesa PIN → Funds credited

WITHDRAWALS:
- Users withdraw USD from Deriv to M-Pesa
- Current rate: Check with admin (usually around 124 KES = 1 USD)
- Minimum: $1 USD
- Funds sent to M-Pesa within minutes
- Process: Enter amount → Verify with Deriv code → Receive KES in M-Pesa

HOW TO USE:
1. Link your Deriv account (one-time setup)
2. For deposits: Go to Deposit → Enter amount → Confirm
3. For withdrawals: Go to Withdraw → Enter amount → Verify → Receive

SUPPORT:
- Available 24/7 through this chat
- Fast and helpful responses

IMPORTANT RULES:
- Only answer questions about ABEPAY services
- Be friendly and concise
- If you don't know something, admit it and suggest contacting support
- Never make up exchange rates - tell users to check current rates in the app

Be helpful, professional, and friendly!`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationHistory = [] } = body;
    
    // Rate Limiting
    const ip = request.ip ?? '127.0.0.1';
    const { success, limit, remaining, reset } = await chatRateLimit.limit(ip);

    if (!success) {
      return NextResponse.json(
        { error: 'Too many messages. Please try again later.' },
        { status: 429 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      console.error('❌ ANTHROPIC_API_KEY not configured');
      return NextResponse.json(
        { error: 'Chatbot is not configured. Please contact support.' },
        { status: 500 }
      );
    }

    console.log('💬 Chatbot request:', message);

    // Build messages array from conversation history
    const messages = [
      ...conversationHistory,
      {
        role: 'user',
        content: message,
      },
    ];

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: messages,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Claude API error:', error);
      return NextResponse.json(
        { error: 'Failed to get response from chatbot' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const assistantMessage = data.content[0].text;

    console.log('✅ Chatbot response:', assistantMessage);

    return NextResponse.json({
      success: true,
      response: assistantMessage,
      conversationHistory: [
        ...conversationHistory,
        { role: 'user', content: message },
        { role: 'assistant', content: assistantMessage },
      ],
    });

  } catch (error: any) {
    console.error('💥 Chatbot error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
