import type { LeadPayload } from "@/lib/validation";

type LeadEndpoint = "/api/leads" | "/api/contact" | "/api/health-advisor" | "/api/enquiry";

export async function submitLead(payload: LeadPayload, endpoint: LeadEndpoint = "/api/leads") {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({ message: "Invalid server response." }));

  if (!response.ok) {
    throw new Error(data?.message || "Unable to submit form. Please try again.");
  }

  return data as { success?: boolean; message?: string; warnings?: string[] };
}

