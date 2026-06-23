"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle, CalendarDays, CheckCircle2, AlertCircle } from "lucide-react";

interface AttendanceIntelligenceProps {
  latestRecord: {
    total_working_days?: number;
    days_present?: number;
    attendance_percentage?: number;
    percentage?: number;
  };
}

export function AttendanceIntelligence({ latestRecord }: AttendanceIntelligenceProps) {
  if (!latestRecord || (!latestRecord.total_working_days && !latestRecord.days_present)) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Attendance Intelligence</CardTitle>
          <CardDescription className="text-slate-400">Forecast and Recommendations</CardDescription>
        </CardHeader>
        <CardContent className="flex h-40 items-center justify-center text-slate-500">
          Insufficient data to calculate attendance forecast.
        </CardContent>
      </Card>
    );
  }

  const T = latestRecord.total_working_days || 0;
  const P = latestRecord.days_present || 0;
  const currentPercentage = latestRecord.attendance_percentage || latestRecord.percentage || (T > 0 ? (P / T) * 100 : 0);

  // Target is 75%
  const targetPercentage = 75;

  // Days needed to reach 75%: 
  // (P + X) / (T + X) = 0.75 => X = 3T - 4P
  const rawDaysNeeded = 3 * T - 4 * P;
  const daysNeeded = Math.max(0, Math.ceil(rawDaysNeeded));

  // Safe miss days (if currently above 75%):
  // P / (T + M) = 0.75 => M = (4P - 3T) / 3
  const rawSafeMiss = (4 * P - 3 * T) / 3;
  const safeMissDays = Math.max(0, Math.floor(rawSafeMiss));

  let category = "Critical";
  let rec = "Your attendance is critically low. You must attend immediately to avoid severe penalities.";
  
  if (currentPercentage >= 90) {
    category = "Excellent";
    rec = "Your attendance is excellent. You have a comfortable buffer for any unexpected absences.";
  } else if (currentPercentage >= 80) {
    category = "Good";
    rec = "Your attendance is in good standing. Maintain this consistency.";
  } else if (currentPercentage >= 75) {
    category = "Safe";
    rec = "You are currently safe, but very close to the limit. Be cautious about missing days.";
  } else if (currentPercentage >= 65) {
    category = "Warning";
    rec = "You are below the required 75%. Prioritize attending all upcoming classes.";
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Attendance Intelligence</CardTitle>
            <CardDescription className="text-slate-400">Forecast and AI Recommendations</CardDescription>
          </div>
          <Badge variant="outline" className={
            category === 'Excellent' ? 'text-emerald-400 border-emerald-900' :
            category === 'Good' ? 'text-teal-400 border-teal-900' :
            category === 'Safe' ? 'text-amber-400 border-amber-900' :
            category === 'Warning' ? 'text-orange-400 border-orange-900' :
            'text-rose-400 border-rose-900'
          }>
            {category} Status
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-md border border-slate-800 bg-slate-950 p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Activity className="h-4 w-4" />
              <span className="text-xs font-medium">Current</span>
            </div>
            <div className="text-2xl font-bold text-white">{currentPercentage.toFixed(1)}%</div>
          </div>
          
          <div className="rounded-md border border-slate-800 bg-slate-950 p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-medium">Target</span>
            </div>
            <div className="text-2xl font-bold text-white">75%</div>
          </div>

          <div className="rounded-md border border-slate-800 bg-slate-950 p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-medium">Days Needed</span>
            </div>
            <div className="text-2xl font-bold text-rose-400">{daysNeeded}</div>
          </div>

          <div className="rounded-md border border-slate-800 bg-slate-950 p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <CalendarDays className="h-4 w-4" />
              <span className="text-xs font-medium">Safe Miss Days</span>
            </div>
            <div className="text-2xl font-bold text-teal-400">{safeMissDays}</div>
          </div>
        </div>

        <div className="rounded-md border border-slate-800 bg-slate-950/50 p-4">
          <div className="flex gap-3">
            <AlertCircle className={
              category === 'Excellent' || category === 'Good' ? 'text-teal-400 mt-0.5' :
              category === 'Safe' ? 'text-amber-400 mt-0.5' : 'text-rose-400 mt-0.5'
            } />
            <div>
              <h4 className="text-sm font-medium text-slate-200">Recommendation</h4>
              <p className="text-sm text-slate-400 mt-1">{rec}</p>
              {daysNeeded > 0 && (
                <p className="text-sm text-rose-400 mt-2 font-medium">
                  Estimated Recovery Time: You must attend {daysNeeded} consecutive days without a single absence to cross the 75% threshold.
                </p>
              )}
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
