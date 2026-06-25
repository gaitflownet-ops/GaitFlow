import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
});

const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function run() {
  console.log("Fetching farms...");
  const { data: farms } = await supabase.from('farms').select('id, name');
  console.log(farms);

  console.log("\nFetching locations...");
  const { data: locations } = await supabase.from('locations').select('id, name, farm_id, capacity');
  console.log(locations);

  console.log("\nFetching stall_units...");
  const { data: stalls } = await supabase.from('stall_units').select('id, stall_number, location_id, horse_id');
  console.log(stalls);
}

run();
