import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInvoice() {
  const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
  if (!orgs || !orgs.length) return console.log('No orgs');
  
  const orgId = orgs[0].id;
  
  const invoice = {
    organization_id: orgId,
    type: "sale",
    status: "draft",
    currency: "COP",
    invoice_number: "TEST-001",
    issue_date: new Date().toISOString(),
    due_date: new Date().toISOString(),
    subtotal: 1000,
    tax_amount: 190,
    discount_amount: 0,
    total: 1190,
    balance_due: 1190,
    document_type: "invoice",
    payment_condition: "immediate"
  };

  const { data, error } = await supabase.from('invoices').insert(invoice).select();
  console.log('Result:', data, error);
}

testInvoice();
