'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { verifyStudentIdentity, importVerifiedIdentity } from "@/lib/actions/sbtet";
import { Loader2 } from "lucide-react";

export default function VerifyPage() {
  const router = useRouter();
  
  // Stages: 'input' -> 'loading' -> 'preview'
  const [stage, setStage] = useState<'input' | 'loading' | 'preview'>('input');
  
  const [fullName, setFullName] = useState("");
  const [pin, setPin] = useState("");
  const [scheme, setScheme] = useState("C26");
  const [semester, setSemester] = useState("1");
  
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !pin || !scheme) return;
    
    setStage('loading');
    setError(null);
    
    const formData = new FormData();
    formData.append("fullName", fullName);
    formData.append("pin", pin);
    formData.append("scheme", scheme);
    formData.append("currentSemester", semester);
    
    const result = await verifyStudentIdentity(formData);
    
    if (result.success) {
      setPreviewData(result.data);
      setStage('preview');
    } else {
      if (result.error === 'already_verified') {
        router.push("/dashboard");
      } else {
        setError(result.error || "Verification failed.");
        setStage('input');
      }
    }
  };

  const handleImport = async () => {
    setStage('loading');
    setError(null);
    
    const result = await importVerifiedIdentity(previewData);
    
    if (result.success) {
      router.push("/dashboard");
    } else {
      setError(result.error || "Failed to save record.");
      setStage('preview');
    }
  };

  const handleCancel = () => {
    setStage('input');
    setPreviewData(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800 shadow-xl shadow-indigo-900/10">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold font-heading text-white">
            {stage === 'preview' ? "Confirm Import" : "Student Verification"}
          </CardTitle>
          <CardDescription className="text-slate-400">
            {stage === 'preview' 
              ? "We found your academic record. Please confirm these details." 
              : "Verify your identity with Telangana SBTET to continue."}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-red-900/50 text-red-200 border border-red-800 rounded-md text-sm flex flex-col gap-2">
              <span>{error}</span>
            </div>
          )}

          {stage === 'input' && (
            <form id="verify-form" onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-slate-300">Full Name (As per SBTET records)</Label>
                <Input 
                  id="fullName" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. AITHA MUKESH" 
                  className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500" 
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pin" className="text-slate-300">PIN Number</Label>
                <Input 
                  id="pin" 
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="e.g. 24054-AI-061" 
                  className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500" 
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheme" className="text-slate-300">Scheme</Label>
                <select 
                  id="scheme" 
                  value={scheme}
                  onChange={(e) => setScheme(e.target.value)}
                  className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring text-white"
                  required
                >
                  <option value="C26">C26</option>
                  <option value="C24">C24</option>
                  <option value="C21">C21</option>
                  <option value="C18">C18</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="semester" className="text-slate-300">Current Semester</Label>
                <select 
                  id="semester" 
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring text-white"
                  required
                >
                  {[1, 2, 3, 4, 5, 6].map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>
            </form>
          )}

          {stage === 'loading' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-slate-300 text-sm">Verifying with Telangana SBTET...</p>
            </div>
          )}

          {stage === 'preview' && previewData && (
            <div className="space-y-3 bg-slate-950 p-4 rounded-lg border border-slate-800">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-slate-400">Name:</div>
                <div className="text-white font-medium">{previewData.studentInfo.fullName}</div>
                <div className="text-slate-400">PIN:</div>
                <div className="text-white font-medium">{previewData.studentInfo.pin}</div>
                <div className="text-slate-400">Scheme:</div>
                <div className="text-white font-medium">{previewData.studentInfo.scheme}</div>
                <div className="text-slate-400">Branch:</div>
                <div className="text-white font-medium">{previewData.studentInfo.branchCode}</div>
                <div className="text-slate-400">College Code:</div>
                <div className="text-white font-medium">{previewData.studentInfo.collegeCode}</div>
                <div className="text-slate-400">College:</div>
                <div className="text-white font-medium">{previewData.studentInfo.collegeName}</div>
                <div className="text-slate-400">Current Semester:</div>
                <div className="text-white font-medium">{previewData.currentSemester}</div>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-2">
          {stage === 'input' && (
            <Button type="submit" form="verify-form" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
              Verify
            </Button>
          )}
          {stage === 'preview' && (
            <>
              <Button onClick={handleImport} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                Import My Academic Record
              </Button>
              <Button variant="outline" onClick={handleCancel} className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                Cancel
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
