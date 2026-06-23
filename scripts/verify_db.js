import { createAdminClient } from '@insforge/sdk';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const adminClient = createAdminClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL,
  apiKey: process.env.INSFORGE_API_KEY || process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY,
});

async function run() {
  console.log("Verifying Database State:");
  
  const { data: att } = await adminClient.database.from('attendance_records').select('*');
  console.log('Attendance Records Count:', att?.length);
  if (att?.length) console.log('Latest Attendance:', att[0].attendance_percentage);

  const { data: sem } = await adminClient.database.from('semesters').select('*').order('semester_number');
  console.log('Semesters:', sem?.map(s => `Sem ${s.semester_number}: ${s.sgpa}`).join(', '));

  const { data: acc } = await adminClient.database.from('academic_summary').select('*').limit(1);
  if (acc?.length) {
    console.log('Strong Subjects:', acc[0].strong_subjects);
    console.log('Weak Subjects:', acc[0].weak_subjects);
  }
}
run();
