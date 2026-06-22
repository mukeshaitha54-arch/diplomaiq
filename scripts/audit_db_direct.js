const fs = require('fs');

async function queryDB() {
  const supabaseUrl = 'https://34c4uxge.ap-southeast.insforge.app';
  const supabaseKey = process.env.INSFORGE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;
  
  if (!supabaseKey) {
    console.error("Missing DB key");
    return;
  }

  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`
  };

  try {
    const subjectsRes = await fetch(`${supabaseUrl}/rest/v1/subjects?select=*`, { headers });
    const subjects = await subjectsRes.json();
    
    const semRes = await fetch(`${supabaseUrl}/rest/v1/semesters?select=*`, { headers });
    const semesters = await semRes.json();
    
    const profilesRes = await fetch(`${supabaseUrl}/rest/v1/student_profiles?select=*`, { headers });
    const profiles = await profilesRes.json();
    
    const summaryRes = await fetch(`${supabaseUrl}/rest/v1/academic_summary?select=*`, { headers });
    const summary = await summaryRes.json();
    
    const logsRes = await fetch(`${supabaseUrl}/rest/v1/sync_logs?select=*`, { headers });
    const logs = await logsRes.json();

    const result = {
      counts: {
        student_profiles: profiles.length,
        semesters: semesters.length,
        subjects: subjects.length,
        academic_summary: summary.length,
        sync_logs: logs.length
      },
      data: {
        student_profiles: profiles,
        semesters: semesters,
        subjects: subjects,
        academic_summary: summary,
        sync_logs: logs
      }
    };
    
    fs.writeFileSync('db_direct_audit.json', JSON.stringify(result, null, 2));
    console.log("DB Direct Audit Saved.");
  } catch (e) {
    console.error("Error:", e);
  }
}

queryDB();
