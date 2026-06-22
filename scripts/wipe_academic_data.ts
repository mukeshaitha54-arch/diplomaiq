import { adminClient } from '../src/lib/insforge/client';

async function wipeData() {
  console.log('Wiping academic data...');
  
  // Note: Insforge REST API doesn't support TRUNCATE directly, so we delete all rows
  // We use neq('id', '00000000-0000-0000-0000-000000000000') as a catch-all to delete all rows
  const dummyId = '00000000-0000-0000-0000-000000000000';
  
  await adminClient.database.from('student_profiles').delete().neq('id', dummyId);
  await adminClient.database.from('semesters').delete().neq('id', dummyId);
  await adminClient.database.from('subjects').delete().neq('id', dummyId);
  await adminClient.database.from('attendance_records').delete().neq('id', dummyId);
  await adminClient.database.from('academic_summary').delete().neq('id', dummyId);
  await adminClient.database.from('sync_logs').delete().neq('id', dummyId);
  
  console.log('Academic data wiped.');
}

wipeData().catch(console.error);
