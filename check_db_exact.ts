import { createAdminClient } from '@insforge/sdk';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
async function run() {
  const adminClient = createAdminClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL, apiKey: process.env.INSFORGE_API_KEY });
  
  const { data: sum } = await adminClient.database.from('assessment_summaries').select('id');
  console.log('assessment_summaries count:', sum ? sum.length : 0);
  
  const { data: pred } = await adminClient.database.from('prediction_history').select('id');
  console.log('prediction_history count:', pred ? pred.length : 0);

  const { data: inst } = await adminClient.database.from('assessment_instances').select('id, assessment_type, semester_number');
  const { data: sub } = await adminClient.database.from('assessment_subjects').select('assessment_instance_id, subject_code');
  
  const typeCount: any = {};
  const semCount: any = {};
  const dupes: any = {};

  if (inst && sub) {
    for (const s of sub) {
      const parent = inst.find((i: any) => i.id === s.assessment_instance_id);
      if (parent) {
        typeCount[parent.assessment_type] = (typeCount[parent.assessment_type] || 0) + 1;
        semCount[parent.semester_number] = (semCount[parent.semester_number] || 0) + 1;
      }
      const key = s.assessment_instance_id + '_' + s.subject_code;
      dupes[key] = (dupes[key] || 0) + 1;
    }
  }

  console.log('Distribution by type:', typeCount);
  console.log('Distribution by semester:', semCount);
  
  let duplicateFound = false;
  for (const k in dupes) {
    if (dupes[k] > 1) {
      duplicateFound = true;
      console.log('Duplicate:', k, dupes[k]);
    }
  }
  if (!duplicateFound) console.log('Duplicates: 0');
}
run();
