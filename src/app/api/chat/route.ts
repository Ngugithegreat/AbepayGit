import { chatFlow } from '@/ai/flows/chat-flow';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { history, message } = await req.json();

  if (!message) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  try {
    const response = await chatFlow({
      history,
      message,
    });
    return NextResponse.json({ response });
  } catch (error: any) {
    console.error('Chat API error:', error);
    let errorMessage = 'An error occurred while processing your request.';
    // Check for common API key-related errors
    if (error.message && (error.message.includes('API key not valid') || error.message.includes('API_KEY_INVALID') || error.message.includes('API key not found'))) {
        errorMessage = 'The AI service API key is invalid or missing. Please check your server configuration.';
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
