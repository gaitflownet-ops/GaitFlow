import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const SUPABASE_URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const SUPABASE_KEY = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

async function run() {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/invoicing-assets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_KEY}`
    },
    body: JSON.stringify({
      prefix: '',
      limit: 10,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' }
    })
  });
  const data = await res.json();
  console.log("Bucket Files:", JSON.stringify(data, null, 2));
}

run();
