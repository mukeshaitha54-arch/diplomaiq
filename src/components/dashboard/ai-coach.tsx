"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { getPersonalizedCoachAdvice, generateStudyPlan } from "@/lib/actions/ai";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, Calendar, BookOpen } from "lucide-react";

export function AICoachComponent() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'coach' | 'daily' | 'weekly' | 'exam'>('coach');
  const [content, setContent] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const datasetType = searchParams.get('dataset') || 'semester';

  const fetchContent = async (tab: 'coach' | 'daily' | 'weekly' | 'exam') => {
    setLoading(true);
    setActiveTab(tab);
    setContent(null);
    try {
      if (tab === 'coach') {
        const res = await getPersonalizedCoachAdvice(datasetType);
        setContent(res);
      } else {
        const res = await generateStudyPlan(tab, datasetType);
        setContent(res);
      }
    } catch (err) {
      console.error(err);
      setContent("An error occurred while generating your plan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">AI Academic Mentor</CardTitle>
          <CardDescription className="text-slate-400">
            Generate personalized advice and study plans based on your actual performance data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <Button 
              onClick={() => fetchContent('coach')} 
              disabled={loading}
              variant={activeTab === 'coach' ? "default" : "outline"}
              className={activeTab === 'coach' ? "bg-indigo-600 hover:bg-indigo-700 border-indigo-600" : "bg-slate-950 border-slate-800 text-slate-300"}
            >
              <MessageSquare className="w-4 h-4 mr-2" /> General Strategy
            </Button>
            <Button 
              onClick={() => fetchContent('daily')} 
              disabled={loading}
              variant={activeTab === 'daily' ? "default" : "outline"}
              className={activeTab === 'daily' ? "bg-indigo-600 hover:bg-indigo-700 border-indigo-600" : "bg-slate-950 border-slate-800 text-slate-300"}
            >
              <Calendar className="w-4 h-4 mr-2" /> Daily Plan
            </Button>
            <Button 
              onClick={() => fetchContent('weekly')} 
              disabled={loading}
              variant={activeTab === 'weekly' ? "default" : "outline"}
              className={activeTab === 'weekly' ? "bg-indigo-600 hover:bg-indigo-700 border-indigo-600" : "bg-slate-950 border-slate-800 text-slate-300"}
            >
              <Calendar className="w-4 h-4 mr-2" /> Weekly Plan
            </Button>
            <Button 
              onClick={() => fetchContent('exam')} 
              disabled={loading}
              variant={activeTab === 'exam' ? "default" : "outline"}
              className={activeTab === 'exam' ? "bg-indigo-600 hover:bg-indigo-700 border-indigo-600" : "bg-slate-950 border-slate-800 text-slate-300"}
            >
              <BookOpen className="w-4 h-4 mr-2" /> Exam Prep
            </Button>
          </div>

          <div className="min-h-[300px] border border-slate-800 bg-slate-950 rounded-md p-6 relative">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm z-10 rounded-md">
                <div className="flex flex-col items-center">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
                  <p className="text-slate-400">Analyzing your academic profile...</p>
                </div>
              </div>
            )}
            
            {!content && !loading && (
              <div className="flex h-full items-center justify-center text-slate-500">
                Select an option above to generate your AI-powered plan.
              </div>
            )}

            {content && !loading && (
              <div className="prose prose-invert prose-indigo max-w-none">
                {/* Basic markdown rendering since we don't have react-markdown installed. 
                    Splitting by newlines and rendering simple paragraphs/headers for now. */}
                {content.split('\n').map((line, i) => {
                  if (line.startsWith('### ')) return <h4 key={i} className="text-lg font-bold mt-4 mb-2 text-slate-200">{line.replace('### ', '')}</h4>;
                  if (line.startsWith('## ')) return <h3 key={i} className="text-xl font-bold mt-5 mb-3 text-white">{line.replace('## ', '')}</h3>;
                  if (line.startsWith('# ')) return <h2 key={i} className="text-2xl font-bold mt-6 mb-4 text-indigo-400">{line.replace('# ', '')}</h2>;
                  if (line.startsWith('- ')) return <li key={i} className="ml-4 text-slate-300">{line.replace('- ', '')}</li>;
                  if (line.trim() === '') return <br key={i} />;
                  return <p key={i} className="text-slate-300 leading-relaxed">{line}</p>;
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
