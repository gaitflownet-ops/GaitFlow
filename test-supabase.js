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
    // 1. Try querying profiles table
    console.log("Querying profiles table...");
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .limit(5);

    if (profilesError) {
      console.error("Error querying profiles:", profilesError);
    } else {
      console.log("Profiles query success! Count:", profiles?.length);
      console.log("Profiles:", profiles);
    }

    // 2. Query horses
    console.log("Querying horses table...");
    const { data: horses, error: horsesError } = await supabase.from("horses").select("*").limit(5);

    if (horsesError) {
      console.error("Error querying horses:", horsesError);
    } else {
      console.log("Horses query success! Count:", horses?.length);
    }
  } catch (err) {
    console.error("Exception occurred:", err);
  }
}

test();
