import { createAdminClient } from '@insforge/sdk';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const insforgeUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
const insforgeApiKey = process.env.INSFORGE_API_KEY || process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;
const adminClient = createAdminClient({
  baseUrl: insforgeUrl,
  apiKey: insforgeApiKey,
});

async function runVerification() {
  console.log("=== 1. ECET Engine Database Verification ===");
  
  const { count: totalCutoffs } = await adminClient.database
    .from('ecet_cutoffs')
    .select('*', { count: 'exact', head: true });
    
  const { count: historicalCount } = await adminClient.database
    .from('ecet_cutoffs')
    .select('*', { count: 'exact', head: true })
    .eq('source_type', 'estimated');

  const { count: forecastCount } = await adminClient.database
    .from('ecet_cutoffs')
    .select('*', { count: 'exact', head: true })
    .eq('source_type', 'forecast');
    
  const { count: verifiedTrue } = await adminClient.database
    .from('ecet_cutoffs')
    .select('*', { count: 'exact', head: true })
    .eq('verified_flag', true);
    
  const { count: verifiedFalse } = await adminClient.database
    .from('ecet_cutoffs')
    .select('*', { count: 'exact', head: true })
    .eq('verified_flag', false);

  console.log(`Total ECET Records: ${totalCutoffs}`);
  console.log(`Historical (Estimated) Records: ${historicalCount}`);
  console.log(`Forecast Records: ${forecastCount}`);
  console.log(`Verified = True: ${verifiedTrue}`);
  console.log(`Verified = False: ${verifiedFalse}`);

  console.log("\n=== 2. ECET Engine Recommendation Test ===");
  const testParams = {
    rank: 1819,
    branch: 'CSM', 
    category: 'EWS',
    gender: 'Female'
  };
  console.log(`Testing with params:`, testParams);
  
  // Duplicating the logic from getECETRecommendations to test it via adminClient
  let query = adminClient.database
    .from('ecet_cutoffs')
    .select('*')
    .eq('category', testParams.category)
    .eq('branch_code', testParams.branch)
    .eq('gender', testParams.gender);
    
  const { data: recs, error: recError } = await query;
  if (recError) {
    console.error("Error fetching recommendations:", recError);
  } else {
    // Deduplicate logic
    const latestMap = new Map();
    for (const row of recs) {
      const key = `${row.college_code}-${row.branch_code}`;
      const existing = latestMap.get(key);
      if (!existing || row.year > existing.year) {
        latestMap.set(key, row);
      }
    }
    const latestRecords = Array.from(latestMap.values());
    console.log(`Found ${latestRecords.length} matching latest records for this combination.`);
    
    const buckets = { Dream: 0, Moderate: 0, Safe: 0 };
    for (const record of latestRecords) {
      const cutoff = record.closing_rank;
      if (buckets.Dream === 0 && buckets.Moderate === 0 && buckets.Safe === 0) {
         console.log("Sample cutoff type:", typeof cutoff, "Value:", cutoff);
      }
      if (testParams.rank > cutoff && testParams.rank <= cutoff + 5000) {
        buckets.Dream++;
      } else if (testParams.rank <= cutoff && testParams.rank > cutoff - 2000) {
        buckets.Moderate++;
      } else if (testParams.rank <= cutoff - 2000) {
        buckets.Safe++;
      }
    }
    console.log("Bucket distribution:");
    console.log(buckets);
  }

  console.log("\n=== 3. Database Integrity (Semesters) ===");
  const { data: sems, error: semsErr } = await adminClient.database
    .from('semesters')
    .select('*')
    .order('semester_number');
  
  if (semsErr) console.error(semsErr);
  else {
    console.log(`Total Semesters in DB (across all users): ${sems.length}`);
    if (sems.length > 0) {
      console.log(`Sample semesters:`, sems.slice(0, 4).map(s => `Sem ${s.semester_number} (SGPA: ${s.sgpa})`));
    }
  }

  console.log("\n=== 4. Database Integrity (Academic Summary) ===");
  const { data: summaries, error: sumErr } = await adminClient.database
    .from('academic_summary')
    .select('strong_subjects, weak_subjects, cgpa');
    
  if (sumErr) console.error(sumErr);
  else {
    console.log(`Total Academic Summaries in DB: ${summaries.length}`);
    if (summaries.length > 0) {
      const s = summaries[0];
      console.log(`Sample Summary 1: CGPA: ${s.cgpa}, Strong: ${s.strong_subjects}, Weak: ${s.weak_subjects}`);
    }
  }
}

runVerification().catch(console.error);
