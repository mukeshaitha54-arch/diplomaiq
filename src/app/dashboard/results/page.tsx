import { createInsForgeServerClient } from "@/lib/insforge/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Academic Results - DiplomaIQ",
  description: "View all your academic results by category.",
};

export default async function ResultsPage() {
  const { auth } = await createInsForgeServerClient();
  const { data: authData } = await auth.getCurrentUser();
  if (!authData?.user) return null;
  const profileId = authData.user.id;

  const { adminClient } = await import("@/lib/insforge/client");

  // Fetch all instances and subjects
  const [instancesRes, subjectsRes] = await Promise.all([
    adminClient.database.from('assessment_instances').select('*').eq('profile_id', profileId).order('semester_number', { ascending: true }),
    adminClient.database.from('assessment_subjects').select('*').order('subject_name')
  ]);

  const instances = instancesRes.data || [];
  const allSubjects = subjectsRes.data || [];

  // Map subjects to their instances
  const instancesWithSubjects = instances.map((inst: any) => ({
    ...inst,
    subjects: allSubjects.filter((s: any) => s.assessment_instance_id === inst.id)
  }));

  // Group by type
  const semesterInstances = instancesWithSubjects.filter(i => i.assessment_type === 'semester');
  const mid1Instances = instancesWithSubjects.filter(i => i.assessment_type === 'mid1');
  const mid2Instances = instancesWithSubjects.filter(i => i.assessment_type === 'mid2');
  const internalInstances = instancesWithSubjects.filter(i => i.assessment_type === 'internal');
  const supplyInstances = instancesWithSubjects.filter(i => i.assessment_type === 'supply');
  const currentInstances = instancesWithSubjects.filter(i => i.assessment_type === 'current');

  // Helper to group by semester
  const groupBySemester = (insts: any[]) => {
    const map = new Map<number, any[]>();
    insts.forEach(i => {
      const s = i.semester_number;
      if (!map.has(s)) map.set(s, []);
      map.get(s)!.push(i);
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  };

  const ResultTable = ({ subjects, isSupply = false }: { subjects: any[], isSupply?: boolean }) => {
    if (!subjects || subjects.length === 0) return <div className="p-4 text-sm text-slate-500">No results found.</div>;
    
    // Sort supply chronological if needed
    const sorted = isSupply ? [...subjects].sort((a, b) => a.subject_name.localeCompare(b.subject_name) || a.attempt_number - b.attempt_number) : subjects;

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-400">
          <thead className="text-xs text-slate-500 uppercase bg-slate-900/50">
            <tr>
              <th className="px-4 py-3 rounded-tl-lg">Subject Name</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3 text-center">Marks</th>
              {isSupply && <th className="px-4 py-3 text-center">Attempt</th>}
              <th className="px-4 py-3 text-right rounded-tr-lg">Result</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s: any, idx: number) => (
              <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                <td className="px-4 py-3 font-medium text-slate-300">{s.subject_name}</td>
                <td className="px-4 py-3">{s.subject_code}</td>
                <td className="px-4 py-3 text-center">{s.marks_obtained} / {s.max_marks}</td>
                {isSupply && <td className="px-4 py-3 text-center">Attempt {s.attempt_number}</td>}
                <td className="px-4 py-3 text-right">
                  {s.is_failed ? (
                    <Badge variant="outline" className="bg-rose-500/10 text-rose-500 border-rose-900">Fail</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-900">Pass</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-white">Academic Results</h2>
      </div>

      <Tabs defaultValue="semester" className="w-full space-y-4">
        <TabsList className="bg-slate-900 border border-slate-800 p-1 flex flex-wrap h-auto gap-1 w-full justify-start">
          <TabsTrigger value="semester" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Semester Results</TabsTrigger>
          <TabsTrigger value="mids" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Mid Results</TabsTrigger>
          <TabsTrigger value="internals" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Internal Results</TabsTrigger>
          <TabsTrigger value="supply" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Supply Results</TabsTrigger>
          <TabsTrigger value="current" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Current Results</TabsTrigger>
        </TabsList>

        <TabsContent value="semester" className="space-y-4 m-0">
          {semesterInstances.length === 0 ? (
            <Card className="bg-slate-900 border-slate-800"><CardContent className="pt-6 text-slate-500">No semester results found.</CardContent></Card>
          ) : (
            semesterInstances.map((inst, i) => (
              <Card key={i} className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Semester {inst.semester_number} Regular</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ResultTable subjects={inst.subjects} />
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="mids" className="space-y-4 m-0">
          {groupBySemester([...mid1Instances, ...mid2Instances]).map(([semId, insts]) => (
            <Card key={semId} className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Semester {semId} Mid Exams</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {insts.filter(i => i.assessment_type === 'mid1').map((m1, idx) => (
                  <div key={`m1-${idx}`}>
                    <h4 className="text-sm font-semibold text-slate-300 mb-2 px-4">Mid-1</h4>
                    <ResultTable subjects={m1.subjects} />
                  </div>
                ))}
                {insts.filter(i => i.assessment_type === 'mid2').map((m2, idx) => (
                  <div key={`m2-${idx}`}>
                    <h4 className="text-sm font-semibold text-slate-300 mb-2 px-4">Mid-2</h4>
                    <ResultTable subjects={m2.subjects} />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
          {mid1Instances.length === 0 && mid2Instances.length === 0 && (
            <Card className="bg-slate-900 border-slate-800"><CardContent className="pt-6 text-slate-500">No mid results found.</CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="internals" className="space-y-4 m-0">
          {internalInstances.length === 0 ? (
            <Card className="bg-slate-900 border-slate-800"><CardContent className="pt-6 text-slate-500">No internal results found.</CardContent></Card>
          ) : (
            internalInstances.map((inst, i) => (
              <Card key={i} className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Semester {inst.semester_number} Internal Assessments</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ResultTable subjects={inst.subjects} />
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="supply" className="space-y-4 m-0">
          {supplyInstances.length === 0 ? (
             <Card className="bg-slate-900 border-slate-800"><CardContent className="pt-6 text-slate-500">No supply results found. Great job!</CardContent></Card>
          ) : (
             supplyInstances.map((inst, i) => {
               // We should also fetch attempt 1 (failed regular) to show timeline.
               const relatedRegular = semesterInstances.find(r => r.semester_number === inst.semester_number);
               const originalFails = relatedRegular ? relatedRegular.subjects.filter((s: any) => s.is_failed) : [];
               
               // Combine
               const combined = [...originalFails.map((s: any) => ({...s, attempt_number: 1})), ...inst.subjects];
               
               return (
                <Card key={i} className="bg-slate-900 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white">Semester {inst.semester_number} Supply History</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ResultTable subjects={combined} isSupply={true} />
                  </CardContent>
                </Card>
               );
             })
          )}
        </TabsContent>
        
        <TabsContent value="current" className="space-y-4 m-0">
          {currentInstances.length === 0 ? (
            <Card className="bg-slate-900 border-slate-800"><CardContent className="pt-6 text-slate-500">No current semester results found.</CardContent></Card>
          ) : (
            currentInstances.map((inst, i) => (
              <Card key={i} className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Semester {inst.semester_number} Current Progress</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ResultTable subjects={inst.subjects} />
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

      </Tabs>
    </div>
  );
}
