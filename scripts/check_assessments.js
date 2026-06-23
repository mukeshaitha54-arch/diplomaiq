import { createAdminClient } from '@insforge/sdk';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const insforgeUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
const insforgeApiKey = process.env.INSFORGE_API_KEY || process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;
const adminClient = createAdminClient({
  baseUrl: insforgeUrl,
  apiKey: insforgeApiKey,
});

async function run() {
  try {
    const { count: c1, error: e1 } = await adminClient.database.from('assessment_instances').select('*', { count: 'exact', head: true });
    console.log('COUNT(*) FROM assessment_instances:', c1, e1?.message || '');

    const { count: c2, error: e2 } = await adminClient.database.from('assessment_subjects').select('*', { count: 'exact', head: true });
    console.log('COUNT(*) FROM assessment_subjects:', c2, e2?.message || '');

  } catch (error) {
    console.error('Error:', error);
  }
}

run();
