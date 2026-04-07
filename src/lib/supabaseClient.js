import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigError = !supabaseUrl || !supabaseAnonKey
  ? "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY."
  : null;

let supabaseClientInstance = null;

const createSupabaseBrowserClient = () =>
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

export const getSupabaseClient = () => {
  if (supabaseConfigError) {
    return null;
  }

  if (!supabaseClientInstance) {
    supabaseClientInstance = createSupabaseBrowserClient();
  }

  return supabaseClientInstance;
};

export const supabase = getSupabaseClient();
