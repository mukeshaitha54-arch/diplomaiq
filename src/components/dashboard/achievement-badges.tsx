"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Zap, BookOpen, Star, ShieldCheck } from "lucide-react";
import { StudentContext } from "@/lib/actions/context";

export function AchievementBadges({ context }: { context: StudentContext }) {
  const cgpa = context.academicSummary?.cgpa || 0;
  const backlogs = context.academicSummary?.total_backlogs || 0;
  const attnd = context.attendance ? (context.attendance.percentage || context.attendance.attendance_percentage || 0) : 0;
  
  const badges = [];

  if (cgpa >= 9.5) {
    badges.push({ name: "Perfect 10", desc: "CGPA 9.5+", icon: Star, color: "text-yellow-400", bg: "bg-yellow-400/10" });
  } else if (cgpa >= 9.0) {
    badges.push({ name: "Top Scholar", desc: "CGPA 9.0+", icon: Award, color: "text-purple-400", bg: "bg-purple-400/10" });
  }

  if (backlogs === 0 && context.semesters.length > 0) {
    badges.push({ name: "Clear Record", desc: "Zero Backlogs", icon: ShieldCheck, color: "text-emerald-400", bg: "bg-emerald-400/10" });
  }

  if (attnd >= 90) {
    badges.push({ name: "Always Present", desc: "90%+ Attendance", icon: Zap, color: "text-blue-400", bg: "bg-blue-400/10" });
  }

  if (context.academicSummary?.strong_subjects?.length >= 3) {
    badges.push({ name: "Subject Master", desc: "3+ Strong Subjects", icon: BookOpen, color: "text-teal-400", bg: "bg-teal-400/10" });
  }

  if (badges.length === 0) {
    return null;
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-slate-400">Achievements</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {badges.map((badge, idx) => (
            <div key={idx} className={`flex flex-col items-center justify-center p-3 rounded-lg border border-slate-800 ${badge.bg} min-w-[100px]`}>
              <badge.icon className={`h-6 w-6 ${badge.color} mb-2`} />
              <span className="text-xs font-bold text-white text-center">{badge.name}</span>
              <span className="text-[10px] text-slate-400 text-center">{badge.desc}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
