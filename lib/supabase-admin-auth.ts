import { HttpError } from "@/backend/src/lib/http-error";
import { getSupabaseAnonServerClient } from "@/lib/supabase";
import { getSupabaseServiceClient } from "@/lib/supabase-server";

const ADMIN_ROLES = new Set([
  "super_admin",
  "admin",
  "manager",
  "booking_manager",
  "report_manager",
  "finance_manager",
  "customer_support"
]);

export function isSupabaseAdminRole(role: string): boolean {
  return ADMIN_ROLES.has(role);
}

export type SupabaseAdminUser = {
  id: string;
  email: string;
  role: string;
  name: string;
};

export async function authenticateSupabaseAdmin(email: string, password: string): Promise<SupabaseAdminUser> {
  const normalizedEmail = email.trim().toLowerCase();
  const { data: authData, error: authError } = await getSupabaseAnonServerClient().auth.signInWithPassword({
    email: normalizedEmail,
    password
  });

  if (authError || !authData.user || !authData.user.email) {
    throw new HttpError(401, "Invalid admin email or password.");
  }

  if (!authData.user.email_confirmed_at) {
    throw new HttpError(403, "Confirm the admin email before signing in.");
  }

  const { data: roleRow, error: roleError } = await getSupabaseServiceClient()
    .from("admin_roles")
    .select("role")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (roleError) {
    throw new HttpError(503, "Unable to verify admin permissions.");
  }

  if (!roleRow || !isSupabaseAdminRole(String(roleRow.role))) {
    throw new HttpError(403, "This account is not assigned an admin role.");
  }

  const metadataName = authData.user.user_metadata?.full_name;
  return {
    id: authData.user.id,
    email: authData.user.email,
    role: String(roleRow.role),
    name: typeof metadataName === "string" && metadataName.trim()
      ? metadataName.trim()
      : authData.user.email.split("@")[0]
  };
}
