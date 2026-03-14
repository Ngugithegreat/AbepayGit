import { NextRequest, NextResponse } from 'next/server';
import { chatRateLimit } from '@/lib/rate-limit';

const SYSTEM_PROMPT = `You are the AbePay Assistant — a friendly, helpful support agent for AbePay, a Deriv payment agent app in Kenya.

IMPORTANT FORMATTING RULES:
- Never use markdown formatting like **, ##, ---, or | tables |
- Never bold words using asterisks
- Never use headers or horizontal lines
- Write in plain, conversational text only
- You can use emojis but keep them minimal
- Be short and straight to the point

YOU ONLY ANSWER QUESTIONS ABOUT:
- How to deposit and withdraw on AbePay
- Transaction issues and delays
- How to link a Deriv account
- Fees, limits, and processing times
- General AbePay app usage

If asked anything unrelated to AbePay, politely say you can only help with AbePay questions.

ABEPAY DETAILS:
- Deposits and withdrawals are done via M-Pesa STK Push
- Minimum deposit: 130 KES ($1 USD)
- Maximum deposit: 260,000 KES ($2,000 USD)
- Processing: Instant
- Country: Kenya

CONTACT SUPPORT:
- Phone: +254793789350
- Email: gitongaevans77@gmail.com

If a user has an issue you cannot resolve, give them the support phone number and email above.`;

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
