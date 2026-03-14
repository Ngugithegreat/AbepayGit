import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_API_ROUTES = [
  '/api/deriv/balance',
  '/api/transactions',
  '/api/mpesa/initiate',
  '/api/admin/sync-balance'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for session token on protected API routes
  if (PROTECTED_API_ROUTES.some(route => pathname.startsWith(route))) {
    const token = request.cookies.get('deriv_token');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized: No session token' }, { status: 401 });
    }
  }
  
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Basic CSRF protection check for sensitive POST requests.
  // Note: This is a basic check. For more robust protection, consider libraries like `csurf`.
  if (pathname.startsWith('/api/') && request.method === 'POST') {
    const origin = request.headers.get('origin') ?? request.headers.get('referer');
    const host = request.headers.get('host');
    
    if (origin && host && new URL(origin).host !== host) {
      // Uncomment the following line to enforce CSRF protection
      // return NextResponse.json({ error: 'CSRF validation failed: Invalid origin' }, { status: 403 });
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
