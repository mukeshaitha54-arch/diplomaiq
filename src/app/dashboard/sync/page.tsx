'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { syncAttendanceAction, syncAcademicDataAction } from "@/lib/actions/sbtet";
import { Loader2, RefreshCcw, CheckCircle, AlertTriangle } from "lucide-react";
import { insforge } from "@/lib/insforge/browser";

export default function SyncPage() {
  const router = useRouter();
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Results Sync State
  const [resultsStatus, setResultsStatus] = useState<"idle" | "syncing" | "success" | "failed">("idle");
  const [resultsError, setResultsError] = useState<string | null>(null);
  
  // Attendance Sync State
  const [attStatus, setAttStatus] = useState<"idle" | "syncing" | "success" | "failed">("idle");
  const [attError, setAttError] = useState<string | null>(null);

  // 1. Multi-Semester Results Sync
  const handleSyncResults = async () => {
    setResultsStatus("syncing");
    setResultsError(null);
    
    const res = await syncAcademicDataAction();
    
    if (res.success) {
      setResultsStatus("success");
    } else {
      setResultsError(res.error || "Could not sync any results. Is the PIN correct?");
      setResultsStatus("failed");
    }
  };

  // 2. Attendance Sync Flow
  const handleStartAttendanceSync = async () => {
    setAttStatus("syncing");
    setAttError(null);
    
    const res = await syncAttendanceAction();
    if (res.success) {
      setAttStatus("success");
    } else {
      setAttError(res.error || "Failed to fetch attendance");
      setAttStatus("failed");
    }
  };

  if (!mounted) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight font-heading text-white">Data Synchronization</h2>
        <p className="text-slate-400">Pull your latest academic records from Telangana SBTET.</p>
      </div>

      <div className="grid gap-6">
        
        {/* Results Sync Card */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Academic Results Sync</CardTitle>
            <CardDescription className="text-slate-400">
              Fetch all completed semesters via direct API.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {resultsError && <div className="p-3 bg-red-900/50 text-red-200 border border-red-800 rounded-md text-sm">{resultsError}</div>}
            
            {resultsStatus === "syncing" && (
              <div className="flex flex-col items-center justify-center py-6">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
                <p className="text-slate-400">Fetching Academic Records...</p>
              </div>
            )}
            
            {resultsStatus === "success" && (
              <div className="flex items-center gap-2 text-emerald-400 p-3 bg-emerald-950/30 rounded-lg border border-emerald-900/50">
                <CheckCircle className="w-5 h-5" />
                <span>All available semesters synced successfully.</span>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleSyncResults} 
              disabled={resultsStatus === "syncing"}
              className="bg-indigo-600 hover:bg-indigo-700 text-white w-full"
            >
              {resultsStatus === "syncing" ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Syncing...</> : "Sync All Semesters"}
            </Button>
          </CardFooter>
        </Card>

        {/* Attendance Sync Card */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Attendance Sync</CardTitle>
            <CardDescription className="text-slate-400">
              Direct API attendance retrieval.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {attError && <div className="p-3 bg-red-900/50 text-red-200 border border-red-800 rounded-md text-sm">{attError}</div>}
            
            {(attStatus === "idle" || attStatus === "failed") && (
              <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                <p>Click below to securely fetch attendance records.</p>
              </div>
            )}
            
            {attStatus === "syncing" && (
              <div className="flex flex-col items-center justify-center py-6">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
                <p className="text-slate-400">Fetching Attendance...</p>
              </div>
            )}
            
            {attStatus === "success" && (
              <div className="flex items-center gap-2 text-emerald-400 p-3 bg-emerald-950/30 rounded-lg border border-emerald-900/50">
                <CheckCircle className="w-5 h-5" />
                <span>Attendance synced successfully!</span>
              </div>
            )}

          </CardContent>
          <CardFooter className="flex gap-4">
            <Button onClick={handleStartAttendanceSync} disabled={attStatus === "syncing"} className="bg-indigo-600 hover:bg-indigo-700 text-white w-full">
              {attStatus === "syncing" ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Syncing...</> : "Sync Attendance"}
            </Button>
          </CardFooter>
        </Card>

      </div>
    </div>
  );
}
