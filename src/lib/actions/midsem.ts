"use server";

import { createInsForgeServerClient } from "@/lib/insforge/server";

export async function saveMidSemDataAction(formData: FormData) {
  try {
    const { auth } = await createInsForgeServerClient();
    const { data: authData } = await auth.getCurrentUser();
    if (!authData?.user) throw new Error("Unauthorized");
    const userId = authData.user.id;

    const { adminClient } = await import("@/lib/insforge/client");

    const assessmentType = formData.get("assessment_type") as string;
    const semesterNumber = parseInt(formData.get("semester_number") as string, 10);
    
    // Extract subject keys: "subject_CS301_marks", "subject_CS301_max", "subject_CS301_name"
    const subjects: Array<{ code: string; name: string; marks: number; maxMarks: number }> = [];
    
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("subject_") && key.endsWith("_marks")) {
        const code = key.replace("subject_", "").replace("_marks", "");
        const marks = parseInt(value as string, 10);
        const maxMarks = parseInt(formData.get(`subject_${code}_max`) as string, 10) || 20;
        const name = formData.get(`subject_${code}_name`) as string || code;
        
        if (!isNaN(marks)) {
          subjects.push({ code, name, marks, maxMarks });
        }
      }
    }

    if (subjects.length === 0) {
      throw new Error("No subjects provided");
    }

    // Calculate instance summary
    let totalMarks = 0;
    let totalMax = 0;
    let failedCount = 0;
    
    subjects.forEach(s => {
      totalMarks += s.marks;
      totalMax += s.maxMarks;
      // Define fail condition: e.g., below 35%
      if ((s.marks / s.maxMarks) < 0.35) {
        failedCount++;
      }
    });

    // Performance index is mapped out of 10 for consistency, or out of 100
    // Let's make Performance Index out of 100 for Mids to differentiate from SGPA
    const performanceIndex = totalMax > 0 ? (totalMarks / totalMax) * 100 : 0;

    // 1. Upsert assessment_instance
    const { data: instance, error: instanceError } = await adminClient.database
      .from("assessment_instances")
      .upsert({
        profile_id: userId,
        assessment_type: assessmentType,
        semester_number: semesterNumber,
        performance_index: parseFloat(performanceIndex.toFixed(2)),
        total_marks: totalMarks
      }, { onConflict: "profile_id,semester_number,assessment_type" })
      .select()
      .single();

    if (instanceError) throw instanceError;

    // 2. Upsert subjects
    const subjectUpserts = subjects.map(s => ({
      assessment_instance_id: instance.id,
      subject_code: s.code,
      subject_name: s.name,
      marks_obtained: s.marks,
      max_marks: s.maxMarks,
      is_failed: (s.marks / s.maxMarks) < 0.35
    }));

    const { error: subjectsError } = await adminClient.database
      .from("assessment_subjects")
      .upsert(subjectUpserts, { onConflict: "assessment_instance_id,subject_code" });

    if (subjectsError) throw subjectsError;

    // 3. Re-calculate assessment_summaries for this type across all semesters
    const { data: allInstances } = await adminClient.database
      .from("assessment_instances")
      .select("*")
      .eq("profile_id", userId)
      .eq("assessment_type", assessmentType);

    const { data: allSubjects } = await adminClient.database
      .from("assessment_subjects")
      .select("*")
      .in("assessment_instance_id", allInstances!.map(i => i.id));

    let globalTotalMarks = 0;
    let globalMaxMarks = 0;
    let totalFailedSubjects = 0;
    
    const subjectAverages: Record<string, { total: number, count: number, name: string }> = {};

    allInstances?.forEach(inst => {
      const instSubs = allSubjects?.filter(s => s.assessment_instance_id === inst.id) || [];
      instSubs.forEach(s => {
        globalTotalMarks += s.marks_obtained;
        globalMaxMarks += s.max_marks;
        if (s.is_failed) totalFailedSubjects++;

        if (!subjectAverages[s.subject_code]) {
          subjectAverages[s.subject_code] = { total: 0, count: 0, name: s.subject_name };
        }
        subjectAverages[s.subject_code].total += (s.marks_obtained / s.max_marks);
        subjectAverages[s.subject_code].count++;
      });
    });

    const aggregateScore = globalMaxMarks > 0 ? (globalTotalMarks / globalMaxMarks) * 100 : 0;

    // Determine strong/weak subjects overall
    const threshold = 0.60; // 60%
    const strong_subjects: string[] = [];
    const weak_subjects: string[] = [];
    
    for (const [code, data] of Object.entries(subjectAverages)) {
      const avg = data.total / data.count;
      if (avg >= 0.75) strong_subjects.push(data.name);
      else if (avg <= 0.40) weak_subjects.push(data.name);
    }

    await adminClient.database.from("assessment_summaries").upsert({
      profile_id: userId,
      assessment_type: assessmentType,
      aggregate_score: parseFloat(aggregateScore.toFixed(2)),
      total_failed_subjects: totalFailedSubjects,
      strong_subjects,
      weak_subjects,
      last_calculated_at: new Date().toISOString()
    }, { onConflict: "profile_id,assessment_type" });

    // Call Prediction Engine (we will implement this fully in step 3, placeholder for now)
    await generatePrediction(userId, assessmentType, adminClient);

    return { success: true };
  } catch (error: any) {
    console.error("Failed to save mid-sem data", error);
    return { success: false, error: error.message };
  }
}

async function generatePrediction(userId: string, assessmentType: string, adminClient: any) {
  // Fetch historical mid and final data
  const [midRes, semRes, profileRes] = await Promise.all([
    adminClient.database.from("assessment_instances").select("*").eq("profile_id", userId).eq("assessment_type", assessmentType),
    adminClient.database.from("semesters").select("*").eq("profile_id", userId),
    adminClient.database.from("academic_summary").select("*").eq("profile_id", userId).single()
  ]);

  const mids = midRes.data || [];
  const sems = semRes.data || [];
  const currentCgpa = parseFloat(profileRes.data?.cgpa || "0");

  if (mids.length === 0) return;

  // The latest mid data is the one we want to predict final results for
  const latestMid = mids.reduce((max: any, m: any) => m.semester_number > max.semester_number ? m : max, mids[0]);

  // Calculate historical correlation
  let totalDeltaMultiplier = 1.0;
  let historicalPairs = 0;

  for (const mid of mids) {
    if (mid.semester_number < latestMid.semester_number) {
      const finalResult = sems.find((s: any) => s.semester_number === mid.semester_number);
      if (finalResult && finalResult.sgpa > 0) {
        // Mid index is out of 100, Final SGPA is out of 10.
        // So normalized mid = mid.performance_index / 10
        const normalizedMid = mid.performance_index / 10;
        const multiplier = finalResult.sgpa / (normalizedMid || 1);
        totalDeltaMultiplier += multiplier;
        historicalPairs++;
      }
    }
  }

  // Average correlation factor (if no history, default to 1.0 meaning final == mid)
  const correlationFactor = historicalPairs > 0 ? (totalDeltaMultiplier - 1.0) / historicalPairs : 1.0;

  // Predicted SGPA
  const normalizedLatestMid = latestMid.performance_index / 10;
  let predictedSGPA = normalizedLatestMid * correlationFactor;
  if (predictedSGPA > 10) predictedSGPA = 10; // Cap at 10

  // Predicted CGPA
  // Weighted average of historical CGPA + new Predicted SGPA
  const completedSemestersCount = sems.length;
  let predictedCGPA = currentCgpa;
  if (completedSemestersCount > 0) {
    predictedCGPA = ((currentCgpa * completedSemestersCount) + predictedSGPA) / (completedSemestersCount + 1);
  } else {
    predictedCGPA = predictedSGPA;
  }

  // Backlog Risk
  // Fetch subjects for this latest mid
  const { data: midSubjects } = await adminClient.database
    .from("assessment_subjects")
    .select("*")
    .eq("assessment_instance_id", latestMid.id);

  let predictedBacklogs = 0;
  const weakSubjectsList: string[] = [];
  
  if (midSubjects) {
    midSubjects.forEach((sub: any) => {
      const percentage = sub.max_marks > 0 ? (sub.marks_obtained / sub.max_marks) : 0;
      // High risk if < 40%
      if (percentage < 0.40) {
        predictedBacklogs++;
        weakSubjectsList.push(sub.subject_name);
      } else if (percentage < 0.50) {
        weakSubjectsList.push(sub.subject_name);
      }
    });
  }

  let riskLevel = 'LOW';
  if (predictedBacklogs > 2 || predictedSGPA < 5) riskLevel = 'HIGH';
  else if (predictedBacklogs > 0 || predictedSGPA < 6.5) riskLevel = 'MEDIUM';

  await adminClient.database.from("prediction_history").insert({
    profile_id: userId,
    predicted_sgpa: parseFloat(predictedSGPA.toFixed(2)),
    predicted_cgpa: parseFloat(predictedCGPA.toFixed(2)),
    predicted_backlogs: predictedBacklogs,
    risk_level: riskLevel,
    based_on_assessment: assessmentType
  });
}
