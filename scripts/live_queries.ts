import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkOptions() {
  const supabaseUrl = 'https://34c4uxge.ap-southeast.insforge.app';
  const supabaseKey = process.env.INSFORGE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;
  
  const res = await fetch(`${supabaseUrl}/rest/v1/subjects`, {
    method: 'OPTIONS',
    headers: { 'apikey': supabaseKey || '' }
  });
  
  console.log("Headers:", Array.from(res.headers.entries()));
}
checkOptions().catch(console.error);
