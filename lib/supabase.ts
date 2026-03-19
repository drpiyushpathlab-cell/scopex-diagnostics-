import { createClient } from "@supabase/supabase-js";
import type { LeadPayload } from "@/lib/validation";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const leadsTable = process.env.SUPABASE_LEADS_TABLE ?? "leads";

function getClient() {
  if (!supabaseUrl || !serviceKey) {
    throw new Error("Missing Supabase credentials.");
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

export async function storeLeadInSupabase(payload: LeadPayload) {
  const supabase = getClient();
  const now = new Date();
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();

  const { data: existing, error: existingError } = await supabase
    .from(leadsTable)
    .select("id, created_at")
    .eq("mobile_number", payload.mobileNumber)
    .eq("lead_type", payload.leadType)
    .gte("created_at", dayStart)
    .limit(1);

  if (existingError) {
    throw new Error(`Duplicate check failed: ${existingError.message}`);
  }
  if (existing && existing.length > 0) {
    return { duplicate: true, record: existing[0] };
  }

  const insertPayload = {
    lead_type: payload.leadType,
    name: payload.name,
    age: payload.age ?? null,
    gender: payload.gender ?? null,
    mobile_number: payload.mobileNumber,
    city: payload.city ?? null,
    address: payload.address ?? null,
    preferred_time: payload.preferredTime ?? null,
    purpose: payload.purpose ?? null,
    source: "website",
    created_at: now.toISOString()
  };

  const { data, error } = await supabase.from(leadsTable).insert(insertPayload).select("id").single();
  if (error) {
    throw new Error(`Supabase insert failed: ${error.message}`);
  }

  return { duplicate: false, record: data };
}
