import { authenticateSupabaseAdmin } from "@/lib/supabase-admin-auth";

export async function authenticateAdmin(email: string, password: string) {
  return authenticateSupabaseAdmin(email, password);
}
