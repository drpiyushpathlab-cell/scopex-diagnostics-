import crypto from "crypto";
import { z } from "zod";
import { HttpError } from "@/backend/src/lib/http-error";
import { verifyAppToken, type AppJwtPayload } from "@/backend/src/lib/jwt";
import { getSupabaseServiceClient } from "@/lib/supabase";

type PatientUser = {
  id: string;
  mobile?: string | null;
  phone?: string | null;
  role?: string | null;
  patient_id?: string | null;
};

const localPatientUsers = new Map<string, Required<Pick<PatientUser, "id" | "mobile" | "role" | "patient_id">>>();

const profileSelect =
  "id, user_id, full_name, mobile, email, dob, age, gender, address, city, pincode, preferred_collection_address, google_id, avatar_url, auth_provider, is_profile_complete, created_at, updated_at";

const familySelect =
  "id, user_id, name, age, dob, gender, relation, mobile, health_note, medical_history, is_default, created_at, updated_at";

const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(1).optional(),
  mobile: z.string().min(10).optional(),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  dob: z.string().optional().nullable(),
  age: z.coerce.number().int().min(0).max(120).optional().nullable(),
  gender: z.enum(["male", "female", "other", ""]).optional(),
  address: z.string().trim().min(1).optional(),
  city: z.string().trim().optional(),
  pincode: z.string().trim().min(4).max(10).optional(),
  preferredCollectionAddress: z.string().trim().optional()
});

const familyMemberBaseSchema = z.object({
  name: z.string().trim().min(1),
  age: z.coerce.number().int().min(0).max(120).optional().nullable(),
  dob: z.string().optional().nullable(),
  gender: z.enum(["male", "female", "other", ""]).optional().default(""),
  relation: z.string().trim().min(1),
  mobile: z.string().optional().nullable(),
  healthNote: z.string().trim().optional().nullable(),
  isDefault: z.boolean().optional().default(false),
  medicalHistory: z.record(z.string(), z.unknown()).optional().default({})
});

export const addFamilyMemberSchema = familyMemberBaseSchema;
export const updateFamilyMemberSchema = familyMemberBaseSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required."
});

function nowIso() {
  return new Date().toISOString();
}

function normalizeMobile(value: string | undefined | null) {
  return String(value || "").replace(/\D/g, "").slice(-10);
}

function isCompleteProfile(profile: Record<string, unknown>) {
  return Boolean(
    profile.full_name &&
      normalizeMobile(profile.mobile as string | null).length === 10 &&
      (profile.age || profile.dob) &&
      profile.gender &&
      profile.address &&
      profile.pincode
  );
}

function getLocalPatientUser(mobile: string) {
  const existing = localPatientUsers.get(mobile);
  if (existing) return existing;

  const user = {
    id: crypto.randomUUID(),
    mobile,
    role: "patient",
    patient_id: crypto.randomUUID()
  };
  localPatientUsers.set(mobile, user);
  return user;
}

function serviceClient() {
  return getSupabaseServiceClient();
}

export function normalizePatientUser(user: PatientUser, fallbackMobile: string) {
  return {
    ...user,
    mobile: user?.mobile || user?.phone || fallbackMobile,
    phone: user?.phone || user?.mobile || fallbackMobile,
    role: user?.role || "patient"
  };
}

export async function upsertPatientUser(mobile: string) {
  const normalizedMobile = normalizeMobile(mobile);
  try {
    const supabase = serviceClient();
    const { data: existingUser, error: existingUserError } = await supabase
      .from("users")
      .select("id, phone, mobile, role, patient_id")
      .or(`phone.eq.${normalizedMobile},mobile.eq.${normalizedMobile}`)
      .maybeSingle();

    if (existingUserError) throw existingUserError;
    if (existingUser) return existingUser;

    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .insert({ full_name: null, mobile: normalizedMobile, email: null })
      .select("id")
      .single();

    if (patientError || !patient) throw patientError || new Error("Unable to create patient profile.");

    const { data: user, error: userError } = await supabase
      .from("users")
      .insert({
        phone: normalizedMobile,
        mobile: normalizedMobile,
        role: "patient",
        patient_id: patient.id,
        is_active: true,
        auth_provider: "mobile_otp"
      })
      .select("id, phone, mobile, role, patient_id")
      .single();

    if (userError || !user) throw userError || new Error("Unable to create patient user.");
    return user;
  } catch (error) {
    if (process.env.NODE_ENV !== "production" || process.env.ALLOW_DEBUG_OTP === "true") {
      console.warn("[Supabase] Patient upsert failed. Using local fallback.", error);
      return getLocalPatientUser(normalizedMobile);
    }
    throw new HttpError(500, error instanceof Error ? error.message : "Unable to create patient user.");
  }
}

export function requirePatientAuth(request: Request): AppJwtPayload {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) throw new HttpError(401, "Missing authorization token.");
  const payload = verifyAppToken(token);
  if (payload.role !== "patient") throw new HttpError(403, "Unauthorized.");
  if (!payload.userId) throw new HttpError(401, "Patient session is missing.");
  return payload;
}

export async function getPatientProfile(auth: AppJwtPayload) {
  const supabase = serviceClient();
  const { data: profileData, error: profileError } = await supabase
    .from("user_profiles")
    .select(profileSelect)
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (profileError) throw new HttpError(500, profileError.message || "Unable to fetch profile.");
  if (profileData) return profileData;

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id, phone, mobile, email, role, patient_id")
    .eq("id", auth.userId)
    .maybeSingle();

  if (userError) throw new HttpError(500, userError.message || "Unable to fetch user.");

  const fallbackProfile = {
    user_id: auth.userId,
    full_name: null,
    mobile: normalizeMobile((userData as PatientUser | null)?.mobile || (userData as PatientUser | null)?.phone || auth.mobile || ""),
    email: (userData as { email?: string | null } | null)?.email || null,
    dob: null,
    age: null,
    gender: null,
    address: null,
    city: null,
    pincode: null,
    preferred_collection_address: null,
    auth_provider: "mobile_otp",
    is_profile_complete: false,
    updated_at: nowIso()
  };

  const { data: createdProfile, error: createError } = await supabase
    .from("user_profiles")
    .insert(fallbackProfile)
    .select(profileSelect)
    .single();

  if (createError || !createdProfile) throw new HttpError(500, createError?.message || "Unable to create profile.");
  return createdProfile;
}

export async function updatePatientProfile(auth: AppJwtPayload, body: unknown) {
  const parsed = profileUpdateSchema.parse(body);
  const mobile = parsed.mobile ? normalizeMobile(parsed.mobile) : undefined;
  if (mobile !== undefined && mobile.length !== 10) throw new HttpError(400, "Enter a valid 10 digit mobile number.");

  const current = await getPatientProfile(auth);
  const payload: Record<string, unknown> = {
    user_id: auth.userId,
    updated_at: nowIso()
  };
  if (parsed.fullName !== undefined) payload.full_name = parsed.fullName;
  if (mobile !== undefined) payload.mobile = mobile;
  if (parsed.email !== undefined) payload.email = parsed.email || null;
  if (parsed.dob !== undefined) payload.dob = parsed.dob || null;
  if (parsed.age !== undefined) payload.age = parsed.age ?? null;
  if (parsed.gender !== undefined) payload.gender = parsed.gender || null;
  if (parsed.address !== undefined) payload.address = parsed.address;
  if (parsed.city !== undefined) payload.city = parsed.city || null;
  if (parsed.pincode !== undefined) payload.pincode = parsed.pincode;
  if (parsed.preferredCollectionAddress !== undefined) payload.preferred_collection_address = parsed.preferredCollectionAddress || null;

  payload.is_profile_complete = isCompleteProfile({ ...current, ...payload });

  const supabase = serviceClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .update(payload)
    .eq("user_id", auth.userId)
    .select(profileSelect)
    .single();

  if (error || !data) throw new HttpError(500, error?.message || "Unable to update profile.");

  const linkedMobile = normalizeMobile((data as { mobile?: string | null }).mobile || "");
  const userUpdate: Record<string, unknown> = { updated_at: nowIso() };
  if (linkedMobile) {
    userUpdate.mobile = linkedMobile;
    userUpdate.phone = linkedMobile;
  }
  if ((data as { email?: string | null }).email) userUpdate.email = (data as { email?: string | null }).email;
  await supabase.from("users").update(userUpdate).eq("id", auth.userId);

  if (auth.patientId) {
    const patientUpdate: Record<string, unknown> = {
      full_name: (data as { full_name?: string | null }).full_name || null,
      updated_at: nowIso()
    };
    if (linkedMobile) patientUpdate.mobile = linkedMobile;
    if ((data as { email?: string | null }).email) patientUpdate.email = (data as { email?: string | null }).email;
    await supabase.from("patients").update(patientUpdate).eq("id", auth.patientId);
  }

  return data;
}

async function unsetDefaultFamilyMember(userId: string) {
  await serviceClient().from("family_members").update({ is_default: false, updated_at: nowIso() }).eq("user_id", userId);
}

function familyPayload(userId: string, parsed: z.infer<typeof addFamilyMemberSchema> | z.infer<typeof updateFamilyMemberSchema>) {
  const payload: Record<string, unknown> = { user_id: userId, updated_at: nowIso() };
  if ("name" in parsed && parsed.name !== undefined) payload.name = parsed.name;
  if ("age" in parsed && parsed.age !== undefined) payload.age = parsed.age ?? null;
  if ("dob" in parsed && parsed.dob !== undefined) payload.dob = parsed.dob || null;
  if ("gender" in parsed && parsed.gender !== undefined) payload.gender = parsed.gender || null;
  if ("relation" in parsed && parsed.relation !== undefined) payload.relation = parsed.relation;
  if ("mobile" in parsed && parsed.mobile !== undefined) payload.mobile = normalizeMobile(parsed.mobile);
  if ("healthNote" in parsed && parsed.healthNote !== undefined) payload.health_note = parsed.healthNote || null;
  if ("medicalHistory" in parsed && parsed.medicalHistory !== undefined) payload.medical_history = parsed.medicalHistory;
  if ("isDefault" in parsed && parsed.isDefault !== undefined) payload.is_default = parsed.isDefault;
  return payload;
}

export async function listFamilyMembers(auth: AppJwtPayload) {
  const { data, error } = await serviceClient()
    .from("family_members")
    .select(familySelect)
    .eq("user_id", auth.userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new HttpError(500, error.message || "Unable to fetch family members.");
  return data ?? [];
}

export async function addFamilyMember(auth: AppJwtPayload, body: unknown) {
  const parsed = addFamilyMemberSchema.parse(body);
  const supabase = serviceClient();
  const { count, error: countError } = await supabase
    .from("family_members")
    .select("id", { count: "exact", head: true })
    .eq("user_id", auth.userId);

  if (countError) throw new HttpError(500, countError.message || "Unable to validate family member limit.");
  if ((count ?? 0) >= 10) throw new HttpError(400, "You can add up to 10 family members only.");
  if (parsed.isDefault) await unsetDefaultFamilyMember(auth.userId);

  const { data, error } = await supabase
    .from("family_members")
    .insert({ ...familyPayload(auth.userId, parsed), created_at: nowIso() })
    .select(familySelect)
    .single();

  if (error || !data) throw new HttpError(500, error?.message || "Unable to add family member.");
  return data;
}

export async function updateFamilyMember(auth: AppJwtPayload, id: string, body: unknown) {
  const parsed = updateFamilyMemberSchema.parse(body);
  if (parsed.isDefault) await unsetDefaultFamilyMember(auth.userId);

  const { data, error } = await serviceClient()
    .from("family_members")
    .update(familyPayload(auth.userId, parsed))
    .eq("id", id)
    .eq("user_id", auth.userId)
    .select(familySelect)
    .single();

  if (error || !data) throw new HttpError(404, error?.message || "Family member not found.");
  return data;
}

export async function deleteFamilyMember(auth: AppJwtPayload, id: string) {
  const { error } = await serviceClient().from("family_members").delete().eq("id", id).eq("user_id", auth.userId);
  if (error) throw new HttpError(500, error.message || "Unable to delete family member.");
}

export async function makeDefaultFamilyMember(auth: AppJwtPayload, id: string) {
  await unsetDefaultFamilyMember(auth.userId);
  return updateFamilyMember(auth, id, { isDefault: true });
}
