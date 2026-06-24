"use server";

import { createInsForgeServerClient } from "@/lib/insforge/server";
import { getStudentContext } from "./context";
import { logUsageAnalytics } from "./analytics";

export type AIProvider = 'gemini' | 'openai' | 'claude' | 'groq' | 'deepseek';

/**
 * Universal abstraction layer for AI Model Gateway.
 * Allows seamless switching between different LLM providers without rewriting business logic.
 */
export async function generateAIResponse(
  provider: AIProvider,
  model: string,
  prompt: string
): Promise<string> {
  const { adminClient } = await import("@/lib/insforge/client");
  
  try {
    // InsForge AI gateway routing
    const response = await adminClient.ai.chat.completions.create({
      // Provide the model in the format expected by the gateway
      model: `${provider}/${model}`,
      messages: [
        { role: 'system', content: 'You are DiplomaIQ, a highly intelligent, empathetic academic coach and ECET advisor for engineering diploma students in Telangana.' },
        { role: 'user', content: prompt }
      ]
    });
    
    return response.choices[0].message.content || "No response generated.";
  } catch (error: any) {
    console.error(`AI Gateway Error (${provider}):`, error);
    // Return a mock response in case the InsForge AI gateway isn't configured in the project yet
    return `[Fallback Mode: AI Gateway not fully configured for ${provider}]\n\nBased on your profile, here is some general advice:\n1. Focus heavily on your weak subjects.\n2. Maintain your attendance above 75% to be safe for exams.\n3. Keep up the good work on your strong subjects.`;
  }
}

// ==========================================
// AI Coach Specific Logic
// ==========================================

export async function getPersonalizedCoachAdvice(datasetType: string = 'semester') {
  const context = await getStudentContext(datasetType as any);
  if (!context) return "We need more academic data to provide personalized coaching. Please sync your results first.";

  const { profile, dataset, attendance, derivedMetrics, prediction } = context;
  const attendanceStr = attendance ? `${attendance.percentage || attendance.attendance_percentage}%` : "Unknown";
  
  const predictionStr = prediction ? `\n- Predicted Final SGPA: ${prediction.predicted_sgpa}\n- Backlog Risk: ${prediction.predicted_backlogs}\n- Risk Level: ${prediction.risk_level}` : "";

  const prompt = `
Generate a personalized academic coaching strategy for this student.

STUDENT CONTEXT (Dataset: ${dataset.type}):
- Current Semester: ${profile.current_semester}
- Branch: ${profile.branch}
- ${dataset.labels.aggregate}: ${dataset.summary.aggregateScore}
- Average ${dataset.labels.period}: ${derivedMetrics.averageScore}
- Consistency Score: ${derivedMetrics.consistencyScore}/100
- Active/Failed Subjects: ${dataset.summary.totalFailedSubjects}
- Attendance: ${attendanceStr}
- Strong Subjects: ${dataset.summary.strongSubjects?.join(", ") || "None"}
- Weak Subjects: ${dataset.summary.weakSubjects?.join(", ") || "None"}
${predictionStr}

You MUST return your response in the exact markdown structure below:

### Summary
[Brief encouraging summary of their academic standing]

### Strengths
[Analysis of their strong subjects and what they are doing right]

### Weaknesses
[Analysis of weak subjects or areas dragging them down]

### Risks
[Analysis of backlogs, low attendance, or falling consistency]

### Recommendations
[2-3 broad strategic recommendations]

### Action Items
[Generate exactly 3 to 5 actionable items. For each item, use exactly this format:]
Priority: [Critical | High | Medium | Low]
Action: [The action to take]
Reason: [Why this action is needed based on their data]
Expected Outcome: [What will happen if they do this]
Time Estimate: [How much time it will take]
  `;

  await logUsageAnalytics('ai_coach_use', 'AI Coach', { cgpa: dataset.summary.aggregateScore, backlogs: dataset.summary.totalFailedSubjects });

  return await generateAIResponse('openai', 'gpt-4o', prompt);
}

export async function generateActionItems(datasetType: string = 'semester') {
  const context = await getStudentContext(datasetType as any);
  if (!context) return null;

  const { profile, dataset, attendance, prediction } = context;
  const attendanceStr = attendance ? `${attendance.percentage || attendance.attendance_percentage}%` : "Unknown";

  const predictionStr = prediction ? `\nPredicted Final SGPA: ${prediction.predicted_sgpa}, Predicted Backlogs: ${prediction.predicted_backlogs}` : "";

  const prompt = `
You are an AI generating structured action items for an engineering student.

CONTEXT (Dataset: ${dataset.type}):
Branch: ${profile.branch}, Semester: ${profile.current_semester}
${dataset.labels.aggregate}: ${dataset.summary.aggregateScore}, Failed Subjects: ${dataset.summary.totalFailedSubjects}
Attendance: ${attendanceStr}
Weak Subjects: ${dataset.summary.weakSubjects?.join(", ") || "None"}
${predictionStr}

Generate the top 5 most important action items for this student. 
Return ONLY a valid JSON array of objects, with no markdown code blocks or extra text.
Format:
[
  {
    "priority": "Critical" | "High" | "Medium" | "Low",
    "action": "Brief action title",
    "reason": "Why they need to do this",
    "estimated_impact": "e.g. +0.5 SGPA or Cleared Backlog"
  }
]
  `;

  try {
    const response = await generateAIResponse('openai', 'gpt-4o-mini', prompt);
    // Strip markdown JSON wrappers if present
    const cleanJson = response.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    return JSON.parse(cleanJson);
  } catch (err) {
    console.error("Failed to generate action items JSON", err);
    return [];
  }
}

export async function generateAcademicReport(datasetType: string = 'semester') {
  const context = await getStudentContext(datasetType as any);
  if (!context) return "No data available to generate report.";

  const { profile, dataset, attendance, derivedMetrics, prediction } = context;
  const attendanceStr = attendance ? `${attendance.percentage || attendance.attendance_percentage}%` : "Unknown";
  
  const predictionStr = prediction ? `\nPredicted Final SGPA: ${prediction.predicted_sgpa}, Predicted Backlogs: ${prediction.predicted_backlogs}` : "";

  const prompt = `
Generate a comprehensive Academic Report for this student.

CONTEXT (Dataset: ${dataset.type}):
Branch: ${profile.branch}, Semester: ${profile.current_semester}
${dataset.labels.aggregate}: ${dataset.summary.aggregateScore}, Best ${dataset.labels.period}: ${derivedMetrics.bestPeriod}, Average ${dataset.labels.period}: ${derivedMetrics.averageScore}
Consistency Score: ${derivedMetrics.consistencyScore}/100
Active/Failed Subjects: ${dataset.summary.totalFailedSubjects}
Attendance: ${attendanceStr}
Strong Subjects: ${dataset.summary.strongSubjects?.join(", ") || "None"}
Weak Subjects: ${dataset.summary.weakSubjects?.join(", ") || "None"}
${predictionStr}

You MUST include the following 11 sections in markdown format (use exactly these H2 headers):
## 1. Academic Overview
## 2. CGPA Analysis
## 3. Attendance Analysis
## 4. Semester Trend Analysis
## 5. Subject Performance
## 6. Strengths
## 7. Weaknesses
## 8. Risk Factors
## 9. Career Readiness
## 10. ECET Readiness
## 11. Recommended Actions
  `;

  await logUsageAnalytics('academic_report_gen', 'Academic Report', { current_semester: profile.current_semester });

  return await generateAIResponse('openai', 'gpt-4o', prompt);
}

// ==========================================
// AI Study Planner Specific Logic
// ==========================================

export async function generateStudyPlan(planType: 'daily' | 'weekly' | 'exam', datasetType: string = 'semester') {
  const context = await getStudentContext(datasetType as any);
  if (!context) return "Please sync your academic records to generate a study plan.";

  const { profile, dataset, attendance, prediction } = context;
  const attendanceStr = attendance ? `${attendance.percentage || attendance.attendance_percentage}%` : "Unknown";

  const predictionStr = prediction ? `\nPredicted Final SGPA: ${prediction.predicted_sgpa}, Predicted Backlogs: ${prediction.predicted_backlogs}` : "";

  const prompt = `
Generate a highly structured ${planType} study plan for an engineering diploma student.

CONTEXT (Dataset: ${dataset.type}):
Branch: ${profile.branch}, Semester: ${profile.current_semester}
${dataset.labels.aggregate}: ${dataset.summary.aggregateScore}, Failed Subjects: ${dataset.summary.totalFailedSubjects}
Attendance: ${attendanceStr}
Weak Subjects (Need immediate attention): ${dataset.summary.weakSubjects?.join(", ") || "None"}
Strong Subjects (Maintenance only): ${dataset.summary.strongSubjects?.join(", ") || "None"}
${predictionStr}

Requirements for the ${planType} plan:
- Adapt the intensity based on their CGPA and backlogs (high backlogs require intensive recovery, high CGPA requires optimization).
- Use bullet points and time blocks (if daily) or day blocks (if weekly).
- Prioritize weak subjects heavily.
- Allocate time for short breaks.
- Keep it realistic for a student who also attends classes.
  `;

  await logUsageAnalytics('study_plan_gen', 'Study Planner', { planType });

  return await generateAIResponse('openai', 'gpt-4o', prompt);
}
