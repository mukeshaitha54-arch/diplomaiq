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
    const { data: semData } = await adminClient.database.from('semesters').select('semester_number, sgpa, cgpa').order('semester_number');
    console.log('semesters ORDER BY semester_number:\n', JSON.stringify(semData, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

run();
