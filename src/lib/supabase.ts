import { createClient } from "@supabase/supabase-js";
import { Database } from "./supabase.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.error("Supabase environment variables missing! GaitFlow requires a live database.");
}

export const supabase = createClient<Database>(
  supabaseUrl || "https://lrtlhvemfdkdsctnicwi.supabase.co",
  supabaseAnonKey || "sb_publishable_zJbfejfByt20C-JNvm8tpA_0A2vXJfK"
);

export function disableSupabase() {
  console.warn("disableSupabase called: database operation is enforced, ignoring request to disable.");
}

