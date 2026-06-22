import { SBTETApiClient } from '../src/lib/sbtet/SBTETApiClient';
import { syncAcademicDataAction, syncAttendanceAction } from '../src/lib/actions/sbtet';
import { adminClient } from '../src/lib/insforge/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const PROFILE_ID = '45d4dbb3-5846-4317-9f75-fe745cfe165c';
const PIN = '24054-AI-061';
const SCHEME = 'C24';
const CURRENT_SEM = 5;

async function runLiveValidation() {
  const apiClient = new SBTETApiClient();
  
  console.log('=============================================');
  console.log('1. RUNNING verifyStudent() AND FETCHING JSON');
  console.log('=============================================');
  
  const startRaw = performance.now();
  const rawJson = await apiClient.getConsolidatedResults(PIN);
  const endRaw = performance.now();
  
  console.log(`\nEndpoint: GET /api/api/Results/GetConsolidatedResults?Pin=${PIN}`);
  console.log(`Response Time: ${(endRaw - startRaw).toFixed(2)} ms`);
  console.log('\nRaw JSON (truncated for display):');
  console.log(JSON.stringify({
    Table: rawJson.Table,
    Table1: rawJson.Table1,
    Table3: rawJson.Table3,
    "Table2_length": rawJson.Table2.length
  }, null, 2));

  const startVerify = performance.now();
  const verifiedInfo = await apiClient.verifyStudent(PIN);
  const endVerify = performance.now();
  
  console.log('\nverifyStudent() parsed result:');
  console.log(verifiedInfo);

  console.log('\n=============================================');
  console.log('2. INSERTING VERIFIED PROFILE');
  console.log('=============================================');
  
  // Wipe existing just in case
  await adminClient.database.from('student_profiles').delete().eq('id', PROFILE_ID);
  
  const { error: insertErr } = await adminClient.database.from('student_profiles').insert({
    id: PROFILE_ID,
    pin: verifiedInfo.pin,
    full_name: verifiedInfo.fullName,
    scheme: SCHEME,
    branch: verifiedInfo.branchCode,
    college_code: verifiedInfo.collegeCode,
    college_name: verifiedInfo.collegeName,
    current_semester: CURRENT_SEM,
    verified_at: new Date().toISOString()
  });
  
  if (insertErr) {
    console.error('Failed to insert profile:', insertErr);
    return;
  }
  console.log('Inserted profile successfully.');

  console.log('\n=============================================');
  console.log('3. RUNNING syncAcademicDataAction');
  console.log('=============================================');
  
  const startSyncResults = performance.now();
  const academicSyncRes = await syncAcademicDataAction(PROFILE_ID, PIN);
  const endSyncResults = performance.now();
  
  console.log(`syncAcademicDataAction execution time: ${(endSyncResults - startSyncResults).toFixed(2)} ms`);
  console.log('Result:', academicSyncRes);

  console.log('\n=============================================');
  console.log('4. RUNNING syncAttendanceAction');
  console.log('=============================================');
  
  const startAtt = performance.now();
  const attSyncRes = await syncAttendanceAction(PROFILE_ID, PIN);
  const endAtt = performance.now();
  
  console.log(`Endpoint: GET /api/api/PreExamination/getAttendanceReport?Pin=${PIN}`);
  console.log(`syncAttendanceAction execution time: ${(endAtt - startAtt).toFixed(2)} ms`);
  console.log('Result:', attSyncRes);

  console.log('\n=============================================');
  console.log('5. LIVE DATABASE COUNTS');
  console.log('=============================================');
  
  const tables = ['student_profiles', 'semesters', 'subjects', 'attendance_records', 'academic_summary', 'sync_logs'];
  for (const table of tables) {
    const { count } = await adminClient.database.from(table).select('*', { count: 'exact', head: true });
    console.log(`SELECT COUNT(*) FROM ${table}; -> ${count}`);
  }

  console.log('\n=============================================');
  console.log('6. DATA SAMPLES');
  console.log('=============================================');

  const { data: profile } = await adminClient.database.from('student_profiles').select('*').limit(1);
  console.log('\nSELECT * FROM student_profiles LIMIT 1;');
  console.log(profile);

  const { data: semester } = await adminClient.database.from('semesters').select('*').limit(2);
  console.log('\nSELECT * FROM semesters LIMIT 2;');
  console.log(semester);

  const { data: subject } = await adminClient.database.from('subjects').select('subject_code, subject_name, grade, credits, internal_marks, external_marks, result_status').limit(3);
  console.log('\nSELECT * FROM subjects LIMIT 3;');
  console.log(subject);

  const { data: attendance } = await adminClient.database.from('attendance_records').select('*').limit(1);
  console.log('\nSELECT * FROM attendance_records LIMIT 1;');
  console.log(attendance);

  const { data: summary } = await adminClient.database.from('academic_summary').select('*').limit(1);
  console.log('\nSELECT * FROM academic_summary LIMIT 1;');
  console.log(summary);
  
  const { data: logs } = await adminClient.database.from('sync_logs').select('status, records_synced, duration_ms, error_message').limit(2);
  console.log('\nSELECT * FROM sync_logs LIMIT 2;');
  console.log(logs);
}

runLiveValidation().catch(console.error);
