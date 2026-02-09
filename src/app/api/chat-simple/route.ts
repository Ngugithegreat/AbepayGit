import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a helpful support assistant for ABEPAY, a Deriv Payment Agent service in Kenya.

Exchange rates:
- Deposits: 130 KES = 1 USD
- Withdrawals: 124 KES = 1 USD
- Limits: $1 - $5,000 USD

You help with:
- Deposit/withdrawal processes
- Linking Deriv accounts
- Exchange rates
- Troubleshooting

Be concise and helpful. Only answer ABEPAY-related questions.`;

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const fullPrompt = `${SYSTEM_PROMPT}\n\nUser: ${message}\n\nAssistant:`;
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ response: text });

  } catch (error: any) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate response" },
      { status: 500 }
    );
  }
}
