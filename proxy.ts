import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@insforge/sdk/ssr/middleware';
import type { CookieStore } from '@insforge/sdk/ssr/middleware';

// Routes that require an authenticated + verified session
const PROTECTED_ROUTES = ['/verify', '/dashboard'];

// Routes that logged-in users should not access (redirect to dashboard)
const AUTH_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password'];

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  // Refresh the InsForge session so Server Components see fresh cookies.
  // Cast Next.js cookie stores to InsForge's CookieStore — the shapes are compatible.
  const session = await updateSession({
    requestCookies: request.cookies as unknown as CookieStore,
    responseCookies: response.cookies as unknown as CookieStore
  });

  const { pathname } = request.nextUrl;

  const isAuthenticated = !!(session as { accessToken?: string | null }).accessToken;

  // Redirect unauthenticated users away from protected routes
  const isProtected = PROTECTED_ROUTES.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );
  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  const isAuthRoute = AUTH_ROUTES.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     *   - _next/static (static files)
     *   - _next/image (image optimization)
     *   - favicon.ico
     *   - public static assets (images, fonts, css)
     *   - api/auth/refresh (InsForge token refresh endpoint)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|css)|api/auth/refresh).*)'
  ]
};
