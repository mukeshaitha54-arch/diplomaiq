"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, AlertCircle, CheckCircle2 } from "lucide-react";
import { generateActionItems } from "@/lib/actions/ai";
import { StudentContext } from "@/lib/actions/context";

export function ActionCenter({ context }: { context?: StudentContext }) {
  const [loading, setLoading] = useState(false);
  const [actions, setActions] = useState<any[]>([]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateActionItems(context?.dataset?.type || 'semester');
      if (result && Array.isArray(result)) {
        setActions(result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'bg-rose-500/20 text-rose-400 border-rose-900';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-900';
      case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-900';
      default: return 'bg-teal-500/20 text-teal-400 border-teal-900';
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="h-5 w-5 text-indigo-400" />
            AI Action Center
          </CardTitle>
          <CardDescription className="text-slate-400">
            Top prioritized tasks to improve your profile.
          </CardDescription>
        </div>
        {actions.length === 0 && (
          <Button onClick={handleGenerate} disabled={loading} variant="outline" className="border-indigo-600 text-indigo-400 hover:bg-indigo-950">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Generate Action Plan
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {actions.length > 0 ? (
          <div className="space-y-4">
            {actions.map((action, i) => (
              <div key={i} className="flex flex-col gap-2 p-4 rounded-lg border border-slate-800 bg-slate-950/50">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-slate-400" />
                    <h4 className="text-sm font-medium text-slate-200">{action.action}</h4>
                  </div>
                  <Badge variant="outline" className={getPriorityColor(action.priority)}>
                    {action.priority}
                  </Badge>
                </div>
                <div className="pl-6 text-sm text-slate-400 space-y-1">
                  <p><span className="text-slate-500 font-medium">Reason:</span> {action.reason}</p>
                  <p><span className="text-slate-500 font-medium">Impact:</span> {action.estimated_impact}</p>
                </div>
                <div className="pl-6 mt-2">
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/50">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Mark Complete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : context?.prediction ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-4 p-4 rounded-lg border border-slate-800 bg-slate-950/50">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-indigo-400" />
                  <h4 className="text-sm font-medium text-slate-200">AI Prediction Active</h4>
                </div>
                <Badge variant="outline" className={getPriorityColor(context.prediction.risk_level || 'Low')}>
                  {context.prediction.risk_level || 'Low'} RISK
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="flex flex-col">
                  <span className="text-slate-500 text-xs">Predicted SGPA</span>
                  <span className="text-slate-200 font-medium">{context.prediction.predicted_sgpa || 'N/A'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-500 text-xs">Predicted CGPA</span>
                  <span className="text-slate-200 font-medium">{context.prediction.predicted_cgpa || 'N/A'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-500 text-xs">Pass Probability</span>
                  <span className="text-emerald-400 font-medium">{context.prediction.pass_probability ? `${context.prediction.pass_probability}%` : 'N/A'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-500 text-xs">Backlog Risk</span>
                  <span className="text-rose-400 font-medium">{context.prediction.pass_probability ? `${(100 - Number(context.prediction.pass_probability)).toFixed(2)}%` : 'N/A'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-500 text-xs">Confidence Score</span>
                  <span className="text-slate-200 font-medium">{context.prediction.confidence_score || 'N/A'}</span>
                </div>
              </div>

              {context.prediction.predicted_backlogs > 0 && (
                <div className="text-sm text-rose-400 bg-rose-500/10 p-3 rounded-md border border-rose-500/20">
                  <AlertCircle className="h-4 w-4 inline mr-2" />
                  Warning: You are at risk of {context.prediction.predicted_backlogs} backlogs.
                </div>
              )}

              <div className="mt-2 border-t border-slate-800 pt-4">
                <Button onClick={handleGenerate} disabled={loading} variant="outline" size="sm" className="w-full sm:w-auto h-9 text-sm border-indigo-600 text-indigo-400 hover:bg-indigo-950">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                  Generate Action Plan
                </Button>
              </div>
            </div>
          </div>
        ) : (
          !loading && (
            <div className="text-center py-8 text-slate-500 text-sm">
              <p className="mb-4">No prediction data available yet.</p>
              <Button onClick={handleGenerate} disabled={loading} variant="outline" className="border-indigo-600 text-indigo-400 hover:bg-indigo-950">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Generate Action Plan
              </Button>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
