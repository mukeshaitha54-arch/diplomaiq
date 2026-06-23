"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentContext } from "@/lib/actions/context";
import { Target } from "lucide-react";

export function GoalTracker({ context }: { context: StudentContext }) {
  const cgpa = context.academicSummary?.cgpa || 0;
  const target = Math.min(10, Math.ceil(cgpa));
  
  // If exactly an integer, next target is integer + 1
  const finalTarget = (cgpa === target && target < 10) ? target + 1 : target;
  
  const percentage = cgpa > 0 ? (cgpa / finalTarget) * 100 : 0;

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-400">Goal Tracker</CardTitle>
        <Target className="h-4 w-4 text-teal-400" />
      </CardHeader>
      <CardContent>
        <p className="text-xs text-slate-400 mb-2">Target CGPA: <span className="text-white font-medium">{finalTarget.toFixed(1)}</span></p>
        <div className="flex items-end justify-between mb-1">
          <span className="text-sm font-medium text-white">{cgpa}</span>
          <span className="text-xs text-slate-500">{percentage.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1.5">
          <div className="bg-teal-400 h-1.5 rounded-full" style={{ width: `${percentage}%` }}></div>
        </div>
      </CardContent>
    </Card>
  );
}
