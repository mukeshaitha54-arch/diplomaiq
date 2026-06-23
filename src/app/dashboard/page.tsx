import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle, BookOpen, GraduationCap } from "lucide-react";
import { createInsForgeServerClient } from "@/lib/insforge/server";
import { redirect } from "next/navigation";
import { SGPAChart } from "@/components/dashboard/sgpa-chart";

export default async function DashboardPage() {
  const { auth } = await createInsForgeServerClient();
  const { data: authData } = await auth.getCurrentUser();
  if (!authData?.user) {
    redirect("/login");
  }

  // Use adminClient to fetch because server components can't use RLS without passing cookies properly
  // Wait, createInsForgeServerClient() uses cookies and passes them.
  const { adminClient } = await import("@/lib/insforge/client");
  
  const { data: summary } = await adminClient.database
    .from('academic_summary')
    .select('*')
    .eq('profile_id', authData.user.id)
    .single();

  const { data: profile } = await adminClient.database
    .from('student_profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  const { data: semesters, error: semestersError } = await adminClient.database
    .from('semesters')
    .select('semester_number, sgpa')
    .eq('profile_id', authData.user.id)
    .order('semester_number');

  console.log("Semester Data:", semesters, "Error:", semestersError);

  const { data: attendanceData } = await adminClient.database
    .from('attendance_records')
    .select('attendance_percentage')
    .eq('profile_id', authData.user.id)
    .order('last_updated_at', { ascending: false })
    .limit(1);

  const hasData = !!summary && !!profile;

  const latestAttendance = attendanceData && attendanceData.length > 0 
    ? `${attendanceData[0].attendance_percentage}%` 
    : "N/A";

  const displaySummary = {
    cgpa: summary?.cgpa || 0,
    healthScore: summary?.health_score || 0,
    totalBacklogs: summary?.total_backlogs || 0,
    attendancePercentage: latestAttendance,
    strongSubjects: summary?.strong_subjects || [],
    weakSubjects: summary?.weak_subjects || [],
    lastCalculatedAt: summary?.last_calculated_at ? new Date(summary.last_calculated_at).toLocaleString() : "Never"
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-heading text-white">Command Center</h2>
          <p className="text-slate-400">Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}. Here is your academic overview.</p>
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

      {hasData && (
        <>
          {/* Top Stat Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Health Score</CardTitle>
                <Activity className="h-4 w-4 text-indigo-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{displaySummary.healthScore}/100</div>
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

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">SGPA Trend</CardTitle>
                <CardDescription className="text-slate-400">Your performance across semesters</CardDescription>
              </CardHeader>
              <CardContent className="h-72 border border-slate-800/50 mx-6 mb-6 rounded-md bg-slate-950/50 p-4">
                <SGPAChart data={semesters || []} />
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
        </>
      )}
    </div>
  );
}
