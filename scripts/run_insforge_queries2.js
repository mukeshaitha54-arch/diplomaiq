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
    const { count: c1 } = await adminClient.database.from('semesters').select('*', { count: 'exact', head: true });
    console.log('COUNT(*) FROM semesters:', c1);

    const { count: c2 } = await adminClient.database.from('academic_summary').select('*', { count: 'exact', head: true });
    console.log('COUNT(*) FROM academic_summary:', c2);

    const { count: c3 } = await adminClient.database.from('subjects').select('*', { count: 'exact', head: true });
    console.log('COUNT(*) FROM subjects:', c3);
    
    const { count: c4 } = await adminClient.database.from('student_profiles').select('*', { count: 'exact', head: true });
    console.log('COUNT(*) FROM student_profiles:', c4);

    const { data: semData } = await adminClient.database.from('semesters').select('semester_number, sgpa, cgpa').order('semester_number');
    console.log('semesters ORDER BY semester_number:');
    if (semData) console.table(semData);

    const { data: d5 } = await adminClient.database.from('semesters').select('semester_number');
    if (d5) {
      const distinctSemesters = [...new Set(d5.map(r => r.semester_number))].sort((a, b) => a - b);
      console.log('DISTINCT semester_number FROM semesters:', distinctSemesters);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

run();
