import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, account, email, name } = body;

    if (!token || !account || !email || !name) {
      return NextResponse.json({ success: false, error: 'Missing required session data.' }, { status: 400 });
    }

    const cookieStore = await cookies();

    cookieStore.set('deriv_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    cookieStore.set('deriv_account', account, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    cookieStore.set('user_info', JSON.stringify({ loginid: account, email, name }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Error in /api/auth/set-session:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
