/**
 * import_real_student.ts
 * 
 * Reads verified raw SBTET data from sbtet_raw_extraction.json
 * (produced by test_real_sbtet.ts) and inserts it into InsForge.
 * 
 * CRITICAL: student_profiles.id REFERENCES auth.users(id).
 * We must create a real auth user first, or the FK constraint will reject the insert.
 * 
 * No mock data. No fallback. If the extraction file is missing, this script refuses to run.
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createAdminClient } from '@insforge/sdk';
import fs from 'fs';

const adminClient = createAdminClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL || '',
  apiKey: process.env.INSFORGE_API_KEY || ''
});

async function main() {
  console.log('==========================================================');
  console.log('  IMPORT REAL STUDENT DATA INTO INSFORGE');
  console.log('==========================================================');
  console.log(`InsForge URL: ${process.env.NEXT_PUBLIC_INSFORGE_URL}`);

  // 1. Read the raw extraction file
  if (!fs.existsSync('sbtet_raw_extraction.json')) {
    console.error('✗ sbtet_raw_extraction.json not found.');
    console.error('  Run test_real_sbtet.ts first to extract real data from SBTET.');
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync('sbtet_raw_extraction.json', 'utf-8'));
  const { studentInfo, attendance, results, summary } = raw;

  if (!studentInfo || !studentInfo.pin) {
    console.error('✗ No studentInfo in extraction file. Data is invalid.');
    process.exit(1);
  }

  console.log(`\nStudent: ${studentInfo.fullName}`);
  console.log(`PIN: ${studentInfo.pin}`);
  console.log(`College: ${studentInfo.collegeName} (Code: ${studentInfo.collegeCode})`);
  console.log(`Branch: ${studentInfo.branchCode}`);
  console.log(`Scheme: ${studentInfo.scheme}`);

  const semesterNumbers = Object.keys(results || {}).map(Number).sort();
  const totalSubjects = semesterNumbers.reduce((sum, s) => sum + (results[s]?.subjects?.length || 0), 0);
  console.log(`Semesters with data: ${semesterNumbers.join(', ') || 'none'}`);
  console.log(`Total subjects: ${totalSubjects}`);

  // 2. Create a real auth user (required by FK constraint: student_profiles.id -> auth.users.id)
  console.log('\n--- Step 1: Create auth user ---');
  const email = `${studentInfo.pin.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.sbtet.local`;
  const password = `SBTET_${studentInfo.pin}_${Date.now()}`;

  let userId: string;

  // Check if profile already exists
  const existingProfile = await adminClient.database
    .from('student_profiles')
    .select('id')
    .eq('pin', studentInfo.pin)
    .single();

  if (existingProfile.data?.id) {
    userId = existingProfile.data.id;
    console.log(`✓ Existing profile found: ${userId}`);
  } else {
    // Create auth user
    const signUpRes = await adminClient.auth.signUp({ email, password });
    console.log('Auth signUp response:', JSON.stringify(signUpRes, null, 2));

    if (signUpRes.error) {
      console.error('✗ Auth signUp failed:', signUpRes.error);
      console.error('  Cannot create student_profiles without a valid auth.users entry (FK constraint).');
      process.exit(1);
    }

    if (!signUpRes.data?.user?.id) {
      // signUp succeeded but no user object returned (email verification required)
      // Try to list users or use admin API to get the user
      console.log('signUp did not return user.id (email verification may be required).');
      console.log('Attempting to find user by email...');
      
      // Use admin listUsers if available
      try {
        const listRes = await (adminClient.auth as any).admin?.listUsers?.();
        const found = listRes?.data?.users?.find?.((u: any) => u.email === email);
        if (found) {
          userId = found.id;
          console.log(`✓ Found user via admin list: ${userId}`);
        } else {
          console.error('✗ Could not find user after signUp. Auth system may require email verification.');
          console.error('  Please disable email verification in InsForge dashboard, or manually create the user.');
          process.exit(1);
        }
      } catch {
        console.error('✗ admin.listUsers not available. Cannot retrieve user ID.');
        console.error('  Please disable email verification in InsForge dashboard settings.');
        process.exit(1);
      }
    } else {
      userId = signUpRes.data.user.id;
      console.log(`✓ Auth user created: ${userId}`);
    }
  }

  // 3. Insert student_profiles
  console.log('\n--- Step 2: Insert student_profiles ---');
  const profilePayload = {
    id: userId,
    pin: studentInfo.pin,
    full_name: studentInfo.fullName,
    branch: studentInfo.branchCode,
    college_name: studentInfo.collegeName,
    scheme: studentInfo.scheme,
    current_semester: semesterNumbers.length > 0 ? Math.max(...semesterNumbers) : 1,
    last_synced_at: new Date().toISOString()
  };
  console.log('Payload:', JSON.stringify(profilePayload, null, 2));

  const profileRes = await adminClient.database
    .from('student_profiles')
    .upsert([profilePayload], { onConflict: 'pin' })
    .select();
  
  if (profileRes.error) {
    console.error('✗ student_profiles upsert failed:', JSON.stringify(profileRes.error, null, 2));
    process.exit(1);
  }
  console.log('✓ student_profiles inserted:', JSON.stringify(profileRes.data, null, 2));

  // 4. Insert semesters
  console.log('\n--- Step 3: Insert semesters ---');
  for (const semNum of semesterNumbers) {
    const semResult = results[semNum];
    const semPayload = {
      profile_id: userId,
      semester_number: semNum,
      sgpa: semResult.sgpa,
      total_credits: semResult.totalCreditsEarned || 0,
      is_passed: semResult.isPassed
    };
    console.log(`  Semester ${semNum}: SGPA=${semResult.sgpa}, Passed=${semResult.isPassed}`);

    const semRes = await adminClient.database
      .from('semesters')
      .upsert([semPayload], { onConflict: 'profile_id,semester_number' })
      .select();

    if (semRes.error) {
      console.error(`  ✗ semesters upsert failed for sem ${semNum}:`, JSON.stringify(semRes.error, null, 2));
      continue;
    }
    console.log(`  ✓ Semester ${semNum} inserted. ID: ${semRes.data?.[0]?.id}`);

    // 5. Insert subjects for this semester
    const semesterId = semRes.data?.[0]?.id;
    if (!semesterId) {
      console.error(`  ✗ No semester ID returned for sem ${semNum}. Skipping subjects.`);
      continue;
    }

    const subjectPayloads = semResult.subjects.map((sub: any) => ({
      profile_id: userId,
      semester_number: semNum,
      subject_code: sub.subjectCode,
      subject_name: sub.subjectName,
      internal_marks: sub.internalMarks,
      external_marks: sub.externalMarks,
      total_marks: sub.totalMarks,
      grade: sub.grade,
      credits: sub.credits || 0,
      result_status: sub.resultStatus
    }));

    const subjRes = await adminClient.database
      .from('subjects')
      .upsert(subjectPayloads, { onConflict: 'profile_id,semester_number,subject_code' });

    if (subjRes.error) {
      console.error(`  ✗ subjects upsert failed for sem ${semNum}:`, JSON.stringify(subjRes.error, null, 2));
    } else {
      console.log(`  ✓ ${subjectPayloads.length} subjects inserted for semester ${semNum}`);
    }
  }

  // 6. Insert academic_summary
  console.log('\n--- Step 4: Insert academic_summary ---');
  const totalBacklogs = semesterNumbers.reduce((count, s) => {
    return count + (results[s]?.subjects?.filter((sub: any) => sub.resultStatus === 'F')?.length || 0);
  }, 0);

  // Find strong and weak subjects
  const allSubjects = semesterNumbers.flatMap(s => results[s]?.subjects || []);
  allSubjects.sort((a: any, b: any) => b.totalMarks - a.totalMarks);
  const strongSubjects = allSubjects.slice(0, 3).map((s: any) => s.subjectName);
  const weakSubjects = allSubjects.filter((s: any) => s.resultStatus === 'F').slice(0, 3).map((s: any) => s.subjectName);

  const summaryPayload = {
    profile_id: userId,
    cgpa: summary?.cgpa || 0,
    total_backlogs: totalBacklogs,
    health_score: Math.round(((summary?.cgpa || 0) / 10) * 50 + 20),
    strong_subjects: strongSubjects,
    weak_subjects: weakSubjects.length > 0 ? weakSubjects : allSubjects.slice(-3).map((s: any) => s.subjectName),
    last_calculated_at: new Date().toISOString()
  };

  const summaryRes = await adminClient.database
    .from('academic_summary')
    .upsert([summaryPayload], { onConflict: 'profile_id' });

  if (summaryRes.error) {
    console.error('✗ academic_summary upsert failed:', JSON.stringify(summaryRes.error, null, 2));
  } else {
    console.log('✓ academic_summary inserted');
  }

  // 7. Insert sync_logs
  console.log('\n--- Step 5: Insert sync_logs ---');
  await adminClient.database.from('sync_logs').insert([{
    profile_id: userId,
    status: 'SUCCESS',
    records_synced: totalSubjects,
    duration_ms: 0,
    created_at: new Date().toISOString()
  }]);
  console.log('✓ sync_logs entry created');

  // 8. VERIFY: Query everything back from the live database
  console.log('\n\n==========================================================');
  console.log('  DATABASE VERIFICATION (live queries)');
  console.log('==========================================================');

  const verifyProfile = await adminClient.database.from('student_profiles').select('*').eq('pin', studentInfo.pin);
  console.log(`\n--- student_profiles (count: ${verifyProfile.data?.length || 0}) ---`);
  console.log(JSON.stringify(verifyProfile.data, null, 2));

  const verifySemesters = await adminClient.database.from('semesters').select('*').eq('profile_id', userId);
  console.log(`\n--- semesters (count: ${verifySemesters.data?.length || 0}) ---`);
  console.log(JSON.stringify(verifySemesters.data, null, 2));

  const verifySubjects = await adminClient.database.from('subjects').select('*').eq('profile_id', userId).limit(20);
  console.log(`\n--- subjects (first 20, total for profile) ---`);
  console.log(JSON.stringify(verifySubjects.data, null, 2));

  // Get total subject count
  const allSubjectsCount = await adminClient.database.from('subjects').select('id', { count: 'exact' }).eq('profile_id', userId);
  console.log(`Total subjects in DB: ${allSubjectsCount.data?.length || 0}`);

  const verifySummary = await adminClient.database.from('academic_summary').select('*').eq('profile_id', userId);
  console.log(`\n--- academic_summary (count: ${verifySummary.data?.length || 0}) ---`);
  console.log(JSON.stringify(verifySummary.data, null, 2));

  const verifyLogs = await adminClient.database.from('sync_logs').select('*').eq('profile_id', userId);
  console.log(`\n--- sync_logs (count: ${verifyLogs.data?.length || 0}) ---`);
  console.log(JSON.stringify(verifyLogs.data, null, 2));

  console.log('\n==========================================================');
  console.log('  FINAL COUNTS');
  console.log('==========================================================');
  console.log(`student_profiles: ${verifyProfile.data?.length || 0}`);
  console.log(`semesters:        ${verifySemesters.data?.length || 0}`);
  console.log(`subjects:         ${allSubjectsCount.data?.length || 0}`);
  console.log(`academic_summary: ${verifySummary.data?.length || 0}`);
  console.log(`sync_logs:        ${verifyLogs.data?.length || 0}`);
  console.log('==========================================================');
}

main().catch(e => {
  console.error('\n\nFATAL ERROR:', e.message);
  process.exit(1);
});
