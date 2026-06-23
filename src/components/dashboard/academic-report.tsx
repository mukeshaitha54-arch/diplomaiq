"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Download } from "lucide-react";
import { generateAcademicReport } from "@/lib/actions/ai";
import { logClientUsage } from "@/lib/actions/analytics";
import ReactMarkdown from "react-markdown";
import { useReactToPrint } from "react-to-print";

export function AcademicReport() {
  const [loading, setLoading] = useState(false);
  const [reportText, setReportText] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: contentRef,
    documentTitle: "Academic_Report_DiplomaIQ",
    onAfterPrint: () => {
      logClientUsage('pdf_export', 'Academic Report');
    }
  });

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateAcademicReport();
      setReportText(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800/50 pb-4">
        <div>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-400" />
            Comprehensive Academic Report
          </CardTitle>
          <CardDescription className="text-slate-400">
            Generate an 11-point personalized analysis of your academic standing.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          {reportText && (
            <Button onClick={() => handlePrint()} variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800">
              <Download className="h-4 w-4 mr-2" /> PDF Export
            </Button>
          )}
          <Button onClick={handleGenerate} disabled={loading} className="bg-indigo-600 text-white hover:bg-indigo-700">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {reportText ? "Regenerate" : "Generate Report"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {!reportText && !loading && (
          <div className="text-center py-12 text-slate-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Click generate to build your personalized AI academic report.</p>
          </div>
        )}
        
        {loading && (
          <div className="text-center py-12 text-slate-500 flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-indigo-500" />
            <p>Analyzing semesters, backlogs, and attendance...</p>
          </div>
        )}

        {reportText && !loading && (
          <div ref={contentRef} className="print:p-8 print:bg-white print:text-black prose prose-invert print:prose-neutral max-w-none prose-h2:text-indigo-400 print:prose-h2:text-indigo-800 prose-h2:border-b prose-h2:border-slate-800 print:prose-h2:border-slate-300 prose-h2:pb-2">
            <ReactMarkdown>{reportText}</ReactMarkdown>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
