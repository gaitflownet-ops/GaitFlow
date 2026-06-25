const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

// Read .env.local manually
const envPath = path.resolve(__dirname, ".env.local");
let supabaseUrl = "";
let supabaseAnonKey = "";

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  const lines = content.split("\n");
  for (const line of lines) {
    const parts = line.split("=");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join("=").trim();
      if (key === "VITE_SUPABASE_URL") {
        supabaseUrl = value;
      } else if (key === "VITE_SUPABASE_ANON_KEY") {
        supabaseAnonKey = value;
      }
    }
  }
}

console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Anon Key length:", supabaseAnonKey ? supabaseAnonKey.length : 0);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing env variables in .env.local!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  try {
    console.log("Querying ccc_nutrition_plans table...");
    const { data: plans, error: plansError } = await supabase
      .from("ccc_nutrition_plans")
      .select("*, items:ccc_nutrition_items(*)");

    if (plansError) {
      console.error("Error querying plans:", plansError);
    } else {
      console.log("Plans query success! Count:", plans?.length);
      console.log("Plans & Items Details:");
      console.log(JSON.stringify(plans, null, 2));
    }
  } catch (err) {
    console.error("Exception occurred:", err);
  }
}

test();
