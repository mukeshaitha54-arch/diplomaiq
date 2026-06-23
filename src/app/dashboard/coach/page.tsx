import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export default function AICoachPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight font-heading text-white">AI Coach</h2>
        <p className="text-slate-400">Personalized guidance to improve your scores.</p>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-indigo-400" />
            <CardTitle className="text-white">Coming Soon</CardTitle>
          </div>
          <CardDescription className="text-slate-400">
            Your personalized AI mentor will be available here shortly.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center border border-dashed border-slate-800/50 mx-6 mb-6 rounded-md bg-slate-950/30">
          <p className="text-sm text-slate-500">AI Coach under construction</p>
        </CardContent>
      </Card>
    </div>
  );
}
