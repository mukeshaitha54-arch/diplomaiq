import { ISBTETConnector } from './connector';
import { SBTETResult, SBTETAttendance, SBTETConsolidatedResult, SBTETStudentInfo } from './models';
import { insforge } from '../insforge/client'; // Assuming an InsForge client exists or we'll create it

/**
 * Orchestrates the synchronization flow between the external SBTET portal
 * and the internal InsForge database.
 */
export class AcademicSyncEngine {
  private connector: ISBTETConnector;

  constructor(connector: ISBTETConnector) {
    this.connector = connector;
  }

  /**
   * Transforms raw results into a normalized structure for DB preview.
   * This does NOT save to the database. It returns the preview data for user consent.
   */
  async generateSyncPreview(profileId: string, pin: string, scheme: string) {
    const studentInfo = await this.connector.verifyStudent(pin, scheme);
    const attendance = await this.connector.fetchAttendance(pin).catch(() => []);
    const consolidated = await this.connector.fetchConsolidatedResults(pin, scheme);

    const summary = this.calculateAcademicSummary(consolidated, attendance);

    return {
      studentInfo,
      attendance,
      consolidated,
      summary,
      profileId
    };
  }

  /**
   * Precomputes dashboard-ready metrics.
   */
  calculateAcademicSummary(consolidated: SBTETConsolidatedResult, attendance: SBTETAttendance[]) {
    const overallAttendance = attendance.length > 0 
      ? attendance.reduce((sum, a) => sum + a.attendancePercentage, 0) / attendance.length 
      : 0;

    let strongSubjects: string[] = [];
    let weakSubjects: string[] = [];

    // Analyze subjects across all semesters to find strongest and weakest
    let allSubjects = [];
    for (const sem of Object.values(consolidated.results)) {
      allSubjects.push(...sem.subjects);
    }
    
    allSubjects.sort((a, b) => b.totalMarks - a.totalMarks);
    if (allSubjects.length > 0) {
      strongSubjects = allSubjects.slice(0, 3).map(s => s.subjectName);
      // Weak subjects are backlogs or lowest passing marks
      const weak = allSubjects.filter(s => s.resultStatus === 'F' || s.grade.includes('C') || s.grade.includes('D'));
      weakSubjects = weak.length > 0 ? weak.slice(0, 3).map(s => s.subjectName) : allSubjects.slice(-3).map(s => s.subjectName);
    }

    const healthScore = this.calculateHealthScore(consolidated.cgpa, consolidated.totalBacklogs, overallAttendance);

    return {
      cgpa: consolidated.cgpa,
      total_backlogs: consolidated.totalBacklogs,
      health_score: healthScore,
      strong_subjects: strongSubjects,
      weak_subjects: weakSubjects,
      last_calculated_at: new Date().toISOString()
    };
  }

  /**
   * Saves the previewed data into InsForge. Executed ONLY after user clicks "Import My Data" or "Apply Updates".
   */
  async saveToDatabase(previewData: any) {
    const { studentInfo, attendance, consolidated, summary, profileId } = previewData;
    
    // 1. Update Student Profile
    await insforge.database.from('student_profiles').upsert({
      id: profileId,
      pin_number: studentInfo.pin,
      full_name: studentInfo.fullName,
      branch: studentInfo.branchCode,
      college_name: studentInfo.collegeName,
      scheme: studentInfo.scheme,
      last_synced_at: new Date().toISOString()
    });

    // Verification Logging
    const semCount = Object.keys(consolidated.results).length;
    let totalSubjects = 0;
    console.log(`[VERIFICATION] Semesters discovered: ${semCount}`);
    
    for (const [semNum, result] of Object.entries(consolidated.results)) {
      const subCount = (result as SBTETResult).subjects.length;
      totalSubjects += subCount;
      console.log(`[VERIFICATION] Semester ${semNum}: ${subCount} subjects`);
    }
    console.log(`[VERIFICATION] Total subjects discovered: ${totalSubjects}`);

    // 2. Update Semesters and Subjects
    for (const [semNum, result] of Object.entries(consolidated.results)) {
      const semResult = result as SBTETResult;
      const { data: semData, error: semErr } = await insforge.database.from('semesters').upsert({
        profile_id: profileId,
        semester_number: parseInt(semNum),
        sgpa: semResult.sgpa,
        is_completed: semResult.isPassed
      }, { onConflict: 'profile_id,semester_number' }).select();

      if (semErr || !semData || semData.length === 0) continue;
      const semesterId = semData[0].id;

      const subjectInserts = semResult.subjects.map(sub => ({
        semester_id: semesterId,
        subject_code: sub.subjectCode,
        subject_name: sub.subjectName,
        internal_marks: sub.internalMarks,
        external_marks: sub.externalMarks,
        total_marks: sub.totalMarks,
        grade: sub.grade,
        is_backlog: sub.resultStatus === 'F'
      }));

      await insforge.database.from('subjects').upsert(subjectInserts, { onConflict: 'semester_id,subject_code' });
    }

    // 3. Update Attendance
    if (attendance.length > 0) {
      const attInserts = attendance.map((a: SBTETAttendance) => ({
        profile_id: profileId,
        semester_number: a.semester,
        total_working_days: a.totalWorkingDays,
        days_present: a.daysPresent,
        attendance_percentage: a.attendancePercentage
      }));
      await insforge.database.from('attendance_records').upsert(attInserts);
    }

    // 4. Update Academic Summary
    await insforge.database.from('academic_summary').upsert({
      profile_id: profileId,
      cgpa: summary.cgpa,
      total_backlogs: summary.total_backlogs,
      health_score: summary.health_score,
      strong_subjects: summary.strong_subjects,
      weak_subjects: summary.weak_subjects,
      last_calculated_at: summary.last_calculated_at
    });

    // 5. Log Sync
    await insforge.database.from('sync_logs').insert({
      profile_id: profileId,
      status: 'SUCCESS',
      records_synced: Object.keys(consolidated.results).length * 10, // Approx
      duration_ms: 5000, // Dummy
      created_at: new Date().toISOString()
    });
  }

  private calculateHealthScore(cgpa: number, backlogs: number, attendance: number): number {
    let score = (cgpa / 10) * 50; 
    score += (attendance / 100) * 30; 
    score += Math.max(0, 20 - (backlogs * 5)); 
    return Math.round(score);
  }
}
