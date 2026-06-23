require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_INSFORGE_URL,
  process.env.INSFORGE_API_KEY
);

async function run() {
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*')
    .limit(1);
  if (error) {
    console.error(error);
  } else {
    console.log("Columns:", data && data.length > 0 ? Object.keys(data[0]) : "No data, but query succeeded");
  }

  const { data: s, error: e } = await supabase.from('subjects').select('*').limit(1);
  if (e) {
    console.error(e);
  } else {
    console.log("Subjects Columns:", s && s.length > 0 ? Object.keys(s[0]) : "No data");
  }
}

run();
