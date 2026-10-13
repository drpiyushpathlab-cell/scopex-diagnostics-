import { getSupabaseServiceClient } from "@/lib/supabase";
import type { LeadPayload } from "@/lib/validation";

function startOfTodayIso() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString();
}

function leadEmail(payload: LeadPayload) {
  return payload.officialEmail || null;
}

export async function storeLeadInSupabase(payload: LeadPayload) {
  const supabase = getSupabaseServiceClient();
  const phone = payload.mobileNumber;
  const email = leadEmail(payload);
  const duplicateFilters = [`phone.eq.${phone}`, `mobile.eq.${phone}`, `mobile_number.eq.${phone}`];
  if (email) duplicateFilters.push(`email.eq.${email}`, `official_email.eq.${email}`);

  const { data: existing, error: lookupError } = await supabase
    .from("leads")
    .select("id, created_at")
    .eq("lead_type", payload.leadType)
    .gte("created_at", startOfTodayIso())
    .or(duplicateFilters.join(","))
    .limit(1);

  if (lookupError) throw new Error(lookupError.message || "Unable to check duplicate lead.");
  if ((existing ?? []).length > 0) return { duplicate: true };

  const { error } = await supabase.from("leads").insert({
    lead_type: payload.leadType,
    name: payload.name,
    phone,
    mobile: phone,
    mobile_number: phone,
    email,
    official_email: payload.officialEmail || null,
    city: payload.city || null,
    address: payload.address || null,
    status: "new",
    source: "website",
    metadata: payload
  });

  if (error) throw new Error(error.message || "Unable to save lead.");
  return { duplicate: false };
}
