import { createInsForgeServerClient } from "@/lib/insforge/server";
import { SBTETProvider } from "@/lib/sbtet/provider";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Helper to stringify JSON nicely
const JsonDisplay = ({ data }: { data: any }) => (
  <pre className="p-4 bg-slate-950 rounded-md overflow-x-auto text-xs text-green-400">
    {JSON.stringify(data, null, 2)}
  </pre>
);

export default async function DebugSyncPage({
  searchParams
}: {
  searchParams: Promise<{ action?: string }>
}) {
  const { auth } = await createInsForgeServerClient();
  const { data: authData } = await auth.getCurrentUser();
  
  if (!authData?.user) {
    redirect("/login");
  }

  // Basic admin check (could be expanded)
  const isAdmin = true; // In a real app, verify role
  if (!isAdmin) {
    redirect("/dashboard");
  }

  const sp = await searchParams;
  let rawData = null;
  let error = null;

  if (sp.action === 'fetch') {
    try {
      const { adminClient } = await import('@/lib/insforge/client');
      const { data: profile } = await adminClient.database
        .from('student_profiles')
        .select('pin')
        .eq('id', authData.user.id)
        .single();

      if (profile?.pin) {
        const apiClient = SBTETProvider.getApiClient();
        const consolidated = await apiClient.getConsolidatedResults(profile.pin);
        const attendance = await apiClient.getAttendanceReport(profile.pin);
        
        rawData = {
          consolidated,
          attendance
        };
      } else {
        error = "No PIN found for user.";
      }
    } catch (e: any) {
      error = e.message;
    }
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-heading text-white">Debug Sync Engine</h2>
          <p className="text-slate-400">Admin-only diagnostic tool for assessing dataset capabilities.</p>
        </div>
        <form>
          <input type="hidden" name="action" value="fetch" />
          <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors">
            Run Diagnostic Extraction
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-md">
          {error}
        </div>
      )}

      {rawData && (
        <div className="space-y-8">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">SBTET Gateway Output (Raw API Payload)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Consolidated Results</h3>
                  <JsonDisplay data={rawData.consolidated} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Attendance Report</h3>
                  <JsonDisplay data={rawData.attendance} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">Parsed Internal Representation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 mb-4">This view will be implemented as we build the parser layer.</p>
              <JsonDisplay data={{ note: "Pending parser implementation" }} />
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">Target Database State</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 mb-4">This view will show exactly what gets pushed to InsForge Database.</p>
              <JsonDisplay data={{ note: "Pending mapper implementation" }} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
