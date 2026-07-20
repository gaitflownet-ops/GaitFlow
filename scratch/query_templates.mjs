import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('invoice_templates').select('logo_url').order('updated_at', { ascending: false }).limit(5);
  console.log("Templates:", data);
  console.log("Error:", error);
}
run();
