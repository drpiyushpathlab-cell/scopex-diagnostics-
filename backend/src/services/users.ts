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

export async function upsertGooglePatientUser(params: {
  googleId: string;
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
}) {
  const email = params.email.trim().toLowerCase();
  if (!email) throw new HttpError(400, "Google account email is required.");

  const { data: googleUser, error: googleUserError } = await insforge.database
    .from("users")
    .select("id, phone, mobile, email, role, patient_id, google_id, avatar_url, auth_provider")
    .eq("google_id", params.googleId)
    .maybeSingle();

  if (googleUserError) {
    throw new HttpError(500, googleUserError.message || "Unable to check Google account.");
  }

  if (googleUser) {
    await ensureGoogleProfile(googleUser, params);
    return normalizePatientUser(googleUser, "");
  }

  const { data: existingUser, error: existingUserError } = await insforge.database
    .from("users")
    .select("id, phone, mobile, email, role, patient_id, google_id, avatar_url, auth_provider")
    .eq("email", email)
    .maybeSingle();

  if (existingUserError) {
    throw new HttpError(500, existingUserError.message || "Unable to check Google account.");
  }

  if (existingUser) {
    const { data: linkedUser, error: linkError } = await insforge.database
      .from("users")
      .update({
        google_id: params.googleId,
        email,
        avatar_url: params.avatarUrl || null,
        auth_provider: "google",
        updated_at: new Date().toISOString()
      })
      .eq("id", (existingUser as any).id)
      .select("id, phone, mobile, email, role, patient_id, google_id, avatar_url, auth_provider")
      .single();

    if (linkError || !linkedUser) {
      throw new HttpError(500, linkError?.message || "Unable to link Google account.");
    }

    await ensureGoogleProfile(linkedUser, params);
    return normalizePatientUser(linkedUser, "");
  }

  const { data: existingPatient, error: patientLookupError } = await insforge.database
    .from("patients")
    .select("id, full_name, mobile, email, google_id, avatar_url, auth_provider")
    .eq("email", email)
    .maybeSingle();

  if (patientLookupError) {
    throw new HttpError(500, patientLookupError.message || "Unable to check patient profile.");
  }

  let patientId = (existingPatient as any)?.id as string | undefined;
  if (patientId) {
    await insforge.database
      .from("patients")
      .update({
        google_id: params.googleId,
        avatar_url: params.avatarUrl || (existingPatient as any)?.avatar_url || null,
        auth_provider: "google",
        updated_at: new Date().toISOString()
      })
      .eq("id", patientId);
  } else {
    const { data: patient, error: patientError } = await insforge.database
      .from("patients")
      .insert({
        full_name: params.fullName || null,
        mobile: "",
        email,
        google_id: params.googleId,
        avatar_url: params.avatarUrl || null,
        auth_provider: "google"
      })
      .select("id")
      .single();

    if (patientError || !patient) {
      throw new HttpError(500, patientError?.message || "Unable to create patient profile.");
    }
    patientId = (patient as any).id;
  }

  const { data: user, error: userError } = await insforge.database
    .from("users")
    .insert({
      phone: null,
      email,
      role: "patient",
      patient_id: patientId,
      is_active: true,
      google_id: params.googleId,
      avatar_url: params.avatarUrl || null,
      auth_provider: "google"
    })
    .select("id, phone, mobile, email, role, patient_id, google_id, avatar_url, auth_provider")
    .single();

  if (userError || !user) {
    throw new HttpError(500, userError?.message || "Unable to create Google patient account.");
  }

  await ensureGoogleProfile(user, params);
  return normalizePatientUser(user, "");
}

async function ensureGoogleProfile(user: any, params: { email: string; fullName?: string | null; avatarUrl?: string | null; googleId: string }) {
  const { data: existingProfile, error: existingProfileError } = await insforge.database
    .from("user_profiles")
    .select("id, full_name, mobile, email, dob, age, gender, address, city, pincode, preferred_collection_address, is_profile_complete")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingProfileError) {
    throw new HttpError(500, existingProfileError.message || "Unable to check patient profile.");
  }

  const profile = existingProfile as any;
  const mobile = user.mobile || user.phone || profile?.mobile || "";
  const completionCandidate = {
    full_name: profile?.full_name || params.fullName || null,
    mobile,
    dob: profile?.dob || null,
    age: profile?.age ?? null,
    gender: profile?.gender || null,
    address: profile?.address || null,
    pincode: profile?.pincode || null
  };

  const payload = {
    user_id: user.id,
    full_name: completionCandidate.full_name,
    mobile,
    email: params.email.trim().toLowerCase() || profile?.email || null,
    dob: profile?.dob || null,
    age: profile?.age ?? null,
    gender: profile?.gender || null,
    address: profile?.address || null,
    city: profile?.city || null,
    pincode: profile?.pincode || null,
    preferred_collection_address: profile?.preferred_collection_address || null,
    avatar_url: params.avatarUrl || user.avatar_url || null,
    google_id: params.googleId,
    auth_provider: "google",
    is_profile_complete: Boolean(
      completionCandidate.full_name &&
        String(completionCandidate.mobile || "").replace(/\D/g, "").length === 10 &&
        (completionCandidate.age || completionCandidate.dob) &&
        completionCandidate.gender &&
        completionCandidate.address &&
        completionCandidate.pincode
    ),
    updated_at: new Date().toISOString()
  };

  const query = existingProfile
    ? insforge.database.from("user_profiles").update(payload).eq("user_id", user.id)
    : insforge.database.from("user_profiles").insert(payload);

  const { error } = await query.select("id").single();
  if (error) {
    throw new HttpError(500, error.message || "Unable to save Google patient profile.");
  }
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
