import crypto from "crypto";
import { Router } from "express";
import { z } from "zod";
import { asyncRoute } from "@/backend/src/lib/async-route";
import { insforge } from "@/backend/src/lib/insforge";
import { HttpError } from "@/backend/src/lib/http-error";
import { requireAuth, type AuthedRequest } from "@/backend/src/middleware/auth";

type LocalFamilyMember = {
  id: string;
  user_id: string;
  name: string;
  age: number | null;
  dob: string | null;
  gender: string | null;
  relation: string;
  mobile: string | null;
  health_note: string | null;
  medical_history: Record<string, unknown>;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

const localFamilyMembers = new Map<string, LocalFamilyMember[]>();

function canUseLocalFallback() {
  return process.env.NODE_ENV !== "production" || process.env.ALLOW_DEBUG_OTP === "true";
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeMobile(value: string | undefined | null) {
  const mobile = String(value || "").replace(/\D/g, "").slice(-10);
  return mobile || null;
}

function getLocalList(userId: string) {
  const list = localFamilyMembers.get(userId) ?? [];
  localFamilyMembers.set(userId, list);
  return list;
}

const relationValues = ["Father", "Mother", "Wife", "Husband", "Son", "Daughter", "Self", "Other"] as const;

const familyMemberBaseSchema = z.object({
  name: z.string().trim().min(1),
  age: z.coerce.number().int().min(0).max(120).optional().nullable(),
  dob: z.string().optional().nullable(),
  gender: z.enum(["male", "female", "other", ""]).optional().default(""),
  relation: z.enum(relationValues).or(z.string().trim().min(1)),
  mobile: z.string().optional().nullable(),
  healthNote: z.string().trim().optional().nullable(),
  isDefault: z.boolean().optional().default(false),
  medicalHistory: z.record(z.string(), z.unknown()).optional().default({})
});

const addFamilyMemberSchema = familyMemberBaseSchema;
const updateFamilyMemberSchema = familyMemberBaseSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required."
});

export const familyRouter = Router();

async function unsetDefault(userId: string) {
  await insforge.database.from("family_members").update({ is_default: false, updated_at: nowIso() }).eq("user_id", userId);
  getLocalList(userId).forEach((member) => {
    member.is_default = false;
    member.updated_at = nowIso();
  });
}

familyRouter.post(
  "/add",
  requireAuth("patient"),
  asyncRoute(async (request: AuthedRequest, response) => {
    const auth = request.auth;
    const parsed = addFamilyMemberSchema.parse(request.body);
    if (!auth?.userId) throw new HttpError(401, "Patient session is missing.");

    const { count, error: countError } = await insforge.database
      .from("family_members")
      .select("id", { count: "exact", head: true })
      .eq("user_id", auth.userId);

    const localList = getLocalList(auth.userId);
    const effectiveCount = countError ? localList.length : count ?? 0;
    if (countError && !canUseLocalFallback()) {
      throw new HttpError(500, countError.message || "Unable to validate family member limit.");
    }
    if (effectiveCount >= 10) throw new HttpError(400, "You can add up to 10 family members only.");

    if (parsed.isDefault) await unsetDefault(auth.userId);

    const insertPayload = {
      user_id: auth.userId,
      name: parsed.name,
      age: parsed.age ?? null,
      dob: parsed.dob || null,
      gender: parsed.gender || null,
      relation: parsed.relation,
      mobile: normalizeMobile(parsed.mobile),
      health_note: parsed.healthNote || null,
      medical_history: parsed.medicalHistory,
      is_default: parsed.isDefault
    };

    const { data, error } = await insforge.database
      .from("family_members")
      .insert(insertPayload)
      .select("id, user_id, name, age, dob, gender, relation, mobile, health_note, medical_history, is_default, created_at, updated_at")
      .single();

    if (!error && data) {
      response.status(201).json({ success: true, familyMember: data });
      return;
    }

    if (!canUseLocalFallback()) throw new HttpError(500, error?.message || "Unable to add family member.");

    const localMember: LocalFamilyMember = {
      id: crypto.randomUUID(),
      ...insertPayload,
      created_at: nowIso(),
      updated_at: nowIso()
    };
    localList.unshift(localMember);
    response.status(201).json({ success: true, familyMember: localMember });
  })
);

familyRouter.patch(
  "/:id",
  requireAuth("patient"),
  asyncRoute(async (request: AuthedRequest, response) => {
    const auth = request.auth;
    const parsed = updateFamilyMemberSchema.parse(request.body);
    if (!auth?.userId) throw new HttpError(401, "Patient session is missing.");

    if (parsed.isDefault) await unsetDefault(auth.userId);

    const updatePayload: Record<string, unknown> = { updated_at: nowIso() };
    if (parsed.name !== undefined) updatePayload.name = parsed.name;
    if (parsed.age !== undefined) updatePayload.age = parsed.age ?? null;
    if (parsed.dob !== undefined) updatePayload.dob = parsed.dob || null;
    if (parsed.gender !== undefined) updatePayload.gender = parsed.gender || null;
    if (parsed.relation !== undefined) updatePayload.relation = parsed.relation;
    if (parsed.mobile !== undefined) updatePayload.mobile = normalizeMobile(parsed.mobile);
    if (parsed.healthNote !== undefined) updatePayload.health_note = parsed.healthNote || null;
    if (parsed.medicalHistory !== undefined) updatePayload.medical_history = parsed.medicalHistory;
    if (parsed.isDefault !== undefined) updatePayload.is_default = parsed.isDefault;

    const { data, error } = await insforge.database
      .from("family_members")
      .update(updatePayload)
      .eq("id", request.params.id)
      .eq("user_id", auth.userId)
      .select("id, user_id, name, age, dob, gender, relation, mobile, health_note, medical_history, is_default, created_at, updated_at")
      .single();

    if (!error && data) {
      response.json({ success: true, familyMember: data });
      return;
    }

    if (!canUseLocalFallback()) throw new HttpError(404, error?.message || "Family member not found.");

    const list = getLocalList(auth.userId);
    const member = list.find((item) => item.id === request.params.id);
    if (!member) throw new HttpError(404, "Family member not found.");
    Object.assign(member, updatePayload);
    response.json({ success: true, familyMember: member });
  })
);

familyRouter.delete(
  "/:id",
  requireAuth("patient"),
  asyncRoute(async (request: AuthedRequest, response) => {
    const auth = request.auth;
    if (!auth?.userId) throw new HttpError(401, "Patient session is missing.");

    const { error } = await insforge.database.from("family_members").delete().eq("id", request.params.id).eq("user_id", auth.userId);
    if (!error) {
      response.json({ success: true });
      return;
    }

    if (!canUseLocalFallback()) throw new HttpError(500, error.message || "Unable to delete family member.");

    localFamilyMembers.set(
      auth.userId,
      getLocalList(auth.userId).filter((member) => member.id !== request.params.id)
    );
    response.json({ success: true });
  })
);

familyRouter.post(
  "/:id/default",
  requireAuth("patient"),
  asyncRoute(async (request: AuthedRequest, response) => {
    const auth = request.auth;
    if (!auth?.userId) throw new HttpError(401, "Patient session is missing.");

    await unsetDefault(auth.userId);
    const { data, error } = await insforge.database
      .from("family_members")
      .update({ is_default: true, updated_at: nowIso() })
      .eq("id", request.params.id)
      .eq("user_id", auth.userId)
      .select("id, user_id, name, age, dob, gender, relation, mobile, health_note, medical_history, is_default, created_at, updated_at")
      .single();

    if (!error && data) {
      response.json({ success: true, familyMember: data });
      return;
    }

    if (!canUseLocalFallback()) throw new HttpError(404, error?.message || "Family member not found.");

    const member = getLocalList(auth.userId).find((item) => item.id === request.params.id);
    if (!member) throw new HttpError(404, "Family member not found.");
    member.is_default = true;
    member.updated_at = nowIso();
    response.json({ success: true, familyMember: member });
  })
);

familyRouter.get(
  "/list",
  requireAuth("patient"),
  asyncRoute(async (request: AuthedRequest, response) => {
    const auth = request.auth;
    if (!auth?.userId) throw new HttpError(401, "Patient session is missing.");

    const { data, error } = await insforge.database
      .from("family_members")
      .select("id, name, age, dob, gender, relation, mobile, health_note, medical_history, is_default, created_at, updated_at")
      .eq("user_id", auth.userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (!error) {
      response.json({ familyMembers: data ?? [] });
      return;
    }

    if (!canUseLocalFallback()) throw new HttpError(500, error.message || "Unable to fetch family members.");
    response.json({ familyMembers: getLocalList(auth.userId) });
  })
);


