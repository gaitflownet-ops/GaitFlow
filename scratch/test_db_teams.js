import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env.local manually
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;

console.log("URL:", url);

const supabase = createClient(url, key);

async function run() {
  try {
    const { data: teams, error: e1 } = await supabase.from('teams').select('*').limit(5);
    console.log("Teams:", teams, "Error:", e1);

    const { data: team_members, error: e2 } = await supabase.from('team_members').select('*').limit(5);
    console.log("Team Members:", team_members, "Error:", e2);

    const { data: team_horse_assignments, error: e3 } = await supabase.from('team_horse_assignments').select('*').limit(5);
    console.log("Assignments:", team_horse_assignments, "Error:", e3);
  } catch (error) {
    console.error("Catch error:", error);
  }
}

run();
