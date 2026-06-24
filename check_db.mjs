import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_INSFORGE_URL, process.env.INSFORGE_API_KEY);

async function run() {
  const tables = ['semesters', 'subjects', 'assessment_instances', 'assessment_subjects', 'assessment_summaries', 'prediction_history'];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*');
    console.log(t + ':', data ? data.length : 'null', error ? error : '');
  }
}

run();
