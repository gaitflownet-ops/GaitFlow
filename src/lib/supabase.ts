import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Database } from "./supabase.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://lrtlhvemfdkdsctnicwi.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_zJbfejfByt20C-JNvm8tpA_0A2vXJfK";
export const isSupabaseConfigured = true;

if (!isSupabaseConfigured) {
  console.error("Supabase environment variables missing! GaitFlow requires a live database.");
}

const customFetch = (url: RequestInfo | URL, options?: RequestInit) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timeoutId));
};

export const supabase = createClient<Database>(
  supabaseUrl || "https://lrtlhvemfdkdsctnicwi.supabase.co",
  supabaseAnonKey || "sb_publishable_zJbfejfByt20C-JNvm8tpA_0A2vXJfK",
  {
    global: {
      fetch: customFetch
    }
  }
);

export function disableSupabase() {
  console.warn("disableSupabase called: database operation is enforced, ignoring request to disable.");
}

