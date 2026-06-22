import { createServerClient } from '@insforge/sdk/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const insforge = createServerClient({
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        request.cookies.set({ name, value, ...options });
        supabaseResponse = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        supabaseResponse.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: any) {
        request.cookies.set({ name, value: '', ...options });
        supabaseResponse = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        supabaseResponse.cookies.set({ name, value: '', ...options });
      },
    },
  });

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // insforge.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.
  await insforge.auth.getCurrentUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
