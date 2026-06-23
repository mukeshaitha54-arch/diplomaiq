import { getStudentContext } from "@/lib/actions/context";
import { redirect } from "next/navigation";
import { MidSemEntryForm } from "@/components/dashboard/mid-sem-entry-form";

export const dynamic = "force-dynamic";

export default async function MidSemEntryPage() {
  const context = await getStudentContext('semester');

  if (!context) {
    redirect("/login");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">Mid-Sem Entry</h1>
        <p className="text-slate-400 mt-2">
          Manually enter your internal and mid-semester marks to generate predictive analytics and early risk warnings.
        </p>
      </div>

      <MidSemEntryForm context={context} />
    </div>
  );
}
