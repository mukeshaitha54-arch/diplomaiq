import { Suspense } from "react";
import { AICoachComponent } from "@/components/dashboard/ai-coach";
import { AcademicReport } from "@/components/dashboard/academic-report";

export default function AICoachPage() {
  return (
    <div className="pb-10">
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight font-heading text-white">AI Coach & Planner</h2>
        <p className="text-slate-400">Personalized guidance to improve your scores and plan your studies.</p>
      </div>
      <div className="space-y-6">
        <Suspense fallback={<div className="text-slate-400">Loading Academic Report...</div>}>
          <AcademicReport />
        </Suspense>
        <Suspense fallback={<div className="text-slate-400">Loading AI Coach...</div>}>
          <AICoachComponent />
        </Suspense>
      </div>
    </div>
  );
}

