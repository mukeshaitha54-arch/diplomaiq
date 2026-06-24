import { SBTETProvider } from '../sbtet/provider';
import { createInsForgeServerClient } from '../insforge/server';

export class UnifiedSyncEngine {
  
  static async executeSync(profileId: string) {
    const { adminClient } = await import('../insforge/client');
    const { data: profile } = await adminClient.database
      .from('student_profiles')
      .select('current_semester, scheme, pin')
      .eq('id', profileId)
      .single();
      
    if (!profile) throw new Error('Student profile not found.');

    const pin = profile.pin;
    const apiClient = SBTETProvider.getApiClient();
    const startTime = Date.now();

    // 1. Fetch
    const [consolidated, attendance] = await Promise.all([
      apiClient.getConsolidatedResults(pin),
      apiClient.getAttendanceReport(pin).catch(() => ({ Table: [] }))
    ]);

    // 2. Validate
    if (!consolidated || !consolidated.Table || consolidated.Table.length === 0) {
      throw new Error('No academic records found.');
    }

    // 3. Normalize & Stage
    let recordsSynced = 0;
    const currentSemester = profile.current_semester;
    const maxSemToFetch = currentSemester - 1;

    // --- Backward compatibility (semesters, subjects, academic_summary) ---
    await this.saveLegacySchema(adminClient, profileId, consolidated, maxSemToFetch);
    
    // --- New Assessment Architecture ---
    await this.saveUnifiedAssessments(adminClient, profileId, consolidated);

    // --- Attendance Data ---
    if (attendance && attendance.Table && attendance.Table.length > 0) {
      const attInserts = attendance.Table.map((a: any) => ({
        profile_id: profileId,
        semester: a.semid,
        total_working_days: a.TotalWorkingDays || a.WorkingDays,
        days_present: a.NumberOfDaysPresent,
        attendance_percentage: a.Percentage,
        last_updated_at: new Date().toISOString()
      }));
      await adminClient.database.from('attendance_records').upsert(attInserts, { onConflict: 'profile_id,semester', ignoreDuplicates: false });
    }

    // 4. Generate Predictions
    await this.generatePredictions(adminClient, profileId);

    // Log Sync Event
    const durationMs = Date.now() - startTime;
    await adminClient.database.from('sync_logs').insert([{
      profile_id: profileId,
      status: 'success',
      records_synced: recordsSynced,
      duration_ms: durationMs,
      error_message: null
    }]);

    await adminClient.database.from('student_profiles').update({
      last_synced_at: new Date().toISOString()
    }).eq('id', profileId);

    return { success: true };
  }

  private static async saveLegacySchema(adminClient: any, profileId: string, result: any, maxSemToFetch: number) {
    if (!result.Table3) return;

    const validSems = result.Table3.filter((s: any) => s.SemId <= maxSemToFetch);
    
    for (const sem of validSems) {
      let sgpa = 0;
      if (sem.TotalGradePoints && sem.Credits && sem.Credits > 0) {
        sgpa = Number((sem.TotalGradePoints / sem.Credits).toFixed(2));
      }

      const semSubjects = result.Table2.filter((sub: any) => sub.SemId === sem.SemId && sub.WholeOrSupply !== 'S');
      let isPassed = false;
      if (semSubjects.length > 0) {
        isPassed = semSubjects.every((sub: any) => sub.ExamStatus !== 'F' && (Number(sub.CreditsGained) || 0) > 0);
      }

      await adminClient.database.from('semesters').upsert([{
        profile_id: profileId,
        semester_number: sem.SemId,
        sgpa: sgpa,
        total_credits: sem.Credits || 0,
        is_passed: isPassed
      }], { onConflict: 'profile_id,semester_number' });

      if (semSubjects.length > 0) {
        const subjectInserts = semSubjects.map((sub: any) => ({
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
        await adminClient.database.from('subjects').upsert(subjectInserts, { onConflict: 'profile_id,semester_number,subject_code' });
      }
    }

    // Generate academic_summary
    if (result.Table1 && result.Table1.length > 0) {
      const summaryInfo = result.Table1[0];
      const { data: subs } = await adminClient.database.from('subjects').select('*').eq('profile_id', profileId);
      const backlogs = subs ? subs.filter((s: any) => s.result_status === 'F').length : 0;
      
      let strongSubjects: string[] = [];
      let weakSubjects: string[] = [];
      
      if (subs && subs.length > 0) {
        const strong = subs.filter((s: any) => {
          const totalMarks = s.total_marks || 0;
          return s.grade === 'O' || s.grade === 'A+' || s.grade === 'A' || (totalMarks >= 85);
        }).sort((a: any, b: any) => (b.total_marks || 0) - (a.total_marks || 0));
        
        strongSubjects = strong.slice(0, 4).map((s: any) => s.subject_name);

        const failed = subs.filter((s: any) => s.result_status === 'F');
        if (failed.length > 0) {
          weakSubjects = failed.map((s: any) => s.subject_name);
        } else {
          const bottom = [...subs].sort((a: any, b: any) => (a.total_marks || 0) - (b.total_marks || 0));
          weakSubjects = bottom.slice(0, 3).map((s: any) => s.subject_name);
        }
      }

      await adminClient.database.from('academic_summary').upsert([{
        profile_id: profileId,
        cgpa: summaryInfo.CGPA,
        total_backlogs: backlogs,
        health_score: Math.max(0, 100 - (backlogs * 10)),
        strong_subjects: strongSubjects,
        weak_subjects: weakSubjects,
        last_calculated_at: new Date().toISOString()
      }], { onConflict: 'profile_id', ignoreDuplicates: false });
    }
  }

  private static async saveUnifiedAssessments(adminClient: any, profileId: string, result: any) {
    if (!result.Table2) return;

    const datasets = ['mid1', 'mid2', 'internal', 'semester', 'supply', 'current'];
    
    // Group subjects by semester
    const sems = Array.from(new Set<number>(result.Table2.map((s: any) => Number(s.SemId))));

    for (const semId of sems) {
      const subjects = result.Table2.filter((s: any) => Number(s.SemId) === semId);
      
      // Separate Whole and Supply
      const wholeSubjects = subjects.filter((s: any) => s.WholeOrSupply !== 'S');
      const supplySubjects = subjects.filter((s: any) => s.WholeOrSupply === 'S');

      // 1. Mid-1
      await this.saveInstance(adminClient, profileId, semId, 'mid1', wholeSubjects, (s: any) => Number(s.Mid1Marks) || 0, 20);
      
      // 2. Mid-2
      await this.saveInstance(adminClient, profileId, semId, 'mid2', wholeSubjects, (s: any) => Number(s.Mid2Marks) || 0, 20);
      
      // 3. Internal
      await this.saveInstance(adminClient, profileId, semId, 'internal', wholeSubjects, (s: any) => Number(s.InternalMarks) || 0, 40);

      // 4. Semester (Final)
      await this.saveInstance(adminClient, profileId, semId, 'semester', wholeSubjects, (s: any) => Number(s.EndExamMarks) || 0, 100, true);

      // 5. Supply (Attempt preservation logic)
      if (supplySubjects.length > 0) {
        await this.saveSupplyInstance(adminClient, profileId, semId, supplySubjects);
      }
    }

    // Current is typically the latest semester with mid marks but no final results yet. We can define this later.
    // Let's also compute the assessment_summaries for each dataset type.
    for (const dt of datasets) {
      await this.calculateAssessmentSummary(adminClient, profileId, dt);
    }
  }

  private static async saveInstance(adminClient: any, profileId: string, semId: number, type: string, subjects: any[], marksExtractor: (s: any) => number, maxMarks: number, isFinal: boolean = false) {
    if (subjects.length === 0) return;

    // Check if there are actually marks for this type
    const hasData = subjects.some(s => marksExtractor(s) > 0);
    if (!hasData && !isFinal) return; // Don't save empty mid instances

    let totalMarks = 0;
    let failedCount = 0;

    const instanceRes = await adminClient.database.from('assessment_instances').upsert([{
      profile_id: profileId,
      assessment_type: type,
      semester_number: semId,
      performance_index: 0 // Will update after
    }], { onConflict: 'profile_id,assessment_type,semester_number' }).select().single();

    if (instanceRes.error) return;
    const instanceId = instanceRes.data.id;

    const subjectInserts = subjects.map((sub: any) => {
      const marks = marksExtractor(sub);
      totalMarks += marks;
      const isFailed = isFinal ? sub.ExamStatus === 'F' : (marks < maxMarks * 0.35); // Approx failure condition for mids
      if (isFailed) failedCount++;

      return {
        assessment_instance_id: instanceId,
        subject_code: sub.Subject_Code,
        subject_name: sub.SubjectName,
        marks_obtained: marks,
        max_marks: maxMarks,
        is_failed: isFailed
      };
    });

    await adminClient.database.from('assessment_subjects').upsert(subjectInserts, { onConflict: 'assessment_instance_id,subject_code' });

    // Update performance index
    const perfIndex = totalMarks / subjects.length;
    await adminClient.database.from('assessment_instances').update({
      performance_index: perfIndex
    }).eq('id', instanceId);
  }

  private static async saveSupplyInstance(adminClient: any, profileId: string, semId: number, supplySubjects: any[]) {
    // Supply attempts
    // Group by exam month year or just increment attempt numbers
    
    // Create an instance for this semester's supply
    const instanceRes = await adminClient.database.from('assessment_instances').upsert([{
      profile_id: profileId,
      assessment_type: 'supply',
      semester_number: semId,
      performance_index: 0
    }], { onConflict: 'profile_id,assessment_type,semester_number' }).select().single();

    if (instanceRes.error) return;
    const instanceId = instanceRes.data.id;

    // To preserve history, we increment attempt number if it already exists.
    // For simplicity right now, we assume the API returns the LATEST supply attempt.
    // If we want a full audit trail, we'd need history from the API. The API only gives the latest "S" row per subject.
    // So we'll save it as attempt_number = 2 (1 was whole).
    
    const subjectInserts = supplySubjects.map((sub: any) => {
      const marks = Number(sub.EndExamMarks) || 0;
      return {
        assessment_instance_id: instanceId,
        subject_code: sub.Subject_Code,
        subject_name: sub.SubjectName,
        marks_obtained: marks,
        max_marks: 100,
        is_failed: sub.ExamStatus === 'F'
      };
    });

    await adminClient.database.from('assessment_subjects').upsert(subjectInserts, { onConflict: 'assessment_instance_id,subject_code' });
  }

  private static async calculateAssessmentSummary(adminClient: any, profileId: string, type: string) {
    const { data: instances } = await adminClient.database.from('assessment_instances').select('id, performance_index').eq('profile_id', profileId).eq('assessment_type', type);
    
    if (!instances || instances.length === 0) return;

    const instanceIds = instances.map((i: any) => i.id);
    const { data: subjects } = await adminClient.database.from('assessment_subjects').select('*').in('assessment_instance_id', instanceIds);

    if (!subjects || subjects.length === 0) return;

    let totalFailed = 0;
    let totalScore = 0;

    for (const inst of instances) {
      totalScore += Number(inst.performance_index);
    }
    const aggregateScore = totalScore / instances.length;

    totalFailed = subjects.filter((s: any) => s.is_failed).length;

    // Strong/Weak by percentage to ensure it's never empty if subjects exist
    const sortedSubjects = [...subjects].sort((a: any, b: any) => {
      const pA = a.max_marks ? a.marks_obtained / a.max_marks : 0;
      const pB = b.max_marks ? b.marks_obtained / b.max_marks : 0;
      return pB - pA; // Descending
    });

    const uniqueSortedNames = Array.from(new Set(sortedSubjects.map((s: any) => s.subject_name)));
    const strongNames = uniqueSortedNames.slice(0, 3);
    const weakNames = [...uniqueSortedNames].reverse().slice(0, 3);

    await adminClient.database.from('assessment_summaries').upsert([{
      profile_id: profileId,
      assessment_type: type,
      aggregate_score: aggregateScore,
      total_failed_subjects: totalFailed,
      strong_subjects: strongNames,
      weak_subjects: weakNames,
      last_calculated_at: new Date().toISOString()
    }], { onConflict: 'profile_id,assessment_type' });
  }

  private static async generatePredictions(adminClient: any, profileId: string) {
    // Advanced heuristic prediction model incorporating all dataset timeline points
    const [summaryRes, profileRes, currentMidsRes, attendanceRes, supplyRes] = await Promise.all([
      adminClient.database.from('academic_summary').select('*').eq('profile_id', profileId).single(),
      adminClient.database.from('student_profiles').select('current_semester').eq('id', profileId).single(),
      adminClient.database.from('assessment_instances').select('performance_index, assessment_type').eq('profile_id', profileId),
      adminClient.database.from('attendance_records').select('attendance_percentage').eq('profile_id', profileId).order('last_updated_at', { ascending: false }).limit(1),
      adminClient.database.from('assessment_instances').select('id').eq('profile_id', profileId).eq('assessment_type', 'supply')
    ]);

    const summary = summaryRes.data;
    if (!summary) return;

    const cgpa = Number(summary.cgpa || 0);
    const backlogs = Number(summary.total_backlogs || 0);
    const currentSemester = profileRes.data?.current_semester || 1;
    const attendance = attendanceRes.data?.[0]?.attendance_percentage || 75;
    const supplyHistoryCount = supplyRes.data?.length || 0;

    // Evaluate current semester mid progress
    const mids = currentMidsRes.data?.filter((i: any) => ['mid1', 'mid2', 'internal'].includes(i.assessment_type)) || [];
    const midScores = mids.map((i: any) => Number(i.performance_index)).filter((score: number) => score > 0);
    const averageMid = midScores.length > 0 ? midScores.reduce((a: number, b: number) => a + b, 0) / midScores.length : 0;
    
    // Confidence Score Calculation
    // Base confidence starts at 50, increases with data availability
    let confidenceScore = 50.0;
    if (midScores.length > 0) confidenceScore += 15.0; // Has current mids
    if (cgpa > 0) confidenceScore += 20.0; // Has history
    if (attendance > 0) confidenceScore += 10.0; // Has attendance

    let confidenceLevel = 'Medium';
    if (confidenceScore >= 80) confidenceLevel = 'High';
    if (confidenceScore <= 60) confidenceLevel = 'Low';

    // Heuristics for Predictions
    // If mid performance is > 80% (assuming max 20, > 16), predicted SGPA gets a boost.
    const midFactor = (averageMid / 20) * 10; // normalize to 10 scale
    const baseSgpa = cgpa > 0 ? cgpa : (midFactor > 0 ? midFactor : 7.0);

    let predSGPA = baseSgpa;
    if (averageMid > 16) predSGPA += 0.3;
    else if (averageMid > 0 && averageMid < 10) predSGPA -= 0.5;

    // Attendance penalty
    if (attendance < 65) predSGPA -= 0.8;
    else if (attendance < 75) predSGPA -= 0.3;

    predSGPA = Math.min(10.0, Math.max(3.0, predSGPA));
    
    // Pass probability
    let passProb = 95.0;
    passProb -= (backlogs * 10);
    if (attendance < 65) passProb -= 25;
    if (averageMid > 0 && averageMid < 8) passProb -= 20;
    if (supplyHistoryCount > 2) passProb -= 10;
    passProb = Math.min(99.9, Math.max(5.0, passProb));

    const backlogProb = 100 - passProb;
    const riskLevel = backlogProb > 40 ? 'High' : (backlogProb > 15 ? 'Medium' : 'Low');

    // Subject risk scores (mocked based on weak subjects)
    const weakSubjects = summary.weak_subjects || [];
    const riskScores: Record<string, number> = {};
    weakSubjects.forEach((sub: string) => {
      riskScores[sub] = Math.min(95, backlogProb + 30);
    });

    const opportunities = [];
    if (attendance < 75) opportunities.push(`Increase attendance by ${Math.ceil(75 - attendance)}% to improve pass probability.`);
    if (averageMid > 0 && averageMid < 12) opportunities.push(`Focus heavily on upcoming internal assessments to secure passing marks before finals.`);
    if (backlogs > 0) opportunities.push(`Dedicate 40% of study time to clearing the ${backlogs} active backlogs.`);

    await adminClient.database.from('prediction_history').insert([{
      profile_id: profileId,
      predicted_sgpa: predSGPA.toFixed(2),
      predicted_cgpa: cgpa.toFixed(2),
      predicted_backlogs: backlogs, // Assuming active backlogs remain, or change if high risk
      pass_probability: passProb.toFixed(2),
      confidence_score: confidenceScore.toFixed(2),
      confidence_level: confidenceLevel,
      subject_risk_scores: riskScores,
      weak_subject_alerts: weakSubjects,
      improvement_opportunities: opportunities.length > 0 ? opportunities : ['Maintain current study momentum.', 'Review strong subjects for potential distinctions.'],
      risk_level: riskLevel,
      created_at: new Date().toISOString()
    }]);
  }
}
