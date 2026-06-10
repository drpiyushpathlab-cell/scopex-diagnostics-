import { insforge } from "@/backend/src/lib/insforge";
import { HttpError } from "@/backend/src/lib/http-error";
import crypto from "crypto";

type LocalPatientUser = {
  id: string;
  mobile: string;
  phone?: string;
  role: "patient";
  patient_id: string;
};

const localPatientUsers = new Map<string, LocalPatientUser>();

function canUseLocalUserFallback() {
  return process.env.NODE_ENV !== "production" || process.env.ALLOW_DEBUG_OTP === "true";
}

function getLocalPatientUser(mobile: string) {
  const existing = localPatientUsers.get(mobile);
  if (existing) return existing;

  const user: LocalPatientUser = {
    id: crypto.randomUUID(),
    mobile,
    role: "patient",
    patient_id: crypto.randomUUID()
  };
  localPatientUsers.set(mobile, user);
  return user;
}

export function normalizePatientUser(user: any, fallbackMobile: string) {
  return {
    ...user,
    mobile: user?.mobile || user?.phone || fallbackMobile,
    phone: user?.phone || user?.mobile || fallbackMobile,
    role: user?.role || "patient"
  };
}

export async function findUserByMobile(mobile: string) {
  const { data, error } = await insforge.database
    .from("users")
    .select("id, phone, mobile, role, patient_id")
    .eq("phone", mobile)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, error.message || "Unable to fetch user.");
  }

  return data;
}

export async function upsertPatientUser(mobile: string) {
  let existingUser;
  try {
    existingUser = await findUserByMobile(mobile);
  } catch (error) {
    if (canUseLocalUserFallback()) {
      console.warn(
        `[User] InsForge user lookup failed. Using local patient fallback. ${
          error instanceof Error ? error.message : ""
        }`.trim()
      );
      return getLocalPatientUser(mobile);
    }
    throw error;
  }
  if (existingUser) return existingUser;

  const { data: patient, error: patientError } = await insforge.database
    .from("patients")
    .insert({
      full_name: null,
      mobile,
      email: null
    })
    .select("id")
    .single();

  if (patientError || !patient) {
    if (canUseLocalUserFallback()) {
      console.warn(`[User] InsForge patient insert failed. Using local patient fallback. ${patientError?.message ?? ""}`.trim());
      return getLocalPatientUser(mobile);
    }
    throw new HttpError(500, patientError?.message || "Unable to create patient profile.");
  }

  const { data: user, error: userError } = await insforge.database
    .from("users")
    .insert({
      phone: mobile,
      role: "patient",
      patient_id: patient.id,
      is_active: true
    })
    .select("id, phone, mobile, role, patient_id")
    .single();

  if (userError || !user) {
    if (canUseLocalUserFallback()) {
      console.warn(`[User] InsForge user insert failed. Using local patient fallback. ${userError?.message ?? ""}`.trim());
      return getLocalPatientUser(mobile);
    }
    throw new HttpError(500, userError?.message || "Unable to create patient user.");
  }

  return user;
}
