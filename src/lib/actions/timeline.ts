"use server";

import { createInsForgeServerClient } from "@/lib/insforge/server";

export interface TimelineEvent {
  id: string;
  type: 'semester' | 'mid1' | 'mid2' | 'internal' | 'supply' | 'current';
  semesterNumber: number;
  title: string;
  description: string;
  date: string;
  score: number | null;
  status: 'passed' | 'failed' | 'pending';
}

export async function generateUnifiedTimeline(): Promise<TimelineEvent[]> {
  const { auth } = await createInsForgeServerClient();
  const { data: authData } = await auth.getCurrentUser();
  if (!authData?.user) return [];
  const profileId = authData.user.id;

  const { adminClient } = await import("@/lib/insforge/client");

  // Fetch all instances
  const { data: instances } = await adminClient.database
    .from('assessment_instances')
    .select('*')
    .eq('profile_id', profileId);

  if (!instances) return [];

  const timeline: TimelineEvent[] = [];

  for (const inst of instances) {
    const type = inst.assessment_type as 'semester' | 'mid1' | 'mid2' | 'internal' | 'supply' | 'current';
    let title = "";
    
    switch (type) {
      case 'mid1': title = `Mid-1 Exams (Sem ${inst.semester_number})`; break;
      case 'mid2': title = `Mid-2 Exams (Sem ${inst.semester_number})`; break;
      case 'internal': title = `Internal Assessments (Sem ${inst.semester_number})`; break;
      case 'semester': title = `Final Results (Sem ${inst.semester_number})`; break;
      case 'supply': title = `Supply Attempt (Sem ${inst.semester_number})`; break;
      case 'current': title = `Current Progress (Sem ${inst.semester_number})`; break;
    }

    // Determine status based on assessment subjects
    const { data: subs } = await adminClient.database
      .from('assessment_subjects')
      .select('is_failed')
      .eq('assessment_instance_id', inst.id);
      
    const isFailed = subs?.some((s: any) => s.is_failed);
    
    timeline.push({
      id: inst.id,
      type,
      semesterNumber: inst.semester_number,
      title,
      description: `Performance Index: ${inst.performance_index}`,
      date: new Date(inst.created_at).toLocaleDateString(),
      score: inst.performance_index,
      status: isFailed ? 'failed' : 'passed'
    });
  }

  // Sort by semester number, then by logical chronological order (mid1 -> mid2 -> internal -> semester -> supply)
  const orderMap: Record<string, number> = {
    'mid1': 1,
    'mid2': 2,
    'internal': 3,
    'semester': 4,
    'supply': 5,
    'current': 6
  };

  timeline.sort((a, b) => {
    if (a.semesterNumber !== b.semesterNumber) {
      return a.semesterNumber - b.semesterNumber;
    }
    return orderMap[a.type] - orderMap[b.type];
  });

  return timeline;
}
