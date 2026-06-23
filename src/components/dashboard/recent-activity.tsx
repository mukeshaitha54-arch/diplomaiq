"use server";

import { createInsForgeServerClient } from "@/lib/insforge/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Clock } from "lucide-react";

export async function RecentActivityFeed() {
  const { auth } = await createInsForgeServerClient();
  const { data: authData } = await auth.getCurrentUser();
  if (!authData?.user) return null;

  const { adminClient } = await import("@/lib/insforge/client");

  const { data: logs } = await adminClient.database
    .from('usage_analytics')
    .select('*')
    .eq('profile_id', authData.user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  if (!logs || logs.length === 0) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-slate-400">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-500">No recent activity.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-slate-400">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {logs.map((log: any) => (
            <div key={log.id} className="flex items-start gap-3">
              <div className="mt-0.5 bg-slate-800 p-1.5 rounded-full">
                <Activity className="h-3 w-3 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm text-slate-300">{log.feature_name}</p>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500">
                  <Clock className="h-3 w-3" />
                  {new Date(log.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
