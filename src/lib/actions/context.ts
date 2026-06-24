"use server";

import { createInsForgeServerClient } from "@/lib/insforge/server";
import { cache } from "react";
import { AcademicDataset } from "../adapters/AcademicDataset";
import { SemesterAdapter, AssessmentAdapter } from "../adapters";

export interface StudentContext {
  profile: any;
  academicSummary: any; // Mapped from dataset for backward compatibility
  semesters: any[]; // Mapped from dataset
  attendance: any | null;
  subjects: any[]; // Mapped from dataset
  dataset: AcademicDataset;
  derivedMetrics: DerivedMetrics;
  prediction: any | null; // Latest prediction
}

export interface DerivedMetrics {
  // Backward compatible fields
  averageSGPA: number;
  bestSemester: number | null;
  lowestSemester: number | null;
  
  // New generic fields
  averageScore: number;
  bestPeriod: number | null;
  lowestPeriod: number | null;
  
  consistencyScore: number;
  healthScoreBreakdown: {
    total: number;
    category: string;
    
    // Backward compatible fields
    cgpaContribution: number;
    cgpaMax: number;
    
    // New generic fields
    aggregateContribution: number;
    aggregateMax: number;
    
    attendanceContribution: number;
    attendanceMax: number;
    backlogContribution: number;
    backlogMax: number;
    consistencyContribution: number;
    consistencyMax: number;
  };
}

export const getStudentContext = cache(async (datasetType: 'semester' | 'mid1' | 'mid2' | 'internal' | 'supply' | 'current' = 'semester'): Promise<StudentContext | null> => {
  const { auth } = await createInsForgeServerClient();
  const { data: authData } = await auth.getCurrentUser();
  if (!authData?.user) return null;
  const userId = authData.user.id;

  const { adminClient } = await import("@/lib/insforge/client");

  // Fetch core profile and latest prediction
  const [profileRes, attendanceRes, predictionRes] = await Promise.all([
    adminClient.database.from('student_profiles').select('*').eq('id', userId).single(),
    adminClient.database.from('attendance_records').select('*').eq('profile_id', userId).order('last_updated_at', { ascending: false }).limit(1),
    adminClient.database.from('prediction_history').select('*').eq('profile_id', userId).order('created_at', { ascending: false }).limit(1)
  ]);

  const profile = profileRes.data;
  const attendance = attendanceRes.data?.[0] || null;
  const prediction = predictionRes.data?.[0] || null;

  if (!profile) return null;

  let dataset: AcademicDataset;

  if (datasetType === 'semester') {
    const [summaryRes, semestersRes, subjectsRes] = await Promise.all([
      adminClient.database.from('academic_summary').select('*').eq('profile_id', userId).single(),
      adminClient.database.from('semesters').select('*').eq('profile_id', userId).order('semester_number'),
      adminClient.database.from('subjects').select('*').eq('profile_id', userId)
    ]);
    if (!summaryRes.data) return null;
    dataset = SemesterAdapter.adapt(summaryRes.data, semestersRes.data || [], subjectsRes.data || []);
  } else {
    const [summaryRes, instancesRes] = await Promise.all([
      adminClient.database.from('assessment_summaries').select('*').eq('profile_id', userId).eq('assessment_type', datasetType).single(),
      adminClient.database.from('assessment_instances').select('*').eq('profile_id', userId).eq('assessment_type', datasetType).order('semester_number'),
    ]);

    const instanceIds = (instancesRes.data || []).map((i: any) => i.id);
    let subsData: any[] = [];
    if (instanceIds.length > 0) {
      const { data } = await adminClient.database.from('assessment_subjects').select('*').in('assessment_instance_id', instanceIds);
      subsData = data || [];
    }
    
    dataset = AssessmentAdapter.adapt(datasetType, summaryRes.data, instancesRes.data || [], subsData);
  }

  // Compute generic metrics
  const derivedMetrics = computeDerivedMetrics(dataset, attendance);

  // Hydrate old fields for backward compatibility, mapping the new abstract dataset properties
  // directly to the old object schemas expected by the existing UI components.
  const academicSummary = {
    cgpa: dataset.summary.aggregateScore,
    total_backlogs: dataset.summary.totalFailedSubjects,
    strong_subjects: dataset.summary.strongSubjects,
    weak_subjects: dataset.summary.weakSubjects,
    last_calculated_at: dataset.summary.lastCalculatedAt
  };

  const semesters = dataset.periods.map(p => ({
    id: p.periodNumber.toString(),
    semester_number: p.periodNumber,
    sgpa: p.periodScore,
    is_passed: p.isPassed,
    published_date: p.publishedDate
  }));

  const subjects = dataset.periods.flatMap(p => p.subjects.map(s => ({
    id: s.subjectCode,
    semester_number: p.periodNumber,
    subject_code: s.subjectCode,
    subject_name: s.subjectName,
    total_marks: s.marks,
    grade: s.grade,
    is_backlog: s.isFailed,
    result_status: s.isFailed ? 'F' : 'P'
  })));

  return {
    profile,
    academicSummary,
    semesters,
    attendance,
    subjects,
    dataset,
    derivedMetrics,
    prediction
  };
});

function computeDerivedMetrics(dataset: AcademicDataset, attendance: any): DerivedMetrics {
  let averageScore = 0;
  let bestPeriod = null;
  let lowestPeriod = null;
  let consistencyScore = 100;

  if (dataset.periods.length > 0) {
    const scores = dataset.periods.map(p => Number(p.periodScore)).filter(s => !isNaN(s));
    if (scores.length > 0) {
      averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      bestPeriod = Math.max(...scores);
      lowestPeriod = Math.min(...scores);
      
      if (scores.length > 1) {
        let totalDiff = 0;
        for (let i = 1; i < scores.length; i++) {
          totalDiff += Math.abs(scores[i] - scores[i-1]);
        }
        const avgDiff = totalDiff / (scores.length - 1);
        consistencyScore = Math.max(0, 100 - (avgDiff * 50));
      }
    }
  }

  const aggregateScore = Number(dataset.summary.aggregateScore) || 0;
  const aggMax = dataset.type === 'semester' ? 10 : 100;
  const aggregateContribution = Math.min(40, (aggregateScore / aggMax) * 40);

  const attnd = attendance ? (Number(attendance.percentage) || Number(attendance.attendance_percentage) || 0) : 0;
  const attendanceContribution = Math.min(25, (attnd / 100) * 25);

  const backlogs = Number(dataset.summary.totalFailedSubjects) || 0;
  const backlogContribution = Math.max(0, 20 - (backlogs * 5));

  const consistencyContribution = (consistencyScore / 100) * 15;

  const totalHealth = Math.round(aggregateContribution + attendanceContribution + backlogContribution + consistencyContribution);

  let category = "At Risk";
  if (totalHealth >= 90) category = "Excellent";
  else if (totalHealth >= 75) category = "Good";
  else if (totalHealth >= 60) category = "Needs Attention";

  return {
    // Legacy fields mapped exactly
    averageSGPA: Number(averageScore.toFixed(2)),
    bestSemester: bestPeriod,
    lowestSemester: lowestPeriod,
    
    // New fields
    averageScore: Number(averageScore.toFixed(2)),
    bestPeriod,
    lowestPeriod,
    
    consistencyScore: Math.round(consistencyScore),
    healthScoreBreakdown: {
      total: totalHealth,
      category,
      
      // Legacy alias
      cgpaContribution: Math.round(aggregateContribution),
      cgpaMax: 40,
      
      // New generic
      aggregateContribution: Math.round(aggregateContribution),
      aggregateMax: 40,
      
      attendanceContribution: Math.round(attendanceContribution),
      attendanceMax: 25,
      backlogContribution,
      backlogMax: 20,
      consistencyContribution: Math.round(consistencyContribution),
      consistencyMax: 15
    }
  };
}
