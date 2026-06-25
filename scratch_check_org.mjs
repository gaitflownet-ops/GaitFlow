import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function run() {
  console.log("--- ORGANIZATIONS ---");
  const { data: orgs } = await supabase.from('organizations').select('*');
  console.log(orgs);

  console.log("\n--- PROFILES ---");
  const { data: profiles } = await supabase.from('profiles').select('*');
  console.log(profiles);

  console.log("\n--- ORGANIZATION MEMBERS ---");
  const { data: members } = await supabase.from('organization_members').select('*');
  console.log(members);
}

run();
