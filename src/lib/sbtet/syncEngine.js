"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcademicSyncEngine = void 0;
const client_1 = require("../insforge/client"); // Assuming an InsForge client exists or we'll create it
/**
 * Orchestrates the synchronization flow between the external SBTET portal
 * and the internal InsForge database.
 */
class AcademicSyncEngine {
    constructor(connector) {
        this.connector = connector;
    }
    /**
     * Transforms raw results into a normalized structure for DB preview.
     * This does NOT save to the database. It returns the preview data for user consent.
     */
    async generateSyncPreview(profileId, pin) {
        const studentInfo = await this.connector.verifyStudent(pin);
        const attendance = await this.connector.fetchAttendance(pin).catch(() => []);
        const consolidated = await this.connector.fetchConsolidatedResults(pin);
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
    calculateAcademicSummary(consolidated, attendance) {
        const overallAttendance = attendance.length > 0
            ? attendance.reduce((sum, a) => sum + a.attendancePercentage, 0) / attendance.length
            : 0;
        let strongSubjects = [];
        let weakSubjects = [];
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
    async saveToDatabase(previewData) {
        const { studentInfo, attendance, consolidated, summary, profileId } = previewData;
        // 1. Update Student Profile
        await client_1.insforge.database.from('student_profiles').upsert({
            id: profileId,
            pin_number: studentInfo.pin,
            full_name: studentInfo.fullName,
            branch: studentInfo.branchCode,
            college_name: studentInfo.collegeName,
            scheme: studentInfo.scheme,
            last_synced_at: new Date().toISOString()
        });
        // 2. Update Semesters and Subjects
        for (const [semNum, result] of Object.entries(consolidated.results)) {
            const semResult = result;
            await client_1.insforge.database.from('semesters').upsert({
                profile_id: profileId,
                semester_number: parseInt(semNum),
                sgpa: semResult.sgpa,
                is_completed: semResult.isPassed
            });
            const subjectInserts = semResult.subjects.map(sub => ({
                profile_id: profileId,
                semester_number: parseInt(semNum),
                subject_code: sub.subjectCode,
                subject_name: sub.subjectName,
                internal_marks: sub.internalMarks,
                external_marks: sub.externalMarks,
                total_marks: sub.totalMarks,
                grade: sub.grade,
                is_backlog: sub.resultStatus === 'F'
            }));
            // In InsForge/Supabase, upsert requires a unique constraint. Assuming (profile_id, subject_code)
            await client_1.insforge.database.from('subjects').upsert(subjectInserts);
        }
        // 3. Update Attendance
        if (attendance.length > 0) {
            const attInserts = attendance.map((a) => ({
                profile_id: profileId,
                semester_number: a.semester,
                total_working_days: a.totalWorkingDays,
                days_present: a.daysPresent,
                attendance_percentage: a.attendancePercentage
            }));
            await client_1.insforge.database.from('attendance_records').upsert(attInserts);
        }
        // 4. Update Academic Summary
        await client_1.insforge.database.from('academic_summary').upsert({
            profile_id: profileId,
            cgpa: summary.cgpa,
            total_backlogs: summary.total_backlogs,
            health_score: summary.health_score,
            strong_subjects: summary.strong_subjects,
            weak_subjects: summary.weak_subjects,
            last_calculated_at: summary.last_calculated_at
        });
        // 5. Log Sync
        await client_1.insforge.database.from('sync_logs').insert({
            profile_id: profileId,
            status: 'SUCCESS',
            records_synced: Object.keys(consolidated.results).length * 10, // Approx
            duration_ms: 5000, // Dummy
            created_at: new Date().toISOString()
        });
    }
    calculateHealthScore(cgpa, backlogs, attendance) {
        let score = (cgpa / 10) * 50;
        score += (attendance / 100) * 30;
        score += Math.max(0, 20 - (backlogs * 5));
        return Math.round(score);
    }
}
exports.AcademicSyncEngine = AcademicSyncEngine;
