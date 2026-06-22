'use server';

import { SBTETProvider } from '../sbtet/provider';
import { createInsForgeServerClient } from '../insforge/server';
import { namesMatch } from '../utils/nameMatch';

export async function verifyStudentIdentity(formData: FormData) {
  try {
    const fullName = String(formData.get('fullName') || '').trim();
    const pin = String(formData.get('pin') || '').trim();
    const scheme = String(formData.get('scheme') || '').trim();
    const currentSemester = parseInt(String(formData.get('currentSemester') || '1'), 10);

    if (!fullName || !pin || !scheme) {
      return { success: false, error: 'Full Name, PIN, and Scheme are required.' };
    }

    const { adminClient } = await import('../insforge/client');
    const { auth } = await createInsForgeServerClient();
    const { data: authData, error: authErr } = await auth.getCurrentUser();
    
    if (authErr || !authData?.user) {
      return { success: false, error: 'You must be logged in to verify identity.' };
    }
    const userId = authData.user.id;

    // Check if already verified
    const { data: existingProfile } = await adminClient.database
      .from('student_profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (existingProfile) {
      return { success: false, error: 'already_verified' };
    }

    // Lookup on SBTET API
    const apiClient = SBTETProvider.getApiClient();
    const startTime = Date.now();
    const studentInfo = await apiClient.verifyStudent(pin);
    const durationMs = Date.now() - startTime;

    // Log Verification Action
    await adminClient.database.from('sync_logs').insert([{
      profile_id: userId,
      status: 'success',
      records_synced: 1,
      duration_ms: durationMs,
      error_message: 'Verification Lookups'
    }]);

    // Cross-validate Name
    if (!namesMatch(fullName, studentInfo.fullName)) {
      return { 
        success: false, 
        error: `The entered name does not match Telangana SBTET records. Please try again.` 
      };
    }

    // Assign user-selected scheme and semester to the preview data
    return { 
      success: true, 
      data: {
        studentInfo: {
          ...studentInfo,
          scheme // The user-selected scheme overrides since API might not explicitly provide the exact version user wants, but we keep what user selected.
        },
        currentSemester
      } 
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to verify with SBTET.' };
  }
}

export async function importVerifiedIdentity(previewData: any) {
  try {
    const { studentInfo, currentSemester } = previewData;

    const { auth } = await createInsForgeServerClient();
    const { data: authData, error: authErr } = await auth.getCurrentUser();
    
    if (authErr || !authData?.user) {
      return { success: false, error: 'You must be logged in to import records.' };
    }
    const userId = authData.user.id;

    const { adminClient } = await import('../insforge/client');
    const { error: insertErr } = await adminClient.database.from('student_profiles').insert({
      id: userId,
      pin: studentInfo.pin,
      full_name: studentInfo.fullName,
      scheme: studentInfo.scheme,
      branch: studentInfo.branchCode,
      college_code: studentInfo.collegeCode,
      college_name: studentInfo.collegeName,
      current_semester: currentSemester,
      verified_at: new Date().toISOString()
    });

    if (insertErr) {
      throw new Error(insertErr.message);
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to save academic record.' };
  }
}

/**
 * Syncs Academic Data using the Consolidated API.
 */
export async function syncAcademicDataAction() {
  try {
    const { auth } = await createInsForgeServerClient();
    const { data: authData } = await auth.getCurrentUser();
    if (!authData?.user) return { success: false, error: 'Unauthorized' };
    const profileId = authData.user.id;

    const { adminClient } = await import('../insforge/client');
    const { data: profile, error: profileErr } = await adminClient.database
      .from('student_profiles')
      .select('current_semester, scheme, pin')
      .eq('id', profileId)
      .single();
      
    if (profileErr || !profile) {
      return { success: false, error: 'Student profile not found.' };
    }

    const pin = profile.pin;

    const apiClient = SBTETProvider.getApiClient();
    const startTime = Date.now();
    const result = await apiClient.getConsolidatedResults(pin);
    const durationMs = Date.now() - startTime;

    let recordsSynced = 0;
    const currentSemester = profile.current_semester;
    const maxSemToFetch = currentSemester - 1;

    // Process Semesters
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
        const semesterId = semResult.data[0].id;

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
          recordsSynced += subjectInserts.length;
        }
      }
    }

    // Generate academic_summary from Table1
    if (result.Table1 && result.Table1.length > 0) {
      const summaryInfo = result.Table1[0];
      const { data: subs } = await adminClient.database.from('subjects').select('*').eq('profile_id', profileId);
      const backlogs = subs ? subs.filter((s: any) => s.result_status === 'F').length : 0;
      
      await adminClient.database.from('academic_summary').upsert([{
        profile_id: profileId,
        cgpa: summaryInfo.CGPA,
        total_backlogs: backlogs,
        health_score: Math.max(0, 100 - (backlogs * 10)),
        last_calculated_at: new Date().toISOString()
      }]);
    }

    // Log Sync Event
    await adminClient.database.from('sync_logs').insert([{
      profile_id: profileId,
      status: 'success',
      records_synced: recordsSynced,
      duration_ms: durationMs,
      error_message: null
    }]);
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Syncs attendance using direct API. No Captcha required.
 */
export async function syncAttendanceAction() {
  try {
    const { auth } = await createInsForgeServerClient();
    const { data: authData } = await auth.getCurrentUser();
    if (!authData?.user) return { success: false, error: 'Unauthorized' };
    const profileId = authData.user.id;

    const { adminClient } = await import('../insforge/client');
    const { data: profile } = await adminClient.database
      .from('student_profiles')
      .select('pin')
      .eq('id', profileId)
      .single();
      
    if (!profile) return { success: false, error: 'Student profile not found.' };
    const pin = profile.pin;

    const apiClient = SBTETProvider.getApiClient();
    const startTime = Date.now();
    const attendanceData = await apiClient.getAttendanceReport(pin);
    const durationMs = Date.now() - startTime;

    if (!attendanceData || !attendanceData.Table || attendanceData.Table.length === 0) {
      return { success: false, error: 'No attendance data found' };
    }
    
    const attInserts = attendanceData.Table.map(a => ({
      profile_id: profileId,
      semester: a.semid,
      total_working_days: a.TotalWorkingDays || a.WorkingDays,
      days_present: a.NumberOfDaysPresent,
      attendance_percentage: a.Percentage,
      last_updated_at: new Date().toISOString()
    }));
    
    const { adminClient } = await import('../insforge/client');
    const attResult = await adminClient.database.from('attendance_records').upsert(attInserts);
    if (attResult.error) throw new Error(attResult.error.message);
    
    await adminClient.database.from('sync_logs').insert([{
      profile_id: profileId,
      status: 'success',
      records_synced: attInserts.length,
      duration_ms: durationMs,
      error_message: null
    }]);
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function recalculateAcademicSummaryAction(profileId: string) {
  // Now handled purely inside syncAcademicDataAction based on Table1 CGPA and subjects table backlogs
  return { success: true };
}

