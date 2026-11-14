import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const publicUrl =
  process.env.NEXT_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL;

const publicAnonKey =
  process.env.NEXT_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

let browserClient: SupabaseClient | null = null;

export function hasSupabasePublicConfig() {
  return Boolean(publicUrl && publicAnonKey);
}

export function getSupabaseBrowserClient() {
  if (!publicUrl || !publicAnonKey) {
    throw new Error("Missing NEXT_SUPABASE_URL or NEXT_SUPABASE_PUBLISHABLE_KEY.");
  }

  if (!browserClient) {
    browserClient = createClient(publicUrl, publicAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
  }

  return browserClient;
}

export function getSupabaseAnonServerClient() {
  if (!publicUrl || !publicAnonKey) {
    throw new Error("Missing NEXT_SUPABASE_URL or NEXT_SUPABASE_PUBLISHABLE_KEY.");
  }

  return createClient(publicUrl, publicAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
