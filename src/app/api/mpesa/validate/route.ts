import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('✅ Validation request received:', JSON.stringify(body, null, 2));
    
    // Safaricom requires this exact format with HTTP 200
    return NextResponse.json(
      {
        ResultCode: 0,
        ResultDesc: "Accepted"
      },
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('❌ Validation error:', error);
    
    // Even on error, return acceptance to avoid blocking transactions
    return NextResponse.json(
      {
        ResultCode: 0,
        ResultDesc: "Accepted"
      },
      { status: 200 }
    );
  }
}
