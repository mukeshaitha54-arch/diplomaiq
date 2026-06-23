"use server";

import { createInsForgeServerClient } from "@/lib/insforge/server";

export async function logUsageAnalytics(actionType: string, featureName: string, metadata: any = {}) {
  try {
    const { auth } = await createInsForgeServerClient();
    const { data: authData } = await auth.getCurrentUser();
    if (!authData?.user) return false;

    const { adminClient } = await import("@/lib/insforge/client");

    const { error } = await adminClient.database
      .from('usage_analytics')
      .insert([
        {
          profile_id: authData.user.id,
          action_type: actionType,
          feature_name: featureName,
          metadata: metadata
        }
      ]);

    if (error) {
      console.error("Failed to log usage analytics:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Exception in logUsageAnalytics:", err);
    return false;
  }
}

export async function logClientUsage(actionType: string, featureName: string) {
  return await logUsageAnalytics(actionType, featureName);
}
