"use client";

import { useState } from "react";
import { saveMidSemDataAction } from "@/lib/actions/midsem";
import { StudentContext } from "@/lib/actions/context";
import { toast } from "react-hot-toast";

interface MidSemEntryFormProps {
  context: StudentContext;
}

export function MidSemEntryForm({ context }: MidSemEntryFormProps) {
  const [assessmentType, setAssessmentType] = useState("mid1");
  const [semesterNumber, setSemesterNumber] = useState<number>(
    context.semesters[0]?.semester_number || 1
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableSemesters = Array.from(new Set(context.subjects.map(s => s.semester_number))).sort();
  const subjectsForSemester = context.subjects.filter(s => s.semester_number === semesterNumber);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const result = await saveMidSemDataAction(formData);
    
    if (result.success) {
      toast.success("Mid-Sem data saved successfully!");
      // Could redirect or clear form here
    } else {
      toast.error(result.error || "Failed to save data");
    }
    setIsSubmitting(false);
  }

  if (availableSemesters.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-900 rounded-xl border border-slate-800">
        <p>No semester subjects found. Please sync your final results first to populate your curriculum.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-900/50 rounded-xl border border-slate-800">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Assessment Type</label>
          <select 
            name="assessment_type"
            value={assessmentType}
            onChange={(e) => setAssessmentType(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="mid1">Mid-1 Exam</option>
            <option value="mid2">Mid-2 Exam</option>
            <option value="internal">Internal Assessments / Practicals</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Target Semester</label>
          <select 
            name="semester_number"
            value={semesterNumber}
            onChange={(e) => setSemesterNumber(parseInt(e.target.value, 10))}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {availableSemesters.map(num => (
              <option key={num} value={num}>Semester {num}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <h3 className="text-lg font-medium text-slate-200">Enter Marks for Semester {semesterNumber}</h3>
          <p className="text-sm text-slate-400">Leave blank if the subject wasn't tested.</p>
        </div>
        
        <div className="p-6 space-y-4">
          {subjectsForSemester.map((subject) => (
            <div key={subject.subject_code} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-slate-950 rounded-lg border border-slate-800/50">
              <div className="flex-1">
                <div className="font-medium text-slate-200">{subject.subject_name}</div>
                <div className="text-xs text-slate-500">{subject.subject_code}</div>
                <input type="hidden" name={`subject_${subject.subject_code}_name`} value={subject.subject_name} />
              </div>
              
              <div className="flex items-center gap-3">
                <div>
                  <label className="sr-only">Marks Obtained</label>
                  <input 
                    type="number" 
                    name={`subject_${subject.subject_code}_marks`} 
                    placeholder="Marks"
                    min="0"
                    className="w-24 bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 text-center"
                  />
                </div>
                <span className="text-slate-500">/</span>
                <div>
                  <label className="sr-only">Max Marks</label>
                  <input 
                    type="number" 
                    name={`subject_${subject.subject_code}_max`} 
                    defaultValue={assessmentType === 'internal' ? 100 : 20}
                    className="w-20 bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-400 text-center"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-lg shadow-indigo-900/20 transition-all disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Assessment Data'}
        </button>
      </div>
    </form>
  );
}
