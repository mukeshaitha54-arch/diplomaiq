"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, AlertCircle, CheckCircle2 } from "lucide-react";
import { generateActionItems } from "@/lib/actions/ai";

export function ActionCenter() {
  const [loading, setLoading] = useState(false);
  const [actions, setActions] = useState<any[]>([]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateActionItems();
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
        ) : (
          !loading && (
            <div className="text-center py-8 text-slate-500 text-sm">
              Click generate to analyze your profile and find high-impact tasks.
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
