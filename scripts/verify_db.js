require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_INSFORGE_URL,
  process.env.INSFORGE_API_KEY
);

async function checkTable(tableName) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*');
  
  if (error) {
    console.log(`- ${tableName}: Error: ${error.message}`);
  } else {
    console.log(`- ${tableName}: ${data.length} rows`);
  }
}

async function run() {
  console.log("Database Audit:");
  await checkTable('student_profiles');
  await checkTable('academic_summary');
  await checkTable('semesters');
  await checkTable('attendance_records');
  await checkTable('ecet_cutoffs');
  await checkTable('ecet_forecasts');
}

run();
