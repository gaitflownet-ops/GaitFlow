import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Database } from "./supabase.types";


const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Critical Security Warning: Supabase environment variables missing (VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY).");
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient<Database>(
  supabaseUrl || "",
  supabaseAnonKey || "",
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

export function disableSupabase() {
  console.warn("disableSupabase called: database operation is enforced, ignoring request to disable.");
}


