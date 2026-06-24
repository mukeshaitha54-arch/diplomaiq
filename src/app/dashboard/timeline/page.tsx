import { generateUnifiedTimeline } from "@/lib/actions/timeline";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

export const metadata = {
  title: "Academic Timeline - DiplomaIQ",
  description: "Your complete chronological academic history.",
};

export default async function TimelinePage() {
  const events = await generateUnifiedTimeline();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'failed': return <XCircle className="h-5 w-5 text-rose-500" />;
      default: return <Clock className="h-5 w-5 text-amber-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passed': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-900">Passed</Badge>;
      case 'failed': return <Badge className="bg-rose-500/10 text-rose-500 border-rose-900">Failed / Backlogs</Badge>;
      default: return <Badge className="bg-amber-500/10 text-amber-500 border-amber-900">Pending</Badge>;
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-white">Academic Timeline</h2>
      </div>
      
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Progression History</CardTitle>
          <CardDescription className="text-slate-400">
            A chronological view of your academic progression from admission to current semester.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              No academic events found. Sync your data to populate the timeline.
            </div>
          ) : (
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-800 before:to-transparent">
              {events.map((event, i) => (
                <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-900 bg-slate-800 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    {getStatusIcon(event.status)}
                  </div>
                  
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-800 bg-slate-950/50 shadow">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-slate-200">{event.title}</h3>
                      {getStatusBadge(event.status)}
                    </div>
                    <div className="text-sm text-slate-400">
                      {event.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
