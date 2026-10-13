import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

const holdSchema = z.object({
  slotId: z.string().uuid(),
  sessionId: z.string().trim().min(8).max(160),
  holdMinutes: z.coerce.number().int().min(3).max(20).default(10)
});

export async function POST(request: Request) {
  try {
    const parsed = holdSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: parsed.error.issues[0]?.message || "Invalid slot hold request." }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase.rpc("hold_collection_slot", {
      p_slot_id: parsed.data.slotId,
      p_session_id: parsed.data.sessionId,
      p_hold_minutes: parsed.data.holdMinutes
    });

    if (error) throw error;

    return NextResponse.json({ success: true, hold: Array.isArray(data) ? data[0] : data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to reserve this slot.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
