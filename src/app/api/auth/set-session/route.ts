import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, account, email, name } = body;

    // Validate that all required data is present
    if (!token || !account || !email || !name) {
      return NextResponse.json(
        { success: false, error: 'Missing required session data.' },
        { status: 400 }
      );
    }

    // Create a response object to attach cookies to
    const response = NextResponse.json({ success: true });

    // Set httpOnly cookies on the response (JavaScript can't access these!)
    response.cookies.set('deriv_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    response.cookies.set('deriv_account', account, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    // Store non-sensitive user info in a regular cookie that client-side JS can read
    response.cookies.set('user_info', JSON.stringify({ loginid: account, email, name }), {
      httpOnly: false, // Can be read by JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    return response;

  } catch (error: any) {
    console.error('❌ Error in /api/auth/set-session:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unknown server error occurred.' },
      { status: 500 }
    );
  }
}
