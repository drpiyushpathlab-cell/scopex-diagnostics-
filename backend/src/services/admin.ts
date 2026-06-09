import { insforge } from "@/backend/src/lib/insforge";
import { HttpError } from "@/backend/src/lib/http-error";
import { verifyPassword } from "@/backend/src/lib/password";

export async function authenticateAdmin(email: string, password: string) {
  const { data, error } = await insforge.database
    .from("admins")
    .select("id, email, role, password_hash, is_active")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (error) {
    throw new HttpError(500, error.message || "Unable to validate admin login.");
  }

  if (!data?.is_active) {
    throw new HttpError(401, "Admin account is inactive.");
  }

  if (!data.password_hash || !verifyPassword(password, data.password_hash)) {
    throw new HttpError(401, "Invalid admin credentials.");
  }

  return data;
}
