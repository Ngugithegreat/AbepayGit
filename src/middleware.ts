
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware is currently a placeholder.
// You can add logic here to protect routes or modify requests.
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Example: Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

    