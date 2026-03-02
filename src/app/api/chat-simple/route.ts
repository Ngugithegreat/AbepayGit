import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are ABEPAY's helpful assistant. You help users with:

ABOUT ABEPAY:
- ABEPAY is a Deriv Payment Agent in Kenya
- We help users deposit and withdraw from their Deriv trading accounts via M-Pesa

DEPOSITS:
- Users can deposit KES via M-Pesa
- Exchange rate: 130 KES = 1 USD
- Minimum: 1 USD ($130 KES)
- Maximum: $5,000 USD
- Instant crediting to Deriv account

WITHDRAWALS:
- Users can withdraw USD to M-Pesa
- Exchange rate: 124 KES = 1 USD
- Minimum: 1 USD
- Processed within minutes

HOW TO USE:
1. Link your Deriv account
2. Go to Deposit/Withdraw
3. Enter amount
4. Confirm transaction
5. Funds transfer instantly

SUPPORT:
- Email: gitongaevans77@gmail
- Available 24/7
-Whatsapp/calls : +254793789350/+254721759357

You ONLY answer questions about ABEPAY. For other topics, politely redirect to ABEPAY services.

Be friendly, concise, and helpful!`;

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
