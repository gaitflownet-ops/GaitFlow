import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.storage.from('invoicing-assets').list();
  if (error) console.error("List Error:", error);
  else {
    console.log("Objects in bucket:", data);
    if (data && data.length > 0) {
       const publicUrl = supabase.storage.from('invoicing-assets').getPublicUrl(data[data.length-1].name).data.publicUrl;
       console.log("Sample URL:", publicUrl);
    }
  }
}
run();
