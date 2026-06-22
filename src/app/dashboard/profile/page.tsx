import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { RefreshCcw } from "lucide-react";

import { createInsForgeServerClient } from "@/lib/insforge/server";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const { auth, database } = await createInsForgeServerClient();
  const { data: { user } } = await auth.getCurrentUser();
  if (!user) redirect('/login');

  const { data: profile } = await database
    .from('student_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const mockProfile = profile ? {
    fullName: profile.full_name,
    email: user.email,
    pin: profile.pin,
    branch: profile.branch,
    college: profile.college_name,
    scheme: profile.scheme,
    currentSemester: profile.current_semester,
    lastSyncedAt: profile.last_synced_at ? new Date(profile.last_synced_at).toLocaleString() : 'Never synced',
    dataSource: "Telangana SBTET"
  } : {
    fullName: "Missing Name",
    email: user.email,
    pin: "N/A",
    branch: "N/A",
    college: "N/A",
    scheme: "N/A",
    currentSemester: 1,
    lastSyncedAt: "Never",
    dataSource: "N/A"
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight font-heading text-white">Student Profile</h2>
        <p className="text-slate-400">Manage your personal information and SBTET identity.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <Card className="w-full md:w-1/3 bg-slate-900 border-slate-800 flex flex-col items-center pt-6 text-center">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarFallback className="text-2xl bg-indigo-900 text-indigo-200">AM</AvatarFallback>
          </Avatar>
          <CardHeader className="pt-0">
            <CardTitle className="text-white">{mockProfile.fullName}</CardTitle>
            <CardDescription className="text-slate-400">{mockProfile.pin}</CardDescription>
            <div className="mt-4 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-slate-800 border-slate-700 text-slate-300">
              Semester {mockProfile.currentSemester}
            </div>
          </CardHeader>
        </Card>

        <Card className="flex-1 bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Academic Identity</CardTitle>
            <CardDescription className="text-slate-400">
              These details are synced from SBTET and cannot be modified directly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs">PIN Number</Label>
                <div className="text-white font-medium p-2 bg-slate-950 rounded border border-slate-800">
                  {mockProfile.pin}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs">Branch</Label>
                <div className="text-white font-medium p-2 bg-slate-950 rounded border border-slate-800">
                  {mockProfile.branch}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs">Scheme</Label>
                <div className="text-white font-medium p-2 bg-slate-950 rounded border border-slate-800">
                  {mockProfile.scheme || <span className="text-rose-400 text-xs">Missing: Please update scheme</span>}
                </div>
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="text-slate-400 text-xs">College</Label>
                <div className="text-white font-medium p-2 bg-slate-950 rounded border border-slate-800">
                  {mockProfile.college}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs">Data Source</Label>
                <div className="text-white font-medium p-2 bg-slate-950 rounded border border-slate-800 text-sm">
                  {mockProfile.dataSource}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs">Last Synced Time</Label>
                <div className="text-white font-medium p-2 bg-slate-950 rounded border border-slate-800 text-sm">
                  {mockProfile.lastSyncedAt}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-950/50 pt-6">
            <Link href="/dashboard/sync" className="w-full">
              <Button variant="outline" className="w-full border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300">
                <RefreshCcw className="w-4 h-4 mr-2" />
                Re-sync Academic Data
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Account Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 max-w-md">
            <Label htmlFor="email" className="text-slate-300">Email Address</Label>
            <Input id="email" defaultValue={mockProfile.email} disabled className="bg-slate-950 border-slate-800 text-slate-500" />
          </div>
        </CardContent>
        <CardFooter className="border-t border-slate-800 pt-4 flex justify-between">
          <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">Change Password</Button>
          <Button variant="destructive" className="bg-rose-900/50 text-rose-400 hover:bg-rose-900 hover:text-rose-200 border border-rose-900">Sign Out</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
