import { UnifiedSyncEngine } from './src/lib/sync/UnifiedSyncEngine';
import { createAdminClient } from '@insforge/sdk';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const adminClient = createAdminClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL,
    apiKey: process.env.INSFORGE_API_KEY,
  });

  // Get first profile
  const { data: profiles } = await adminClient.database.from('student_profiles').select('id').limit(1);
  if (!profiles || profiles.length === 0) {
    console.log("No profile found.");
    return;
  }
  const profileId = profiles[0].id;
  console.log("Syncing profile:", profileId);

  try {
    await UnifiedSyncEngine.executeSync(profileId);
    console.log("Sync successful!");
  } catch (e) {
    console.error("Sync error:", e);
  }

  console.log("\nChecking tables...");
  const tables = ['assessment_instances', 'assessment_subjects', 'assessment_summaries', 'prediction_history'];
  for (const t of tables) {
    const { data } = await adminClient.database.from(t).select('*');
    console.log(`${t}:`, data ? data.length : 0);
  }
}

run();
