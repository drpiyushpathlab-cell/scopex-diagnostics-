import type { LeadPayload } from "@/lib/validation";

const insforgeBaseUrl = process.env.INSFORGE_BASE_URL ?? process.env.NEXT_PUBLIC_INSFORGE_URL;
const insforgeAnonKey = process.env.INSFORGE_ANON_KEY ?? process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;
const leadsTable = process.env.INSFORGE_LEADS_TABLE ?? "leads";

type InsForgeResponse<T> = {
  data: T | null;
  error: Error | null;
};

async function insforgeRequest<T>(table: string, query: URLSearchParams, init: RequestInit = {}): Promise<InsForgeResponse<T>> {
  if (!insforgeBaseUrl || !insforgeAnonKey) {
    throw new Error("Missing InsForge credentials.");
  }

  const response = await fetch(`${insforgeBaseUrl.replace(/\/$/, "")}/api/database/records/${table}?${query.toString()}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${insforgeAnonKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers ?? {})
    },
    cache: "no-store"
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    return { data: null, error: new Error(data?.message || data?.error || response.statusText) };
  }

  return { data, error: null };
}

export async function storeLeadInInsForge(payload: LeadPayload) {
  const now = new Date();
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
  const lookup = new URLSearchParams({
    select: "id,created_at",
    mobile_number: `eq.${payload.mobileNumber}`,
    lead_type: `eq.${payload.leadType}`,
    created_at: `gte.${dayStart}`,
    limit: "1"
  });

  const existing = await insforgeRequest<Array<{ id: string; created_at: string }>>(leadsTable, lookup);
  if (existing.error) {
    throw new Error(`Duplicate check failed: ${existing.error.message}`);
  }

  if (existing.data && existing.data.length > 0) {
    return { duplicate: true, record: existing.data[0] };
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

  const create = await insforgeRequest<Array<{ id: string }>>(
    leadsTable,
    new URLSearchParams({ select: "id" }),
    {
      method: "POST",
      body: JSON.stringify(insertPayload)
    }
  );

  if (create.error) {
    throw new Error(`InsForge insert failed: ${create.error.message}`);
  }

  return { duplicate: false, record: create.data?.[0] ?? null };
}
