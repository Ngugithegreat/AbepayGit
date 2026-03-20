
import { NextRequest, NextResponse } from 'next/server';
import { chatRateLimit } from '@/lib/rate-limit';

const systemMessage = `You are ABEPAY support assistant with access to the codebase.

CRITICAL ISSUE TO FIX:
There is a login redirect loop. After user enters password and login succeeds, the app redirects to dashboard but then immediately redirects back to login, creating an infinite loop.

Console shows:
- "Login successful! Redirecting..."
- "Navigated to /dashboard"
- Then back to login and repeats

FILES THAT MIGHT CAUSE THIS:
1. src/app/page.tsx - Root page might be redirecting
2. src/app/(protected)/layout.tsx - Auth guard might be failing
3. src/app/create-password/page.tsx - After registration, redirects to login instead of dashboard
4. src/app/login/page.tsx - Login redirect logic

ANALYSIS:
The protected layout checks if user is authenticated. If not, it redirects to login.
The login page successfully verifies password but after redirect, something causes it to go back to login.

LIKELY CAUSES:
1. localStorage not persisting between pages
2. Auth check happening too early before localStorage is ready
3. Root page redirecting even when logged in
4. Create-password page sending user to login instead of dashboard

SOLUTION:
1. Make create-password redirect to /dashboard not /login
2. Add delay in protected layout before checking auth
3. Use window.location.href instead of router.push for login redirect
4. Ensure root page doesn't interfere with dashboard access

You can analyze code and suggest fixes. Be helpful and specific.`;

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
        system: systemMessage,
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
