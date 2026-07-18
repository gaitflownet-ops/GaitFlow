import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Load env from .env.local
const envFile = fs.readFileSync(".env.local", "utf-8");
const env: Record<string, string> = {};
envFile.split("\n").forEach(line => {
  const [key, ...vals] = line.split("=");
  if (key) env[key.trim()] = vals.join("=").trim().replace(/^"|"$/g, '');
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data: { user }, error: authErr } = await supabase.auth.signInWithPassword({
    email: "juanmanuelsierrabenjumea05@gmail.com",
    password: "Password123!" // assuming this from earlier? Or we can use service role
  });

  const invoice = {
    organization_id: "e0d29cb1-3a0e-43d9-a798-2fbcc6fb7d4a",
    contact_id: null,
    invoice_number: "INV-TEST2",
    issue_date: "2026-07-18",
    due_date: "2026-08-18",
    currency: "COP",
    status: "draft",
    document_type: "invoice",
    payment_condition: "immediate",
    subtotal: 1000,
    tax_amount: 0,
    discount_amount: 0,
    total: 1000,
    balance_due: 1000,
    notes: null,
    terms: null
  };

  const { data, error } = await supabase.from("invoices").insert(invoice).select().single();
  console.log("Invoice result:", data, error);
}

test();
