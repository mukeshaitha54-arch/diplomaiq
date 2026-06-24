import { createAdminClient } from '@insforge/sdk';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const adminClient = createAdminClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL,
    apiKey: process.env.INSFORGE_API_KEY,
  });

  console.log("--- SQL EVIDENCE SCRIPT ---\n");

  // Query 1: SELECT COUNT(*) FROM subjects;
  const { data: allSubjects, error: e1 } = await adminClient.database.from('subjects').select('*');
  const subjects = allSubjects || [];
  console.log("1. SELECT COUNT(*) FROM subjects;");
  console.log(`COUNT: ${subjects.length}\n`);

  // Query 2: SELECT semester_number, COUNT(*) ...
  console.log("2. SELECT semester_number, COUNT(*)");
  const semCounts: Record<number, number> = {};
  subjects.forEach((s: any) => {
    semCounts[s.semester_number] = (semCounts[s.semester_number] || 0) + 1;
  });
  console.log("semester_number | count");
  console.log("----------------|------");
  Object.keys(semCounts).sort((a,b) => Number(a)-Number(b)).forEach(sem => {
    console.log(`${sem.padEnd(15)} | ${semCounts[Number(sem)]}`);
  });
  console.log("");

  // Query 3: SELECT subject_code, subject_name ...
  console.log("3. SELECT subject_code, subject_name LIMIT 200");
  const sortedSubjects = [...subjects].sort((a: any, b: any) => {
    if (a.semester_number !== b.semester_number) return a.semester_number - b.semester_number;
    return a.subject_code.localeCompare(b.subject_code);
  });
  console.log("subject_code | subject_name");
  console.log("-------------|-------------------------");
  sortedSubjects.slice(0, 200).forEach((s: any) => {
    console.log(`${s.subject_code.padEnd(12)} | ${s.subject_name}`);
  });
  console.log("");

  // Query 4: SELECT COUNT(DISTINCT subject_code)
  console.log("4. SELECT COUNT(DISTINCT subject_code)");
  const uniqueCodes = new Set(subjects.map((s: any) => s.subject_code));
  console.log(`DISTINCT COUNT: ${uniqueCodes.size}\n`);

  // Query 5: SELECT subject_code, COUNT(*) HAVING COUNT(*) > 1
  console.log("5. SELECT subject_code, COUNT(*) HAVING COUNT(*) > 1");
  const codeCounts: Record<string, number> = {};
  subjects.forEach((s: any) => {
    codeCounts[s.subject_code] = (codeCounts[s.subject_code] || 0) + 1;
  });
  const dupes = Object.entries(codeCounts)
    .filter(([_, count]) => count > 1)
    .sort((a, b) => b[1] - a[1]);
  console.log("subject_code | count");
  console.log("-------------|------");
  dupes.forEach(([code, count]) => {
    console.log(`${code.padEnd(12)} | ${count}`);
  });
  console.log(dupes.length === 0 ? "No duplicates found." : "");
  console.log("");

  // Query 6-8: Current counts
  const { data: d1 } = await adminClient.database.from('assessment_subjects').select('id');
  const { data: d2 } = await adminClient.database.from('assessment_summaries').select('*').limit(10);
  const { data: d3 } = await adminClient.database.from('prediction_history').select('*').limit(10);

  console.log("6. SELECT COUNT(*) FROM assessment_subjects;");
  console.log(`COUNT: ${d1 ? d1.length : 0}\n`);

  console.log("7. SELECT COUNT(*) FROM assessment_summaries;");
  console.log(`COUNT: ${d2 ? d2.length : 0} (Showing rows:)\n`);
  console.log(JSON.stringify(d2, null, 2));
  console.log("");

  console.log("8. SELECT COUNT(*) FROM prediction_history;");
  console.log(`COUNT: ${d3 ? d3.length : 0} (Showing rows:)\n`);
  console.log(JSON.stringify(d3, null, 2));
}

run();
