"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentContext } from "@/lib/actions/context";
import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

export function WeeklyFocus({ context }: { context: StudentContext }) {
  const weakSubjects = context.academicSummary?.weak_subjects || [];
  const backlogs = context.academicSummary?.total_backlogs || 0;

  let focusTitle = "Maintain Consistency";
  let focusMessage = "You have no immediate weak subjects. Focus on maintaining your current SGPA trend and preparing for upcoming internals.";
  let actionText = "View Analytics";
  let actionLink = "/dashboard/analytics";

  if (backlogs > 0) {
    focusTitle = "Clear Backlogs";
    focusMessage = `You have ${backlogs} active backlogs. Your primary focus this week should be gathering syllabus and previous papers for these subjects.`;
    actionText = "Open Study Planner";
    actionLink = "/dashboard/coach";
  } else if (weakSubjects.length > 0) {
    focusTitle = `Improve ${weakSubjects[0]}`;
    focusMessage = `Your marks in ${weakSubjects[0]} are below your average. Spend 3 extra hours this week revising core concepts.`;
    actionText = "Get AI Strategy";
    actionLink = "/dashboard/coach";
  }

  return (
    <Card className="bg-indigo-950/30 border-indigo-900/50">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          <CardTitle className="text-sm font-medium text-indigo-200">AI Weekly Focus</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <h4 className="text-base font-semibold text-white mb-1">{focusTitle}</h4>
        <p className="text-sm text-indigo-200/70 mb-4 leading-relaxed">
          {focusMessage}
        </p>
        <Link 
          href={actionLink}
          className="inline-flex items-center text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          {actionText} <ArrowRight className="ml-1 h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  );
}
