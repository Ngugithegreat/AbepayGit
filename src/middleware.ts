import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // CSRF protection for sensitive endpoints
  const isSensitiveEndpoint = 
    request.nextUrl.pathname.startsWith('/api/mpesa') ||
    request.nextUrl.pathname.startsWith('/api/deriv') ||
    request.nextUrl.pathname.startsWith('/api/user');

  if (isSensitiveEndpoint && request.method === 'POST') {
    // Check for custom header (CSRF protection)
    const hasCSRFHeader = request.headers.get('x-requested-with') === 'XMLHttpRequest';
    
    if (!hasCSRFHeader) {
      console.log('❌ CSRF: Missing security header');
      // For now just log, don't block (to avoid breaking existing functionality)
      // return NextResponse.json({ error: 'Invalid request' }, { status: 403 });
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
