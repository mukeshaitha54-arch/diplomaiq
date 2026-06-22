'use server';
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchSBTETPreview = fetchSBTETPreview;
exports.commitSBTETDataToDatabase = commitSBTETDataToDatabase;
exports.getAttendanceCaptchaAction = getAttendanceCaptchaAction;
exports.syncAttendanceAction = syncAttendanceAction;
exports.syncSemesterAction = syncSemesterAction;
exports.recalculateAcademicSummaryAction = recalculateAcademicSummaryAction;
const provider_1 = require("../sbtet/provider");
/**
 * Fetches the raw data from SBTET and returns it to the client for preview.
 * This does NOT write to the database.
 */
async function fetchSBTETPreview(profileId, pin) {
    try {
        const engine = provider_1.SBTETProvider.getSyncEngine();
        const previewData = await engine.generateSyncPreview(profileId, pin);
        return { success: true, data: previewData };
    }
    catch (error) {
        return { success: false, error: error.message };
    }
}
/**
 * Writes the previewed data to the InsForge database.
 * This is ONLY called when the user clicks 'Import My Data' or 'Apply Updates'.
 */
async function commitSBTETDataToDatabase(previewData) {
    try {
        const engine = provider_1.SBTETProvider.getSyncEngine();
        await engine.saveToDatabase(previewData);
        return { success: true };
    }
    catch (error) {
        return { success: false, error: error.message };
    }
}
/**
 * Phase 5.5: Generates a Captcha matching SBTET style for the UI.
 */
async function getAttendanceCaptchaAction() {
    const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ@!#$%^&*";
    let captchaText = "";
    for (let i = 0; i < 6; i++) {
        captchaText += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Create simple SVG Base64 (to avoid native canvas dependencies on serverless)
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="50">
    <rect width="100%" height="100%" fill="#f0f0f0"/>
    <text x="10" y="35" font-size="25" font-family="Georgia" fill="#333">${captchaText}</text>
  </svg>`;
    const base64 = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
    // In production, encrypt/sign the text. For now, simple base64 hash.
    const hash = Buffer.from(`valid_${captchaText}`).toString('base64');
    return { base64, hash };
}
/**
 * Phase 5.5: Validates Captcha and syncs attendance.
 */
async function syncAttendanceAction(profileId, pin, inputCaptcha, hash) {
    try {
        const expectedHash = Buffer.from(`valid_${inputCaptcha}`).toString('base64');
        if (expectedHash !== hash) {
            return { success: false, error: 'Invalid Captcha' };
        }
        // Valid Captcha! Fetch attendance data.
        const connector = provider_1.SBTETProvider.getConnector();
        const attendanceData = await connector.fetchAttendance(pin);
        if (!attendanceData || attendanceData.length === 0) {
            return { success: false, error: 'No attendance data found' };
        }
        // Map to InsForge
        const attInserts = attendanceData.map(a => ({
            profile_id: profileId,
            semester: a.semester,
            total_working_days: a.totalWorkingDays,
            days_present: a.daysPresent,
            attendance_percentage: a.attendancePercentage,
            last_updated_at: new Date().toISOString()
        }));
        const { adminClient } = await Promise.resolve().then(() => __importStar(require('../insforge/client')));
        const attResult = await adminClient.database.from('attendance_records').upsert(attInserts);
        if (attResult.error)
            throw new Error(attResult.error.message);
        // Log Sync Event
        const logResult = await adminClient.database.from('sync_logs').insert([{
                profile_id: profileId,
                status: 'success',
                records_synced: attendanceData.length,
                duration_ms: 500,
                error_message: null
            }]);
        if (logResult.error)
            throw new Error(logResult.error.message);
        return { success: true, data: attendanceData };
    }
    catch (error) {
        return { success: false, error: error.message };
    }
}
/**
 * Phase 5.5: Syncs a single semester to avoid timeout.
 */
async function syncSemesterAction(profileId, pin, semester) {
    try {
        const connector = provider_1.SBTETProvider.getConnector();
        // 1. Fetch
        const result = await connector.fetchResults(pin, semester);
        // 2. Map & UPSERT directly for incremental sync
        const { adminClient } = await Promise.resolve().then(() => __importStar(require('../insforge/client')));
        const semResult = await adminClient.database.from('semesters').upsert([{
                profile_id: profileId,
                semester_number: semester,
                sgpa: result.sgpa,
                total_credits: result.subjects.reduce((sum, s) => sum + s.credits, 0),
                is_passed: result.isPassed,
                published_date: result.publishedDate.toISOString()
            }], { onConflict: 'profile_id,semester_number' });
        if (semResult.error)
            throw new Error(semResult.error.message);
        const subjectInserts = result.subjects.map(sub => ({
            profile_id: profileId,
            semester_number: semester,
            subject_code: sub.subjectCode,
            subject_name: sub.subjectName,
            internal_marks: sub.internalMarks,
            external_marks: sub.externalMarks,
            total_marks: sub.totalMarks,
            credits: sub.credits,
            grade: sub.grade,
            result_status: sub.resultStatus
        }));
        const subResult = await adminClient.database.from('subjects').upsert(subjectInserts, { onConflict: 'profile_id,subject_code' });
        if (subResult.error)
            throw new Error(subResult.error.message);
        // Log Sync Event
        const logResult = await adminClient.database.from('sync_logs').insert([{
                profile_id: profileId,
                status: 'success',
                records_synced: subjectInserts.length + 1,
                duration_ms: 1000,
                error_message: null
            }]);
        if (logResult.error)
            throw new Error(logResult.error.message);
        return { success: true, data: result };
    }
    catch (error) {
        return { success: false, error: error.message };
    }
}
/**
 * Phase 5.5: Recalculates CGPA after multi-semester fetch.
 */
async function recalculateAcademicSummaryAction(profileId) {
    try {
        const { adminClient } = await Promise.resolve().then(() => __importStar(require('../insforge/client')));
        const { data: sems, error: semsError } = await adminClient.database.from('semesters').select('*').eq('profile_id', profileId);
        if (semsError)
            throw new Error(semsError.message);
        const { data: subs, error: subsError } = await adminClient.database.from('subjects').select('*').eq('profile_id', profileId);
        if (subsError)
            throw new Error(subsError.message);
        if (!sems || !subs)
            return { success: true };
        const cgpa = sems.reduce((acc, s) => acc + (s.sgpa || 0), 0) / (sems.length || 1);
        const backlogs = subs.filter((s) => s.result_status === 'F').length;
        const summaryResult = await adminClient.database.from('academic_summary').upsert([{
                profile_id: profileId,
                cgpa: Number(cgpa.toFixed(2)),
                total_backlogs: backlogs,
                health_score: 100 - (backlogs * 10), // basic calc
                last_calculated_at: new Date().toISOString()
            }]);
        if (summaryResult.error)
            throw new Error(summaryResult.error.message);
        return { success: true };
    }
    catch (e) {
        return { success: false, error: e.message };
    }
}
