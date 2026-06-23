import { createAdminClient } from "@insforge/sdk";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const adminClient = createAdminClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
  apiKey: process.env.INSFORGE_API_KEY!
});

async function run() {
  console.log("Fetching subjects...");
  const { data: cols, error: colErr } = await adminClient.database.from('subjects').select('*').limit(1);
  if (colErr) console.log("Subjects error:", colErr);
  else console.log("Subjects row keys:", cols && cols[0] ? Object.keys(cols[0]) : "Empty");

  console.log("Fetching semesters...");
  const { data: sems, error: semsErr } = await adminClient.database.from('semesters').select('*').limit(1);
  if (semsErr) console.log("Semesters error:", semsErr);
  else console.log("Semesters row keys:", sems && sems[0] ? Object.keys(sems[0]) : "Empty");
  
  console.log("Fetching profile...");
  const { data: profile, error: profileErr } = await adminClient.database.from('student_profiles').select('*').limit(1);
  if (profileErr) console.log("Profile error:", profileErr);
  else console.log("Profile row keys:", profile && profile[0] ? Object.keys(profile[0]) : "Empty");
}

run();
