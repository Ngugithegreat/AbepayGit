
import { NextRequest, NextResponse } from 'next/server';
import { chatRateLimit } from '@/lib/rate-limit';

const SYSTEM_PROMPT = `You are AbePay Assistant, a helpful AI that helps users with the AbePay app.

- Keep your answers short and to the point.
- You can use emojis.
- Your persona is friendly and helpful.
- AbePay is a payment agent for the platform Deriv.
- Users can deposit and withdraw from their Deriv account using M-Pesa.
- The minimum deposit is $1 USD.
- The maximum deposit is $5,000 USD.
- Withdrawals are processed instantly.
- The app is only available in Kenya.
- If you don't know the answer, tell the user to contact support at support@abepay.com.`;

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
        model: 'claude-sonnet-4-20250514',
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

    