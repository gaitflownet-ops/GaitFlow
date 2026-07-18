import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testUpsert() {
  const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
  if (!orgs || !orgs.length) return console.log('No orgs');
  
  const orgId = orgs[0].id;
  console.log('Testing with org:', orgId);
  
  const { data, error } = await supabase.from('invoice_templates').upsert({
    organization_id: orgId,
    company_name: 'Test',
    tax_regime: 'no_vat_responsible'
  }, { onConflict: 'organization_id' });
  
  console.log('Result:', data, error);
}

testUpsert();
