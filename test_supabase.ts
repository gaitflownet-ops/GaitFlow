import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// read .env.local manually
const envFile = fs.readFileSync('.env.local', 'utf-8');
const env: Record<string, string> = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length) env[key.trim()] = val.join('=').trim();
});

const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_ANON_KEY
);

async function test() {
  const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
  const orgId = orgs?.[0]?.id;
  
  const { data: horses } = await supabase.from('horses').select('id').limit(1);
  const horseId = horses?.[0]?.id;

  if (!orgId || !horseId) {
    console.log("Missing org or horse");
    return;
  }
  
  const { data, error } = await supabase
    .from('ccc_nutrition_plans')
    .insert({
      organization_id: orgId,
      horse_id: horseId,
      name: "Test",
      purpose: "Mantenimiento",
      status: "Active",
      general_observations: "None"
    })
    .select();
    
  console.log("Plan error:", error);

  if (data && data[0]) {
    const { error: itemError } = await supabase
      .from('ccc_nutrition_items')
      .insert([{
        plan_id: data[0].id,
        product_name: "Test",
        category: "Concentrado",
        quantity: 1,
        unit: "kg",
        schedule: "Mañana"
      }]);
    console.log("Item error:", itemError);
  }
}

test();
