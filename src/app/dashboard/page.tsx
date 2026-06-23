import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle, BookOpen, GraduationCap, HeartPulse } from "lucide-react";
import { createInsForgeServerClient } from "@/lib/insforge/server";
import { redirect } from "next/navigation";
import { SGPAChart } from "@/components/dashboard/sgpa-chart";
import { getStudentContext } from "@/lib/actions/context";
import { ActionCenter } from "@/components/dashboard/action-center";
import { AchievementBadges } from "@/components/dashboard/achievement-badges";
import { RecentActivityFeed } from "@/components/dashboard/recent-activity";
import { SyncHealthCard } from "@/components/dashboard/sync-health";
import { CareerReadiness } from "@/components/dashboard/career-readiness";
import { GoalTracker } from "@/components/dashboard/goal-tracker";
import { WeeklyFocus } from "@/components/dashboard/weekly-focus";

export default async function DashboardPage() {
  const { auth } = await createInsForgeServerClient();
  const { data: authData } = await auth.getCurrentUser();
  if (!authData?.user) {
    redirect("/login");
  }

  const context = await getStudentContext();
  const hasData = !!context?.profile && !!context?.academicSummary;

  let displaySummary = null;
  if (hasData && context) {
    const { profile, academicSummary, semesters, attendance, derivedMetrics } = context;
    const latestAttendance = attendance 
      ? `${attendance.percentage || attendance.attendance_percentage}%` 
      : "N/A";

    displaySummary = {
      cgpa: academicSummary.cgpa || 0,
      totalBacklogs: academicSummary.total_backlogs || 0,
      attendancePercentage: latestAttendance,
      strongSubjects: academicSummary.strong_subjects || [],
      weakSubjects: academicSummary.weak_subjects || [],
      lastCalculatedAt: academicSummary.last_calculated_at 
        ? new Date(academicSummary.last_calculated_at).toLocaleString() 
        : "Never",
      derivedMetrics
    };
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-heading text-white">Command Center</h2>
          <p className="text-slate-400">Welcome back{context?.profile?.full_name ? `, ${context.profile.full_name}` : ''}. Here is your academic overview.</p>
        </div>
      </div>

      {!hasData && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-center">
          <p className="text-slate-400 mb-4">You have not synced your academic records yet.</p>
          <a href="/dashboard/sync" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-indigo-600 text-white shadow hover:bg-indigo-700 h-9 px-4 py-2">
            Go to Sync Page
          </a>
        </div>
      )}

      {displaySummary && (
        <div className="space-y-6">
          <AchievementBadges context={context!} />
          
          {/* Top Stat Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Health Score 2.0</CardTitle>
                <HeartPulse className="h-4 w-4 text-indigo-400" />
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-bold text-white">{displaySummary.derivedMetrics.healthScoreBreakdown.total}</div>
                  <Badge variant="outline" className={
                    displaySummary.derivedMetrics.healthScoreBreakdown.category === 'Excellent' ? 'text-green-400 border-green-900' :
                    displaySummary.derivedMetrics.healthScoreBreakdown.category === 'Good' ? 'text-teal-400 border-teal-900' :
                    displaySummary.derivedMetrics.healthScoreBreakdown.category === 'Needs Attention' ? 'text-amber-400 border-amber-900' :
                    'text-rose-400 border-rose-900'
                  }>
                    {displaySummary.derivedMetrics.healthScoreBreakdown.category}
                  </Badge>
                </div>
                <div className="mt-3 space-y-1 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span className="text-slate-300">CGPA</span>
                    <span>Score: {displaySummary.derivedMetrics.healthScoreBreakdown.cgpaContribution}/{displaySummary.derivedMetrics.healthScoreBreakdown.cgpaMax}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Attendance</span>
                    <span>Score: {displaySummary.derivedMetrics.healthScoreBreakdown.attendanceContribution}/{displaySummary.derivedMetrics.healthScoreBreakdown.attendanceMax}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Backlogs ({displaySummary.totalBacklogs} Active)</span>
                    <span>Score: {displaySummary.derivedMetrics.healthScoreBreakdown.backlogContribution}/{displaySummary.derivedMetrics.healthScoreBreakdown.backlogMax}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Consistency</span>
                    <span>Score: {displaySummary.derivedMetrics.healthScoreBreakdown.consistencyContribution}/{displaySummary.derivedMetrics.healthScoreBreakdown.consistencyMax}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Current CGPA</CardTitle>
                <GraduationCap className="h-4 w-4 text-teal-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{displaySummary.cgpa}</div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Active Backlogs</CardTitle>
                <BookOpen className="h-4 w-4 text-rose-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{displaySummary.totalBacklogs}</div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Attendance</CardTitle>
                <Activity className="h-4 w-4 text-amber-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{displaySummary.attendancePercentage}</div>
                <p className="text-xs text-slate-500 mt-1">Latest attendance</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-1">
              <WeeklyFocus context={context!} />
            </div>
            <div className="md:col-span-2">
              <ActionCenter />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">SGPA Trend</CardTitle>
                <CardDescription className="text-slate-400">Your performance across semesters</CardDescription>
              </CardHeader>
              <CardContent className="h-72 border border-slate-800/50 mx-6 mb-6 rounded-md bg-slate-950/50 p-4">
                <SGPAChart data={context?.semesters || []} />
              </CardContent>
            </Card>
            
            <Card className="col-span-3 bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Subject Analysis</CardTitle>
                <CardDescription className="text-slate-400">Precomputed strengths and weaknesses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-300">Strong Subjects</h4>
                  <div className="flex flex-wrap gap-2">
                    {displaySummary.strongSubjects.length > 0 ? displaySummary.strongSubjects.map((sub: string, i: number) => (
                      <Badge key={i} variant="outline" className="bg-teal-950/30 text-teal-400 border-teal-900">
                        {sub}
                      </Badge>
                    )) : <span className="text-sm text-slate-500">No data</span>}
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-300">Needs Improvement</h4>
                  <div className="flex flex-wrap gap-2">
                    {displaySummary.weakSubjects.length > 0 ? displaySummary.weakSubjects.map((sub: string, i: number) => (
                      <Badge key={i} variant="outline" className="bg-rose-950/30 text-rose-400 border-rose-900">
                        {sub}
                      </Badge>
                    )) : <span className="text-sm text-slate-500">No data</span>}
                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-800 text-xs text-slate-500">
                  Data last calculated: {displaySummary.lastCalculatedAt}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <SyncHealthCard context={context!} />
            <GoalTracker context={context!} />
            <CareerReadiness context={context!} />
            <RecentActivityFeed />
          </div>
        </div>
      )}
    </div>
  );
}
