import crypto from "crypto";
import { Router } from "express";
import { z } from "zod";
import { asyncRoute } from "@/backend/src/lib/async-route";
import { requireAuth, type AuthedRequest } from "@/backend/src/middleware/auth";
import { insforge } from "@/backend/src/lib/insforge";
import { HttpError } from "@/backend/src/lib/http-error";
import { createVerificationToken, sendWelcomeAndVerificationEmail, sendAdminNotification } from "@/backend/src/services/email";

type LocalProfile = {
  id: string;
  user_id: string;
  full_name: string | null;
  mobile: string;
  email: string | null;
  dob: string | null;
  age: number | null;
  gender: string | null;
  address: string | null;
  city: string | null;
  pincode: string | null;
  preferred_collection_address: string | null;
  is_profile_complete: boolean;
  created_at: string;
  updated_at: string;
};

const localProfiles = new Map<string, LocalProfile>();

function canUseLocalFallback() {
  return process.env.NODE_ENV !== "production" || process.env.ALLOW_DEBUG_OTP === "true";
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeMobile(value: string | undefined | null) {
  return String(value || "").replace(/\D/g, "").slice(-10);
}

function isCompleteProfile(profile: Partial<LocalProfile>) {
  return Boolean(
    profile.full_name &&
      normalizeMobile(profile.mobile).length === 10 &&
      (profile.age || profile.dob) &&
      profile.gender &&
      profile.address &&
      profile.pincode
  );
}

function getLocalProfile(userId: string, mobile = "") {
  const existing = localProfiles.get(userId);
  if (existing) return existing;

  const created: LocalProfile = {
    id: crypto.randomUUID(),
    user_id: userId,
    full_name: null,
    mobile: normalizeMobile(mobile),
    email: null,
    dob: null,
    age: null,
    gender: null,
    address: null,
    city: null,
    pincode: null,
    preferred_collection_address: null,
    is_profile_complete: false,
    created_at: nowIso(),
    updated_at: nowIso()
  };
  localProfiles.set(userId, created);
  return created;
}

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
  preferredCollectionAddress: z.string().trim().optional(),
  medicalHistory: z.record(z.string(), z.unknown()).optional()
});

export const userRouter = Router();

userRouter.get(
  "/profile",
  requireAuth("patient"),
  asyncRoute(async (request: AuthedRequest, response) => {
    const auth = request.auth;
    if (!auth?.userId) throw new HttpError(401, "Patient session is missing.");

    const { data: profileData, error: profileError } = await insforge.database
      .from("user_profiles")
      .select("id, user_id, full_name, mobile, email, dob, age, gender, address, city, pincode, preferred_collection_address, is_profile_complete, created_at, updated_at")
      .eq("user_id", auth.userId)
      .maybeSingle();

    if (!profileError && profileData) {
      response.json({ profile: profileData });
      return;
    }

    const { data: userData, error: userError } = await insforge.database
      .from("users")
      .select("id, phone, mobile, email, role, patient_id, medical_history, patients(id, full_name, mobile, email)")
      .eq("id", auth.userId)
      .maybeSingle();

    if (userError) {
      if (canUseLocalFallback()) {
        response.json({ profile: getLocalProfile(auth.userId, auth.mobile || "") });
        return;
      }
      throw new HttpError(500, userError.message || "Unable to fetch profile.");
    }

    if (!userData) {
      if (canUseLocalFallback()) {
        response.json({ profile: getLocalProfile(auth.userId, auth.mobile || "") });
        return;
      }
      throw new HttpError(404, "Profile not found.");
    }

    const patient = Array.isArray((userData as any).patients) ? (userData as any).patients[0] : (userData as any).patients;
    const fallbackProfile: LocalProfile = {
      id: auth.patientId || auth.userId,
      user_id: auth.userId,
      full_name: patient?.full_name || null,
      mobile: normalizeMobile(patient?.mobile || (userData as any).mobile || (userData as any).phone || auth.mobile || ""),
      email: patient?.email || (userData as any).email || null,
      dob: null,
      age: null,
      gender: null,
      address: null,
      city: null,
      pincode: null,
      preferred_collection_address: null,
      is_profile_complete: false,
      created_at: nowIso(),
      updated_at: nowIso()
    };

    response.json({ profile: fallbackProfile });
  })
);

userRouter.patch(
  "/profile",
  requireAuth("patient"),
  asyncRoute(async (request: AuthedRequest, response) => {
    const auth = request.auth;
    if (!auth?.userId) throw new HttpError(401, "Patient session is missing.");
    const parsed = profileUpdateSchema.parse(request.body);

    const mobile = parsed.mobile ? normalizeMobile(parsed.mobile) : undefined;
    if (mobile !== undefined && mobile.length !== 10) {
      throw new HttpError(400, "Enter a valid 10 digit mobile number.");
    }

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

    const localExisting = getLocalProfile(auth.userId, auth.mobile || "");
    const completionCandidate = {
      ...localExisting,
      full_name: (payload.full_name as string | undefined) ?? localExisting.full_name,
      mobile: (payload.mobile as string | undefined) ?? localExisting.mobile,
      email: (payload.email as string | null | undefined) ?? localExisting.email,
      dob: (payload.dob as string | null | undefined) ?? localExisting.dob,
      age: (payload.age as number | null | undefined) ?? localExisting.age,
      gender: (payload.gender as string | null | undefined) ?? localExisting.gender,
      address: (payload.address as string | undefined) ?? localExisting.address,
      city: (payload.city as string | null | undefined) ?? localExisting.city,
      pincode: (payload.pincode as string | undefined) ?? localExisting.pincode,
      preferred_collection_address:
        (payload.preferred_collection_address as string | null | undefined) ?? localExisting.preferred_collection_address
    };
    payload.is_profile_complete = isCompleteProfile(completionCandidate);

    const { data: existing, error: existingError } = await insforge.database
      .from("user_profiles")
      .select("id, email")
      .eq("user_id", auth.userId)
      .maybeSingle();

    if (existingError && !canUseLocalFallback()) {
      throw new HttpError(500, existingError.message || "Unable to check profile.");
    }

    if (!existingError) {
      const query = existing
        ? insforge.database.from("user_profiles").update(payload).eq("user_id", auth.userId)
        : insforge.database.from("user_profiles").insert({ ...payload, mobile: mobile || auth.mobile || localExisting.mobile });

      const { data, error } = await query
        .select("id, user_id, full_name, mobile, email, dob, age, gender, address, city, pincode, preferred_collection_address, is_profile_complete, created_at, updated_at")
        .single();

      if (!error && data) {
        const savedEmail = String((data as { email?: string | null }).email || "").trim().toLowerCase();
        const previousEmail = String((existing as { email?: string | null } | null)?.email || "").trim().toLowerCase();
        if (savedEmail && savedEmail !== previousEmail) {
          const token = createVerificationToken();
          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
          await insforge.database.from("email_verifications").insert({
            user_id: auth.userId,
            email: savedEmail,
            token,
            expires_at: expiresAt
          });
          const verificationUrl = `${process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_ORIGIN || "https://www.scopexdiagnostics.in"}/api/auth/verify-email?token=${token}`;
          void sendWelcomeAndVerificationEmail({
            to: savedEmail,
            name: (data as { full_name?: string | null }).full_name,
            verificationUrl,
            userId: auth.userId
          });
          void sendAdminNotification("admin_new_user", "New ScopeX user email added", {
            userId: auth.userId,
            name: (data as { full_name?: string | null }).full_name || "",
            email: savedEmail,
            mobile: (data as { mobile?: string | null }).mobile || auth.mobile || ""
          });
        }
        response.json({ success: true, profile: data });
        return;
      }

      if (!canUseLocalFallback()) {
        throw new HttpError(500, error?.message || "Unable to update profile.");
      }
    }

    const updated: LocalProfile = {
      ...localExisting,
      ...completionCandidate,
      is_profile_complete: Boolean(payload.is_profile_complete),
      updated_at: nowIso()
    };
    localProfiles.set(auth.userId, updated);
    response.json({ success: true, profile: updated });
  })
);


