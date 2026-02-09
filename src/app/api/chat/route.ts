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
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request.' },
      { status: 500 }
    );
  }
}
