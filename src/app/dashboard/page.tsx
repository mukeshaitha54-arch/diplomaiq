import { getStudentContext } from "@/lib/actions/context";

export default async function DashboardPage() {
  const context = await getStudentContext();

  return <div>PAGE WORKS</div>;
}
