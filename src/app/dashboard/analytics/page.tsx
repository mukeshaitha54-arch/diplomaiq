import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, BookOpen, Clock } from "lucide-react";
import { createInsForgeServerClient } from "@/lib/insforge/server";
import { redirect } from "next/navigation";
import { SubjectChart } from "@/components/dashboard/subject-chart";
import { AttendanceChart } from "@/components/dashboard/attendance-chart";
import { SGPAChart } from "@/components/dashboard/sgpa-chart";
import { AttendanceIntelligence } from "@/components/dashboard/attendance-intelligence";
import { Badge } from "@/components/ui/badge";

export default async function AnalyticsPage() {
  const { auth } = await createInsForgeServerClient();
  const { data: authData } = await auth.getCurrentUser();
  if (!authData?.user) {
    redirect("/login");
  }

  const { adminClient } = await import("@/lib/insforge/client");

  // Fetch summary
  const { data: summary } = await adminClient.database
    .from('academic_summary')
    .select('*')
    .eq('profile_id', authData.user.id)
    .single();

  // Fetch semesters
  const { data: semesters } = await adminClient.database
    .from('semesters')
    .select('*')
    .eq('profile_id', authData.user.id)
    .order('semester_number');

  // Fetch subjects
  const { data: subjects } = await adminClient.database
    .from('subjects')
    .select('*')
    .eq('profile_id', authData.user.id)
    .order('created_at');

  // Fetch attendance
  const { data: attendanceRecords } = await adminClient.database
    .from('attendance_records')
    .select('*')
    .eq('profile_id', authData.user.id)
    .order('semester');

  const hasData = !!summary && semesters && semesters.length > 0;

  if (!hasData) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-heading text-white">Academic Analytics</h2>
          <p className="text-slate-400">Deep dive into your academic performance.</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-center">
          <p className="text-slate-400 mb-4">No academic data available yet. Please sync your results.</p>
        </div>
      </div>
    );
  }

  // Calculate insights
  const avgSgpa = semesters.reduce((acc: number, curr: any) => acc + (curr.sgpa || 0), 0) / semesters.length;
  const bestSemester = semesters.reduce((prev: any, current: any) => (prev.sgpa > current.sgpa) ? prev : current);
  const lowestSemester = semesters.reduce((prev: any, current: any) => (prev.sgpa < current.sgpa) ? prev : current);
  
  const avgAttendance = attendanceRecords && attendanceRecords.length > 0 
    ? attendanceRecords.reduce((acc: number, curr: any) => acc + (curr.percentage || 0), 0) / attendanceRecords.length 
    : 0;

  const totalCleared = subjects ? subjects.filter((s: any) => !s.is_backlog).length : 0;
  const totalBacklogs = summary.total_backlogs || 0;

  const subjectData = subjects ? subjects.map((s: any) => ({
    subject_code: s.subject_code,
    subject_name: s.subject_name,
    total_marks: s.total_marks || 0,
    grade: s.grade || "F"
  })) : [];

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight font-heading text-white">Academic Analytics</h2>
        <p className="text-slate-400">Deep dive into your academic performance across semesters.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Average SGPA</CardTitle>
            <TrendingUp className="h-4 w-4 text-teal-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{avgSgpa.toFixed(2)}</div>
            <p className="text-xs text-slate-500 mt-1">Across {semesters.length} semesters</p>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Best Semester</CardTitle>
            <BarChart3 className="h-4 w-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">Sem {bestSemester.semester_number}</div>
            <p className="text-xs text-slate-500 mt-1">SGPA: {bestSemester.sgpa}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Cleared</CardTitle>
            <BookOpen className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalCleared}</div>
            <p className="text-xs text-slate-500 mt-1">Active backlogs: {totalBacklogs}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Avg Attendance</CardTitle>
            <Clock className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{avgAttendance.toFixed(1)}%</div>
            <p className="text-xs text-slate-500 mt-1">Overall percentage</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Subject Performance</CardTitle>
            <CardDescription className="text-slate-400">Total marks per subject across all semesters</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {subjectData.length > 0 ? (
              <SubjectChart data={subjectData} />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500">No subject data available</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">SGPA Trend</CardTitle>
            <CardDescription className="text-slate-400">Semester by semester performance</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <SGPAChart data={semesters} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Attendance Trend</CardTitle>
            <CardDescription className="text-slate-400">Attendance percentage over time</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <AttendanceChart data={attendanceRecords || []} />
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Strength Analysis</CardTitle>
            <CardDescription className="text-slate-400">Computed subject proficiency</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-slate-300">Strong Subjects (&gt;80 Marks)</h4>
              <div className="flex flex-wrap gap-2">
                {summary.strong_subjects && summary.strong_subjects.length > 0 ? (
                  summary.strong_subjects.map((sub: string, i: number) => (
                    <Badge key={i} variant="outline" className="bg-teal-950/30 text-teal-400 border-teal-900">
                      {sub}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">None calculated yet</span>
                )}
              </div>
            </div>
            
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h4 className="text-sm font-medium text-slate-300">Needs Improvement (&lt;40 Marks or Backlogs)</h4>
              <div className="flex flex-wrap gap-2">
                {summary.weak_subjects && summary.weak_subjects.length > 0 ? (
                  summary.weak_subjects.map((sub: string, i: number) => (
                    <Badge key={i} variant="outline" className="bg-rose-950/30 text-rose-400 border-rose-900">
                      {sub}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">None calculated yet</span>
                )}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h4 className="text-sm font-medium text-slate-300">Semester Comparison</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-md border border-slate-800 bg-slate-950 p-3">
                  <div className="text-xs text-slate-400">Highest Performance</div>
                  <div className="text-lg font-bold text-white mt-1">Sem {bestSemester.semester_number}</div>
                  <div className="text-xs text-teal-400">SGPA: {bestSemester.sgpa}</div>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950 p-3">
                  <div className="text-xs text-slate-400">Lowest Performance</div>
                  <div className="text-lg font-bold text-white mt-1">Sem {lowestSemester.semester_number}</div>
                  <div className="text-xs text-rose-400">SGPA: {lowestSemester.sgpa}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Intelligence Module */}
      {attendanceRecords && attendanceRecords.length > 0 && (
        <div className="mt-6">
          <AttendanceIntelligence latestRecord={attendanceRecords[attendanceRecords.length - 1]} />
        </div>
      )}

    </div>
  );
}
