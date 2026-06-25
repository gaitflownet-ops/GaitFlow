const { createClient } = require("@supabase/supabase-js");

const url = process.env.VITE_SUPABASE_URL || "http://127.0.0.1:54321";
const key = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4b3Jnd2prYXFmZnd1aGttbWJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY5MjU0ODcsImV4cCI6MjA0MjQ5MzQ4N30.K5Y4qK8";

const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.from("permissions").select("*").limit(5);
  console.log("Error:", error);
  console.log("Data:", data);
}

run();
