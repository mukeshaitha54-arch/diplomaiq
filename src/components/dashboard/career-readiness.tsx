"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentContext } from "@/lib/actions/context";
import { Briefcase } from "lucide-react";

export function CareerReadiness({ context }: { context: StudentContext }) {
  const cgpa = context.academicSummary?.cgpa || 0;
  const backlogs = context.academicSummary?.total_backlogs || 0;
  const strongSubjects = context.academicSummary?.strong_subjects?.length || 0;
  const attendance = context.attendance ? (context.attendance.percentage || context.attendance.attendance_percentage || 0) : 0;

  // Algorithm: Base 40 + CGPA(up to 30) + Backlogs(up to 15) + Strong(up to 10) + Attnd(up to 5)
  let score = 40;
  score += Math.min(30, (cgpa / 10) * 30);
  score += Math.max(0, 15 - (backlogs * 5));
  score += Math.min(10, strongSubjects * 3);
  score += Math.min(5, (attendance / 100) * 5);

  score = Math.round(Math.min(100, score));

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-400">Career Readiness</CardTitle>
        <Briefcase className="h-4 w-4 text-indigo-400" />
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold text-white">{score}</span>
          <span className="text-sm text-slate-500 mb-1">/ 100</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3">
          <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${score}%` }}></div>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          {score >= 80 ? "Highly competitive profile" : score >= 60 ? "On track for placements" : "Needs technical improvement"}
        </p>
      </CardContent>
    </Card>
  );
}
