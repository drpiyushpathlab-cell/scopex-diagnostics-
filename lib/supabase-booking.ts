import { z } from "zod";

export const indianMobileSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number.");

export const pincodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Enter a valid 6-digit pincode.");

export const bookingItemSchema = z.object({
  type: z.enum(["test", "package"]),
  id: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(20).default(1)
});

export type SupabaseCatalogItem = {
  id: string;
  type: "test" | "package";
  slug: string;
  name: string;
  description: string | null;
  price: number;
  mrp: number;
  referencePrice?: number | null;
  category?: string | null;
  categorySlug?: string | null;
  source?: "supabase_prd" | "supabase_legacy" | "local_fallback";
  active: boolean;
};

export function normalizeMoney(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.round(amount * 100) / 100 : 0;
}

export function calculatePayablePaise(amountRupees: number) {
  return Math.max(100, Math.round(amountRupees * 100));
}

export function getRequestOrigin(headers: Headers) {
  return headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "https://www.scopexdiagnostics.in";
}

export function getUtmPayload(input: Record<string, unknown> | null | undefined) {
  if (!input || typeof input !== "object") return {};

  return {
    utm_source: typeof input.utm_source === "string" ? input.utm_source : null,
    utm_medium: typeof input.utm_medium === "string" ? input.utm_medium : null,
    utm_campaign: typeof input.utm_campaign === "string" ? input.utm_campaign : null,
    utm_term: typeof input.utm_term === "string" ? input.utm_term : null,
    utm_content: typeof input.utm_content === "string" ? input.utm_content : null,
    gclid: typeof input.gclid === "string" ? input.gclid : null,
    fbclid: typeof input.fbclid === "string" ? input.fbclid : null,
    landing_page: typeof input.landing_page === "string" ? input.landing_page : null,
    referrer: typeof input.referrer === "string" ? input.referrer : null
  };
}
