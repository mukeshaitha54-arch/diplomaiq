"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentContext } from "@/lib/actions/context";
import { Database, CheckCircle2, AlertTriangle } from "lucide-react";

export function SyncHealthCard({ context }: { context: StudentContext }) {
  const lastSynced = context.profile?.last_synced_at 
    ? new Date(context.profile.last_synced_at) 
    : null;

  // If last synced > 7 days ago, warn
  const isHealthy = lastSynced && (new Date().getTime() - lastSynced.getTime() < 7 * 24 * 60 * 60 * 1000);

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-400">Data Synchronization</CardTitle>
        <Database className="h-4 w-4 text-slate-500" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mt-2">
          {isHealthy ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-400" />
          )}
          <div>
            <p className="text-sm font-medium text-white">
              {isHealthy ? "System Healthy" : "Sync Recommended"}
            </p>
            <p className="text-xs text-slate-400">
              {lastSynced ? `Last updated: ${lastSynced.toLocaleDateString()}` : "Never synced"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
