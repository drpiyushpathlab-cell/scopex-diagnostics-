import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAnonServerClient, hasSupabasePublicConfig } from "@/lib/supabase";

export const runtime = "nodejs";

const slotsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  serviceAreaId: z.string().uuid().optional(),
  centreId: z.string().uuid().optional()
}).refine((value) => value.serviceAreaId || value.centreId, {
  message: "serviceAreaId or centreId is required."
});

export async function GET(request: Request) {
  try {
    if (!hasSupabasePublicConfig()) {
      return NextResponse.json({ success: false, message: "Supabase public configuration is not set." }, { status: 503 });
    }

    const url = new URL(request.url);
    const parsed = slotsQuerySchema.safeParse({
      date: url.searchParams.get("date") || "",
      serviceAreaId: url.searchParams.get("serviceAreaId") || undefined,
      centreId: url.searchParams.get("centreId") || undefined
    });

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: parsed.error.issues[0]?.message || "Invalid slot query." }, { status: 400 });
    }

    const supabase = getSupabaseAnonServerClient();
    let query = supabase
      .from("collection_slots")
      .select("id, service_area_id, centre_id, date, start_time, end_time, capacity, booked_count, hold_count, active")
      .eq("date", parsed.data.date)
      .eq("active", true)
      .order("start_time");

    if (parsed.data.serviceAreaId) query = query.eq("service_area_id", parsed.data.serviceAreaId);
    if (parsed.data.centreId) query = query.eq("centre_id", parsed.data.centreId);

    const { data, error } = await query;
    if (error) throw error;

    const slots = (data || []).map((slot) => {
      const availableCount = Math.max(0, Number(slot.capacity) - Number(slot.booked_count) - Number(slot.hold_count));
      return {
        ...slot,
        availableCount,
        status: availableCount > 0 ? "AVAILABLE" : "FULL"
      };
    });

    return NextResponse.json({ success: true, slots });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load slots.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
