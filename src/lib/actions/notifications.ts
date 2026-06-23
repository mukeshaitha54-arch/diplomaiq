"use server";

import { createInsForgeServerClient } from "@/lib/insforge/server";
import { StudentContext } from "./context";

export interface Notification {
  id: string;
  profile_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  is_read: boolean;
  created_at: string;
}

export async function getNotifications(): Promise<Notification[]> {
  try {
    const { auth } = await createInsForgeServerClient();
    const { data: authData } = await auth.getCurrentUser();
    if (!authData?.user) return [];

    const { adminClient } = await import("@/lib/insforge/client");
    const { data, error } = await adminClient.database
      .from('notifications')
      .select('*')
      .eq('profile_id', authData.user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error || !data) return [];
    return data as Notification[];
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
}

export async function markAsRead(notificationId: string): Promise<boolean> {
  try {
    const { auth } = await createInsForgeServerClient();
    const { data: authData } = await auth.getCurrentUser();
    if (!authData?.user) return false;

    const { adminClient } = await import("@/lib/insforge/client");
    const { error } = await adminClient.database
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('profile_id', authData.user.id);

    return !error;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return false;
  }
}

export async function generateSystemNotifications(context: StudentContext) {
  try {
    if (!context || !context.profile) return;
    
    const { auth } = await createInsForgeServerClient();
    const { data: authData } = await auth.getCurrentUser();
    if (!authData?.user) return;
    
    const { adminClient } = await import("@/lib/insforge/client");
    
    const userId = authData.user.id;
    const { data: recentNotifs } = await adminClient.database
      .from('notifications')
      .select('*')
      .eq('profile_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
      
    const recentTitles = new Set((recentNotifs || []).map((n: any) => n.title));
    const newNotifications = [];

    // 1. Attendance Warning
    const attnd = context.attendance ? (context.attendance.percentage || context.attendance.attendance_percentage || 0) : 100;
    if (attnd < 75 && !recentTitles.has("Critical Attendance Alert")) {
      newNotifications.push({
        profile_id: userId,
        title: "Critical Attendance Alert",
        message: `Your attendance is currently ${attnd}%. You must maintain 75% to be eligible for exams.`,
        type: 'warning'
      });
    }

    // 2. Zero Backlogs Achievement
    const backlogs = context.dataset.summary.totalFailedSubjects || 0;
    if (backlogs === 0 && context.semesters.length > 0 && !recentTitles.has("Flawless Record Achieved!")) {
      newNotifications.push({
        profile_id: userId,
        title: "Flawless Record Achieved!",
        message: `Congratulations on maintaining 0 active/failed subjects in your ${context.dataset.labels.aggregate} data. Keep up the excellent work!`,
        type: 'success'
      });
    }

    // 3. Mid Risk Alerts / Prediction Warnings
    if (context.prediction) {
      if (context.prediction.risk_level === 'HIGH' && !recentTitles.has("High Risk Assessment")) {
        newNotifications.push({
          profile_id: userId,
          title: "High Risk Assessment",
          message: `Your ${context.prediction.based_on_assessment} results indicate a HIGH risk for final exams. Predicted ${context.prediction.predicted_backlogs} backlogs.`,
          type: 'warning'
        });
      }
      
      if (context.prediction.predicted_backlogs > 0 && context.prediction.risk_level !== 'HIGH' && !recentTitles.has("Predicted Backlog Warning")) {
         newNotifications.push({
          profile_id: userId,
          title: "Predicted Backlog Warning",
          message: `Based on your recent performance, you are at risk of ${context.prediction.predicted_backlogs} backlogs. Take action now.`,
          type: 'warning'
        });
      }
    }

    // 4. Performance Drop Warning
    const currentScore = context.dataset.summary.aggregateScore;
    const avgScore = context.derivedMetrics.averageScore;
    // Score drop threshold: 15% drop compared to average
    if (currentScore > 0 && avgScore > 0 && currentScore < (avgScore * 0.85) && !recentTitles.has("Significant Performance Drop")) {
       newNotifications.push({
        profile_id: userId,
        title: "Significant Performance Drop",
        message: `Your current ${context.dataset.labels.aggregate} (${currentScore}) is significantly lower than your historical average (${avgScore}). Please review your weak subjects.`,
        type: 'warning'
      });
    }

    // Insert all
    if (newNotifications.length > 0) {
      await adminClient.database.from('notifications').insert(newNotifications);
    }
  } catch (err) {
    console.error("Failed to generate system notifications:", err);
  }
}
