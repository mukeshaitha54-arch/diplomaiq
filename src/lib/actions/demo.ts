"use server";

import { createInsForgeServerClient } from "@/lib/insforge/server";
import { logUsageAnalytics } from "./analytics";

export async function loginAsDemo() {
  const { auth } = await createInsForgeServerClient();
  
  // We'll use a static demo account password.
  // In a real environment, this user would be created via InsForge Auth beforehand.
  const email = "demo@diplomaiq.com";
  const password = "DemoPassword123!"; // This must be manually created in the auth dashboard or seeded

  const { data, error } = await auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error("Demo login failed:", error);
    return { error: error.message };
  }

  // Ensure demo data is seeded for this user ID
  if (data?.user?.id) {
    await seedDemoData(data.user.id);
    await logUsageAnalytics('demo_login', 'Demo Mode', { demo_dataset_version: 'v1' });
  }

  return { success: true };
}

async function seedDemoData(userId: string) {
  const { adminClient } = await import("@/lib/insforge/client");

  // Upsert profile
  await adminClient.database.from('student_profiles').upsert({
    id: userId,
    full_name: 'Demo Student',
    branch: 'CSE',
    current_semester: 5,
    metadata: { demo_dataset_version: 'v1' }
  });

  // Upsert Academic Summary
  await adminClient.database.from('academic_summary').upsert({
    profile_id: userId,
    cgpa: 8.75,
    total_backlogs: 0,
    strong_subjects: ['Data Structures', 'Database Management Systems', 'Java Programming'],
    weak_subjects: ['Engineering Mathematics', 'Computer Organization'],
    last_calculated_at: new Date().toISOString()
  });

  // Upsert Semesters
  const semesters = [
    { profile_id: userId, semester_code: 'SEM1', sgpa: 8.2, backlogs: 0 },
    { profile_id: userId, semester_code: 'SEM2', sgpa: 8.4, backlogs: 0 },
    { profile_id: userId, semester_code: 'SEM3', sgpa: 8.9, backlogs: 0 },
    { profile_id: userId, semester_code: 'SEM4', sgpa: 9.1, backlogs: 0 }
  ];
  
  for (const sem of semesters) {
    await adminClient.database.from('semesters').upsert(sem, { onConflict: 'profile_id, semester_code' });
  }

  // Upsert Attendance
  await adminClient.database.from('attendance_records').upsert({
    profile_id: userId,
    percentage: 88.5,
    last_updated_at: new Date().toISOString()
  });
}
