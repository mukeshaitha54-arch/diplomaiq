import { createClient, createAdminClient } from '@insforge/sdk';

const insforgeUrl = process.env.NEXT_PUBLIC_INSFORGE_URL!;
const insforgeAnonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!;
const insforgeApiKey = process.env.INSFORGE_API_KEY!;

export const insforge = createClient({
  baseUrl: insforgeUrl,
  anonKey: insforgeAnonKey,
});

export const adminClient = createAdminClient({
  baseUrl: insforgeUrl,
  apiKey: insforgeApiKey,
});