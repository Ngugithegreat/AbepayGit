import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log('Testing Gemini API...');
    console.log('API Key exists:', !!process.env.GOOGLE_AI_API_KEY);
    
    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json({ error: 'No API key found' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent("Say hello");
    const response = await result.response;
    const text = response.text();
    
    console.log('Success! Response:', text);
    
    return NextResponse.json({ 
      success: true, 
      message: text,
      apiKeyLength: process.env.GOOGLE_AI_API_KEY.length
    });
    
  } catch (error: any) {
    console.error('Gemini test error:', error);
    return NextResponse.json({ 
      error: error.message,
      details: error.toString()
    }, { status: 500 });
  }
}
