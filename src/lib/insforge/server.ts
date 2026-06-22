import { cookies } from 'next/headers';
import { createServerClient } from '@insforge/sdk/ssr';

// Used in Server Components, Route Handlers, and Server Actions (read-only auth).
export async function createInsForgeServerClient() {
  return createServerClient({
    cookies: await cookies()
  });
}
