import { createClient } from '@insforge/sdk';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
const supabaseKey = process.env.INSFORGE_API_KEY || process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;
const insforge = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    // 1. SELECT COUNT(*) FROM academic_results;
    const { count: c1, error: e1 } = await insforge.from('academic_results').select('*', { count: 'exact', head: true });
    console.log('COUNT(*) FROM academic_results:', c1, e1?.message || '');

    // 2. SELECT COUNT(*) FROM semester_results;
    const { count: c2, error: e2 } = await insforge.from('semester_results').select('*', { count: 'exact', head: true });
    console.log('COUNT(*) FROM semester_results:', c2, e2?.message || '');

    // 3. SELECT COUNT(*) FROM attendance_records;
    const { count: c3, error: e3 } = await insforge.from('attendance_records').select('*', { count: 'exact', head: true });
    console.log('COUNT(*) FROM attendance_records:', c3, e3?.message || '');

    // 4. SELECT semester, sgpa, cgpa FROM semester_results ORDER BY semester;
    const { data: d4, error: e4 } = await insforge.from('semester_results').select('semester, sgpa, cgpa').order('semester');
    console.log('semester_results ORDER BY semester:', JSON.stringify(d4, null, 2), e4?.message || '');

    // 5. SELECT DISTINCT semester FROM academic_results ORDER BY semester;
    const { data: d5, error: e5 } = await insforge.from('academic_results').select('semester');
    if (d5) {
      const distinctSemesters = [...new Set(d5.map(r => r.semester))].sort((a, b) => {
        if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b);
        return a - b;
      });
      console.log('DISTINCT semester FROM academic_results:', distinctSemesters);
    } else {
      console.log('Error fetching academic_results for distinct:', e5?.message || '');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

run();
