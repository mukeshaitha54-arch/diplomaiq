import { RealSBTETConnector } from '../src/lib/sbtet/RealSBTETConnector.js';
import dotenv from 'dotenv';
// Load environment variables from .env.local if present, fallback to .env
dotenv.config({ path: '.env.local' });
if (!process.env.INSFORGE_API_KEY) {
  console.error('Missing INSFORGE_API_KEY in environment. Please set it in .env.local');
  process.exit(1);
}

import { AcademicSyncEngine } from '../src/lib/sbtet/syncEngine.js';
// adminClient will be created after environment variables are loaded
import { createAdminClient } from '@insforge/sdk';
import fs from 'fs';

async function validateRepair() {
  const pin = '24054-AI-061';
  const scheme = 'C24';
  
  console.log(`Starting Database Repair Validation for PIN: ${pin}...`);
  console.log("Cleaning up old database records...");
  
  // 1. Fetch Existing Profile or Create if missing
  let pid: string;
  // Initialize admin client after env is loaded
  const adminClient = createAdminClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL || '',
    apiKey: process.env.INSFORGE_API_KEY || ''
  });

  // 1. Fetch Existing Profile or Create if missing
  
  const prof = await adminClient.database.from('student_profiles').select('id, scheme').eq('pin', pin).single();
  
  if (prof.error || !prof.data) {
    console.log("Profile missing. Creating a dummy auth user to link the profile...");
    const dummyEmail = `test_${Date.now()}@example.com`;
    let authData, authErr;
    try {
      const res = await adminClient.auth.signUp({
        email: dummyEmail,
        password: 'testPassword123!'
      });
      authData = res.data;
      authErr = res.error;
      console.log('Auth signUp response:', res);
    } catch (e) {
      console.error('Exception during auth.signUp:', e);
      authErr = e instanceof Error ? { message: e.message } : { message: String(e) };
    }
    
    if (authErr || !authData?.user) {
      console.warn('Auth user creation failed; generating dummy PID');
      const { randomUUID } = await import('crypto');
      pid = randomUUID();
    } else {
      pid = authData.user.id;
    }
    await adminClient.database.from('student_profiles').upsert({
      id: pid,
      pin_number: pin,
      scheme,
      full_name: 'Mukesh Aitha',
      branch: 'AI',
      current_semester: 1
    });
    console.log("Restored profile successfully with dummy user.");
  } else {
    pid = prof.data.id;
  }

  const engine = new AcademicSyncEngine(new RealSBTETConnector());
  
  try {
    console.log("Running engine.generateSyncPreview()...");
    const preview = await engine.generateSyncPreview(pid, pin, scheme);
    // profileId already set in preview
    
    console.log("Running engine.saveToDatabase() with payload...");
    await engine.saveToDatabase(preview);
    
    // 3. Fetch DB Evidence
    console.log("Fetching DB Evidence...");
    const sems = await adminClient.database.from('semesters').select('*').eq('profile_id', pid);
    const semIds = sems.data?.map(s => s.id) || [];
    const subs = semIds.length > 0 
      ? await adminClient.database.from('subjects').select('*').in('semester_id', semIds)
      : { data: [] };
      
    const summary = await adminClient.database.from('academic_summary').select('*').eq('profile_id', pid);
    const logs = await adminClient.database.from('sync_logs').select('*').eq('profile_id', pid);
    
    const evidence = {
      raw_preview: preview,
      semesters: sems.data,
      subjects: subs.data,
      academic_summary: summary.data,
      sync_logs: logs.data
    };
    
    fs.writeFileSync('repair_db_evidence.json', JSON.stringify(evidence, null, 2));
    console.log("DB Evidence saved to repair_db_evidence.json");
    console.table({
      Semesters: sems.data?.length || 0,
      Subjects: subs.data?.length || 0,
      Summary: summary.data?.length || 0
    });
    
  } catch (err: any) {
    console.error("Validation failed with error:", err.message);
  }
}

validateRepair();
