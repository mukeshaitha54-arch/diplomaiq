import { adminClient } from '../src/lib/insforge/client';
import fs from 'fs';

async function auditDB() {
  console.log("Starting DB Audit...");
  
  const [profiles, semesters, subjects, summary, logs] = await Promise.all([
    adminClient.database.from('student_profiles').select('*'),
    adminClient.database.from('semesters').select('*'),
    adminClient.database.from('subjects').select('*'),
    adminClient.database.from('academic_summary').select('*'),
    adminClient.database.from('sync_logs').select('*')
  ]);
  
  const output = {
    counts: {
      student_profiles: profiles.data?.length || 0,
      semesters: semesters.data?.length || 0,
      subjects: subjects.data?.length || 0,
      academic_summary: summary.data?.length || 0,
      sync_logs: logs.data?.length || 0
    },
    tables: {
      student_profiles: profiles.data,
      semesters: semesters.data,
      subjects: subjects.data,
      academic_summary: summary.data,
      sync_logs: logs.data
    }
  };
  
  fs.writeFileSync('db_audit.json', JSON.stringify(output, null, 2));
  console.log("Audit complete. Data saved to db_audit.json");
  console.table(output.counts);
}

auditDB();
