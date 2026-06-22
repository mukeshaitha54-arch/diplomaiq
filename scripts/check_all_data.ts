import { adminClient } from '../src/lib/insforge/client.js';

async function run() {
  // 1. All student profiles (limit 20)
  const profilesRes = await adminClient.database.from('student_profiles').select('*').limit(20);
  console.log('--- student_profiles (up to 20) ---');
  console.log(JSON.stringify(profilesRes.data, null, 2));

  // If any profiles exist, pick the first one to query related tables
  if (profilesRes.data && profilesRes.data.length > 0) {
    const profileId = profilesRes.data[0].id;
    console.log('Using profile_id:', profileId);

    const semRes = await adminClient.database.from('semesters').select('*').eq('profile_id', profileId);
    console.log('--- semesters for that profile ---');
    console.log(JSON.stringify(semRes.data, null, 2));

    const subjRes = await adminClient.database.from('subjects').select('*').eq('profile_id', profileId).limit(20);
    console.log('--- subjects (limit 20) for that profile ---');
    console.log(JSON.stringify(subjRes.data, null, 2));

    const sumRes = await adminClient.database.from('academic_summary').select('*').eq('profile_id', profileId);
    console.log('--- academic_summary for that profile ---');
    console.log(JSON.stringify(sumRes.data, null, 2));
  } else {
    console.log('No student_profiles found in the project.');
  }
}

run().catch(e => console.error('Error:', e));
