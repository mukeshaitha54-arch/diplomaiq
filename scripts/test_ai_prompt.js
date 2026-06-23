import { createAdminClient } from '@insforge/sdk';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const insforgeUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
const insforgeApiKey = process.env.INSFORGE_API_KEY || process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;
const adminClient = createAdminClient({
  baseUrl: insforgeUrl,
  apiKey: insforgeApiKey,
});

async function testPrompt() {
  console.log("=== Testing AI Prompt Generation with Real Data ===");
  // Fetch first user
  const { data: users } = await adminClient.database.from('student_profiles').select('id').limit(1);
  const testUserId = users?.[0]?.id;
  
  if (!testUserId) {
    console.log("No users found.");
    return;
  }
  
  const { data: summary } = await adminClient.database
    .from('academic_summary')
    .select('*')
    .eq('profile_id', testUserId)
    .single();

  const { data: profile } = await adminClient.database
    .from('student_profiles')
    .select('current_semester, branch')
    .eq('id', testUserId)
    .single();

  const { data: attendance } = await adminClient.database
    .from('attendance_records')
    .select('percentage')
    .eq('profile_id', testUserId)
    .order('last_updated_at', { ascending: false })
    .limit(1);

  if (!summary || !profile) {
    console.log("User missing academic data.");
    return;
  }

  const attendanceStr = attendance && attendance.length > 0 ? `${attendance[0].percentage}%` : "Unknown";

  const prompt = `
Generate a personalized study strategy and recovery plan for this student.

Context:
- Current Semester: ${profile.current_semester}
- Branch: ${profile.branch}
- Current CGPA: ${summary.cgpa}
- Active Backlogs: ${summary.total_backlogs}
- Attendance: ${attendanceStr}
- Strong Subjects: ${summary.strong_subjects?.join(", ") || "None"}
- Weak Subjects: ${summary.weak_subjects?.join(", ") || "None"}

Please provide:
1. Personalized Study Strategy
2. Weak Subject Recovery Plan (if they have weak subjects or backlogs)
3. Attendance Improvement Plan (if below 75%)
4. Early ECET Preparation Guidance

Format as clean markdown with clear headings. Be encouraging but realistic.
  `;

  console.log("\n[GENERATED PROMPT FOR AI COACH]:\n");
  console.log(prompt);
  
  console.log("\nCalling AI Gateway to test generation...");
  try {
    const response = await adminClient.ai.chat.completions.create({
      model: `openai/gpt-4o-mini`, // testing with a fast model
      messages: [
        { role: 'system', content: 'You are DiplomaIQ, a highly intelligent academic coach.' },
        { role: 'user', content: prompt }
      ]
    });
    console.log("\n[AI RESPONSE PREVIEW]:\n");
    console.log(response.choices[0].message.content.substring(0, 300) + "...\n(truncated for brevity)");
  } catch (err) {
    console.log("AI Gateway error (possibly unconfigured API keys on InsForge backend):", err.message);
  }
}

testPrompt().catch(console.error);
