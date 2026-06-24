import { createAdminClient } from '@insforge/sdk';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { UnifiedSyncEngine } from './src/lib/sync/UnifiedSyncEngine';

async function run() {
  const adminClient = createAdminClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL,
    apiKey: process.env.INSFORGE_API_KEY,
  });

  const { data: profiles } = await adminClient.database.from('student_profiles').select('id, current_semester, pin').limit(1);
  if (!profiles || profiles.length === 0) {
    console.error('No profiles found');
    return;
  }
  const profileId = profiles[0].id;

  console.log(`\n--- INITIATING MOCK SYNC AUDIT ---`);
  
  // Clean all records first for a true test
  await adminClient.database.from('assessment_instances').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await adminClient.database.from('assessment_subjects').delete().neq('assessment_instance_id', '00000000-0000-0000-0000-000000000000');
  await adminClient.database.from('assessment_summaries').delete().neq('profile_id', '00000000-0000-0000-0000-000000000000');
  await adminClient.database.from('prediction_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Fetch unique subjects to mock a SBTET Consolidated Response
  const { data: legacySubjects } = await adminClient.database.from('subjects').select('*');
  const uniqueSubjects = [];
  const map = new Map();
  if (legacySubjects) {
    for (const ls of legacySubjects) {
      if (!map.has(ls.subject_code)) {
        map.set(ls.subject_code, true);
        uniqueSubjects.push(ls);
      }
    }
  }

  // Create Table2
  const table2 = uniqueSubjects.map((s: any, idx: number) => ({
    SemId: s.semester_number,
    WholeOrSupply: idx % 10 === 0 ? 'S' : 'W', // Every 10th subject is supply
    Subject_Code: s.subject_code,
    SubjectName: s.subject_name,
    Mid1Marks: '18',
    Mid2Marks: '19',
    InternalMarks: '38',
    EndExamMarks: idx % 10 === 0 ? '30' : '85',
    ExamStatus: idx % 10 === 0 ? 'F' : 'P'
  }));

  const mockPayload = {
    Table1: [{ CGPA: '8.5' }],
    Table2: table2,
    Table3: [
      { SemId: 1, Credits: 20, TotalGradePoints: 180 },
      { SemId: 2, Credits: 20, TotalGradePoints: 175 }
    ]
  };

  try {
    console.log('[AUDIT] Running saveUnifiedAssessments...');
    await (UnifiedSyncEngine as any).saveUnifiedAssessments(adminClient, profileId, mockPayload);
    
    console.log('[AUDIT] Running generatePredictions...');
    await (UnifiedSyncEngine as any).generatePredictions(adminClient, profileId);

    console.log(`\n--- AUDIT COMPLETE. RUNNING VERIFICATION QUERIES ---`);
    
    const { data: c1 } = await adminClient.database.from('assessment_instances').select('id');
    const { data: c2 } = await adminClient.database.from('assessment_subjects').select('id');
    const { data: c3 } = await adminClient.database.from('assessment_summaries').select('id');
    const { data: c4 } = await adminClient.database.from('prediction_history').select('id');
    
    console.log(`\n7. Counts after sync:`);
    console.log(`assessment_instances: ${c1 ? c1.length : 0}`);
    console.log(`assessment_subjects: ${c2 ? c2.length : 0}`);
    console.log(`assessment_summaries: ${c3 ? c3.length : 0}`);
    console.log(`prediction_history: ${c4 ? c4.length : 0}`);

    const { data: inst } = await adminClient.database.from('assessment_instances').select('assessment_type');
    const typeGroup: any = {};
    if (inst) {
      for (const i of inst) {
        typeGroup[i.assessment_type] = (typeGroup[i.assessment_type] || 0) + 1;
      }
    }
    console.log(`\n8. Assessment Instances by Type:`, typeGroup);

    const { data: summ } = await adminClient.database.from('assessment_summaries').select('assessment_type');
    const summGroup: any = {};
    if (summ) {
      for (const s of summ) {
        summGroup[s.assessment_type] = (summGroup[s.assessment_type] || 0) + 1;
      }
    }
    console.log(`8. Assessment Summaries by Type:`, summGroup);

  } catch (err) {
    console.error('MOCK SYNC FAILED:', err);
  }
}

run();
