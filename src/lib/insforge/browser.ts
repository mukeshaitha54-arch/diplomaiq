'use client';

import { createBrowserClient } from '@insforge/sdk/ssr';

// Used in Client Components. Auth mutations (signIn, signUp, signOut) must
// go through Server Actions (src/lib/insforge/actions.ts), not this client.
export const insforge = createBrowserClient();
