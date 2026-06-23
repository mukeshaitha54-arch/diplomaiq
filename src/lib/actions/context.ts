"use server";

import { createInsForgeServerClient } from "@/lib/insforge/server";
import { cache } from "react";

export interface StudentContext {
  profile: any;
  academicSummary: any;
  semesters: any[];
  attendance: any | null;
  subjects: any[];
  derivedMetrics: DerivedMetrics;
}

export interface DerivedMetrics {
  averageSGPA: number;
  bestSemester: number | null;
  lowestSemester: number | null;
  consistencyScore: number;
  healthScoreBreakdown: {
    total: number;
    category: string;
    cgpaContribution: number;
    cgpaMax: number;
    attendanceContribution: number;
    attendanceMax: number;
    backlogContribution: number;
    backlogMax: number;
    consistencyContribution: number;
    consistencyMax: number;
  };
}

/**
 * Fetches all student records and deduplicates the DB calls within the same request lifecycle.
 */
export const getStudentContext = cache(async (): Promise<StudentContext | null> => {
  const { auth } = await createInsForgeServerClient();
  const { data: authData } = await auth.getCurrentUser();
  if (!authData?.user) return null;
  const userId = authData.user.id;

  const { adminClient } = await import("@/lib/insforge/client");

  const [summaryRes, profileRes, semestersRes, attendanceRes, subjectsRes] = await Promise.all([
    adminClient.database.from('academic_summary').select('*').eq('profile_id', userId).single(),
    adminClient.database.from('student_profiles').select('*').eq('id', userId).single(),
    adminClient.database.from('semesters').select('*').eq('profile_id', userId).order('semester_number'),
    adminClient.database.from('attendance_records').select('*').eq('profile_id', userId).order('last_updated_at', { ascending: false }).limit(1),
    adminClient.database.from('subjects').select('*').eq('profile_id', userId)
  ]);

  const profile = profileRes.data;
  const academicSummary = summaryRes.data;
  const semesters = semestersRes.data || [];
  const attendance = attendanceRes.data?.[0] || null;
  const subjects = subjectsRes.data || [];

  if (!profile || !academicSummary) return null;

  // Compute Derived Metrics
  const derivedMetrics = computeDerivedMetrics(academicSummary, semesters, attendance);

  return {
    profile,
    academicSummary,
    semesters,
    attendance,
    subjects,
    derivedMetrics
  };
});

function computeDerivedMetrics(summary: any, semesters: any[], attendance: any): DerivedMetrics {
  let averageSGPA = 0;
  let bestSemester = null;
  let lowestSemester = null;
  let consistencyScore = 100; // 0 to 100

  if (semesters.length > 0) {
    const sgpas = semesters.map(s => Number(s.sgpa)).filter(s => !isNaN(s));
    if (sgpas.length > 0) {
      averageSGPA = sgpas.reduce((a, b) => a + b, 0) / sgpas.length;
      bestSemester = Math.max(...sgpas);
      lowestSemester = Math.min(...sgpas);
      
      // Calculate consistency: higher variation = lower consistency
      if (sgpas.length > 1) {
        let totalDiff = 0;
        for (let i = 1; i < sgpas.length; i++) {
          totalDiff += Math.abs(sgpas[i] - sgpas[i-1]);
        }
        const avgDiff = totalDiff / (sgpas.length - 1);
        // If average difference is 0, score is 100. If diff is >= 2.0 points, score is close to 0.
        consistencyScore = Math.max(0, 100 - (avgDiff * 50));
      }
    }
  }

  // Calculate Health Score 2.0 Breakdown
  // 40% CGPA, 25% Attendance, 20% Backlogs, 15% Consistency
  const cgpa = Number(summary.cgpa) || 0;
  // CGPA contribution: up to 40. (cgpa / 10) * 40
  const cgpaContribution = Math.min(40, (cgpa / 10) * 40);

  const attnd = attendance ? (Number(attendance.percentage) || Number(attendance.attendance_percentage) || 0) : 0;
  // Attendance contribution: up to 25. (attnd / 100) * 25
  const attendanceContribution = Math.min(25, (attnd / 100) * 25);

  const backlogs = Number(summary.total_backlogs) || 0;
  // Backlog contribution: up to 20. 0 backlogs = 20, 1 backlog = 15, 2 = 10, >4 = 0
  const backlogContribution = Math.max(0, 20 - (backlogs * 5));

  // Consistency contribution: up to 15. (consistencyScore / 100) * 15
  const consistencyContribution = (consistencyScore / 100) * 15;

  const totalHealth = Math.round(cgpaContribution + attendanceContribution + backlogContribution + consistencyContribution);

  let category = "At Risk";
  if (totalHealth >= 90) category = "Excellent";
  else if (totalHealth >= 75) category = "Good";
  else if (totalHealth >= 60) category = "Needs Attention";

  return {
    averageSGPA: Number(averageSGPA.toFixed(2)),
    bestSemester,
    lowestSemester,
    consistencyScore: Math.round(consistencyScore),
    healthScoreBreakdown: {
      total: totalHealth,
      category,
      cgpaContribution: Math.round(cgpaContribution),
      cgpaMax: 40,
      attendanceContribution: Math.round(attendanceContribution),
      attendanceMax: 25,
      backlogContribution,
      backlogMax: 20,
      consistencyContribution: Math.round(consistencyContribution),
      consistencyMax: 15
    }
  };
}
