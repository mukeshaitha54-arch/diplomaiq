import { updateSession } from '@insforge/sdk/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  try {
    // Insforge updateSession expects requestCookies/responseCookies, not just request.
    // For now we just return next() since auth isn't fully implemented in middleware here.
  } catch (e) {
    console.error(e);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
  unstable_allowDynamic: [
    '**/node_modules/engine.io-client/**',
    '**/node_modules/socket.io-client/**',
    '**/node_modules/@insforge/sdk/**'
  ]
};
