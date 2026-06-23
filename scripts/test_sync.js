import { createAdminClient } from '@insforge/sdk';
import { SBTETProvider } from '../src/lib/sbtet/provider.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const adminClient = createAdminClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL,
  apiKey: process.env.INSFORGE_API_KEY || process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY,
});

async function runSyncTwice() {
  const profileId = 'e9fd378c-4daa-4525-98fb-4e07670339e5';
  
  const { data: profile } = await adminClient.database
    .from('student_profiles')
    .select('current_semester, scheme, pin')
    .eq('id', profileId)
    .single();

  const pin = profile.pin;
  const apiClient = SBTETProvider.getApiClient();

  console.log("Running Sync 1...");
  await doAcademicSync(profileId, pin, profile.current_semester);
  await doAttendanceSync(profileId, pin);

  console.log("Running Sync 2...");
  await doAcademicSync(profileId, pin, profile.current_semester);
  await doAttendanceSync(profileId, pin);
  
  console.log("Sync test complete. Verifying db:");
  const { data: acc } = await adminClient.database.from('academic_summary').select('*').limit(1);
  console.log('Strong:', acc[0]?.strong_subjects);
  console.log('Weak:', acc[0]?.weak_subjects);
}

async function doAcademicSync(profileId, pin, currentSemester) {
    const apiClient = SBTETProvider.getApiClient();
    const result = await apiClient.getConsolidatedResults(pin);
    const maxSemToFetch = currentSemester - 1;
    let recordsSynced = 0;

    if (result.Table3 && result.Table3.length > 0) {
      const validSems = result.Table3.filter(s => s.SemId <= maxSemToFetch);
      for (const sem of validSems) {
        let sgpa = 0;
        if (sem.TotalGradePoints && sem.Credits && sem.Credits > 0) {
          sgpa = Number((sem.TotalGradePoints / sem.Credits).toFixed(2));
        }
        const semSubjects = result.Table2.filter(sub => sub.SemId === sem.SemId);
        let isPassed = false;
        if (semSubjects.length > 0) {
          isPassed = semSubjects.every(sub => sub.ExamStatus !== 'F' && (Number(sub.CreditsGained) || 0) > 0);
        }
        const semResult = await adminClient.database.from('semesters').upsert([{
          profile_id: profileId,
          semester_number: sem.SemId,
          sgpa: sgpa,
          total_credits: sem.Credits || 0,
          is_passed: isPassed
        }], { onConflict: 'profile_id,semester_number' }).select();
        
        if (semResult.error) throw new Error(semResult.error.message);
        recordsSynced++;

        if (semSubjects.length > 0) {
          const subjectInserts = semSubjects.map(sub => ({
            profile_id: profileId,
            semester_number: sem.SemId,
            subject_code: sub.Subject_Code,
            subject_name: sub.SubjectName,
            internal_marks: parseInt(sub.InternalMarks) || 0,
            external_marks: parseInt(sub.EndExamMarks) || 0,
            total_marks: (parseInt(sub.InternalMarks) || 0) + (parseInt(sub.EndExamMarks) || 0),
            credits: Math.round(Number(sub.MaxCredits) || 0),
            grade: sub.HybridGrade,
            result_status: sub.ExamStatus
          }));
          const subResult = await adminClient.database.from('subjects').upsert(subjectInserts, { onConflict: 'profile_id,semester_number,subject_code' });
          if (subResult.error) throw new Error(subResult.error.message);
        }
      }
    }

    if (result.Table1 && result.Table1.length > 0) {
      const summaryInfo = result.Table1[0];
      const { data: subs } = await adminClient.database.from('subjects').select('*').eq('profile_id', profileId);
      const backlogs = subs ? subs.filter((s) => s.result_status === 'F').length : 0;
      
      let strongSubjects = [];
      let weakSubjects = [];
      if (subs && subs.length > 0) {
        const strong = subs.filter((s) => {
          const totalMarks = s.total_marks || 0;
          return s.grade === 'O' || s.grade === 'A+' || s.grade === 'A' || (totalMarks >= 85);
        }).sort((a, b) => (b.total_marks || 0) - (a.total_marks || 0));
        strongSubjects = strong.slice(0, 4).map((s) => s.subject_name);

        const failed = subs.filter((s) => s.result_status === 'F');
        if (failed.length > 0) {
          weakSubjects = failed.map((s) => s.subject_name);
        } else {
          const bottom = [...subs].sort((a, b) => (a.total_marks || 0) - (b.total_marks || 0));
          weakSubjects = bottom.slice(0, 3).map((s) => s.subject_name);
        }
      }
      const res = await adminClient.database.from('academic_summary').upsert([{
        profile_id: profileId,
        cgpa: summaryInfo.CGPA,
        total_backlogs: backlogs,
        health_score: Math.max(0, 100 - (backlogs * 10)),
        strong_subjects: strongSubjects,
        weak_subjects: weakSubjects,
        last_calculated_at: new Date().toISOString()
      }], { onConflict: 'profile_id', ignoreDuplicates: false });
      if(res.error) throw res.error;
    }
}

async function doAttendanceSync(profileId, pin) {
    const apiClient = SBTETProvider.getApiClient();
    const attendanceData = await apiClient.getAttendanceReport(pin);
    if (!attendanceData || !attendanceData.Table || attendanceData.Table.length === 0) return;
    const attInserts = attendanceData.Table.map(a => ({
      profile_id: profileId,
      semester: a.semid,
      total_working_days: a.TotalWorkingDays || a.WorkingDays,
      days_present: a.NumberOfDaysPresent,
      attendance_percentage: a.Percentage,
      last_updated_at: new Date().toISOString()
    }));
    const attResult = await adminClient.database.from('attendance_records').upsert(attInserts, { onConflict: 'profile_id,semester', ignoreDuplicates: false });
    if (attResult.error) throw new Error(attResult.error.message);
}

runSyncTwice().catch(console.error);
