import { adminClient } from '../src/lib/insforge/client.js';

async function run() {
  const pin = '24054-AI-061';
  // 1. student profile
  const profileRes = await adminClient.database.from('student_profiles').select('*').eq('pin', pin).single();
  console.log('--- student_profiles ---');
  console.log(JSON.stringify(profileRes.data, null, 2));

  const profileId = profileRes.data?.id;
  if (!profileId) {
    console.log('No profile found for PIN');
    return;
  }

  // 2. semesters for this profile
  const semRes = await adminClient.database.from('semesters').select('*').eq('profile_id', profileId);
  console.log('--- semesters ---');
  console.log(JSON.stringify(semRes.data, null, 2));

  // 3. subjects (limit 20)
  const subjRes = await adminClient.database.from('subjects').select('*').limit(20);
  console.log('--- subjects (limit 20) ---');
  console.log(JSON.stringify(subjRes.data, null, 2));

  // 4. academic_summary for profile
  const sumRes = await adminClient.database.from('academic_summary').select('*').eq('profile_id', profileId);
  console.log('--- academic_summary ---');
  console.log(JSON.stringify(sumRes.data, null, 2));
}

run().catch(e => console.error('Error:', e));
