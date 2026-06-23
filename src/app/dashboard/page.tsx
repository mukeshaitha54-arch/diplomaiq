import { getStudentContext } from "@/lib/actions/context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, BookOpen, GraduationCap, HeartPulse } from "lucide-react";
import { AchievementBadges } from "@/components/dashboard/achievement-badges";
import { WeeklyFocus } from "@/components/dashboard/weekly-focus";
import { ActionCenter } from "@/components/dashboard/action-center";
import { RecentActivityFeed } from "@/components/dashboard/recent-activity";
import { SyncHealthCard } from "@/components/dashboard/sync-health";
import { GoalTracker } from "@/components/dashboard/goal-tracker";
import { CareerReadiness } from "@/components/dashboard/career-readiness";

export default async function DashboardPage() {
  const context = await getStudentContext();
  const hasData = !!context?.profile && !!context?.academicSummary;

  let displaySummary: any = null;
  if (hasData && context) {
    const { profile, academicSummary, attendance, derivedMetrics } = context;
    const latestAttendance = attendance 
      ? `${(attendance as any).percentage || (attendance as any).attendance_percentage}%` 
      : "N/A";
    
    displaySummary = {
      cgpa: academicSummary.cgpa || (academicSummary as any).current_cgpa,
      totalBacklogs: academicSummary.total_backlogs || (academicSummary as any).active_backlogs || 0,
      attendancePercentage: latestAttendance,
      derivedMetrics: derivedMetrics || {
        healthScoreBreakdown: { total: 0, category: 'Unknown' },
        weakSubjects: [],
        strongSubjects: []
      },
      lastCalculatedAt: new Date(academicSummary.last_calculated_at || Date.now()).toLocaleDateString()
    };
  }

  if (!displaySummary) {
    return <div>PAGE WORKS - NO SUMMARY</div>;
  }

  try {
    return (
      <div className="space-y-6">
        <AchievementBadges context={context!} />
        
        {/* Top Stat Cards / Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Health Score 2.0</CardTitle>
              <HeartPulse className="h-4 w-4 text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div className="text-3xl font-bold text-white">{displaySummary?.derivedMetrics?.healthScoreBreakdown?.total || 0}</div>
                <Badge variant="outline" className={
                  displaySummary?.derivedMetrics?.healthScoreBreakdown?.category === 'Excellent' ? 'text-green-400 border-green-900' :
                  displaySummary?.derivedMetrics?.healthScoreBreakdown?.category === 'Good' ? 'text-teal-400 border-teal-900' :
                  displaySummary?.derivedMetrics?.healthScoreBreakdown?.category === 'Needs Attention' ? 'text-amber-400 border-amber-900' :
                  'text-rose-400 border-rose-900'
                }>
                  {displaySummary?.derivedMetrics?.healthScoreBreakdown?.category || 'Unknown'}
                </Badge>
              </div>
              <div className="mt-3 space-y-1 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span className="text-slate-300">CGPA</span>
                  <span>Score: {displaySummary?.derivedMetrics?.healthScoreBreakdown?.cgpaContribution || 0}/{displaySummary?.derivedMetrics?.healthScoreBreakdown?.cgpaMax || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Attendance</span>
                  <span>Score: {displaySummary?.derivedMetrics?.healthScoreBreakdown?.attendanceContribution || 0}/{displaySummary?.derivedMetrics?.healthScoreBreakdown?.attendanceMax || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Backlogs ({displaySummary.totalBacklogs} Active)</span>
                  <span>Score: {displaySummary?.derivedMetrics?.healthScoreBreakdown?.backlogContribution || 0}/{displaySummary?.derivedMetrics?.healthScoreBreakdown?.backlogMax || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Consistency</span>
                  <span>Score: {displaySummary?.derivedMetrics?.healthScoreBreakdown?.consistencyContribution || 0}/{displaySummary?.derivedMetrics?.healthScoreBreakdown?.consistencyMax || 0}</span>
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

        {/* Weekly Focus & Action Center Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-1">
            <WeeklyFocus context={context!} />
          </div>
          <div className="md:col-span-2">
            <ActionCenter />
          </div>
        </div>

        {/* Bottom Widgets */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SyncHealthCard context={context!} />
          <GoalTracker context={context!} />
          <CareerReadiness context={context!} />
          <RecentActivityFeed />
        </div>
      </div>
    );
  } catch (error) {
    return <div>METRICS GRID FAILED</div>;
  }
}
