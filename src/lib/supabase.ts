import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Database } from "./supabase.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

function createNoopResponse<T>(data: T) {
  return Promise.resolve({ data, error: null, status: 200, statusText: "OK" });
}

const noopQuery = {
  select: () => createNoopResponse(null),
  maybeSingle: () => createNoopResponse(null),
  single: () => createNoopResponse(null),
  insert: () => noopQuery,
  update: () => noopQuery,
  delete: () => noopQuery,
  upsert: () => noopQuery,
  eq: () => noopQuery,
  order: () => noopQuery,
  limit: () => noopQuery,
};

const noopChannel = {
  on: () => noopChannel,
  subscribe: async () => ({ data: null, error: null, status: 200, statusText: "OK" }),
};

const noopAuth = {
  getSession: async () => ({ data: { session: null }, error: null, status: 200, statusText: "OK" }),
  onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } }, error: null }),
  signInWithPassword: () => createNoopResponse(null),
  signUp: () => createNoopResponse(null),
  signOut: () => createNoopResponse(null),
  getUser: async () => ({ data: { user: null }, error: null, status: 200, statusText: "OK" }),
  setAuth: () => {},
};

const noopSupabase: SupabaseClient<Database> = {
  auth: noopAuth,
  from: () => noopQuery as any,
  channel: () => noopChannel as any,
  removeChannel: async () => ({}),
  storage: () => ({}) as any,
  functions: () => ({}) as any,
} as any;

export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : noopSupabase;

if (!isSupabaseConfigured) {
  console.warn(
    "Supabase environment variables missing. Running in fallback mode without a live database.",
  );
}
