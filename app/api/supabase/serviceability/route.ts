import { NextResponse } from "next/server";
import { getSupabaseAnonServerClient, hasSupabasePublicConfig } from "@/lib/supabase";
import { pincodeSchema } from "@/lib/supabase-booking";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    if (!hasSupabasePublicConfig()) {
      return NextResponse.json({ success: false, available: false, message: "Supabase public configuration is not set." }, { status: 503 });
    }

    const url = new URL(request.url);
    const parsed = pincodeSchema.safeParse(url.searchParams.get("pincode") || "");
    if (!parsed.success) {
      return NextResponse.json({ success: false, available: false, message: parsed.error.issues[0]?.message || "Invalid pincode." }, { status: 400 });
    }

    const supabase = getSupabaseAnonServerClient();
    const { data, error } = await supabase
      .from("service_areas")
      .select("id, city, state, pincode, home_collection_enabled, centre_visit_enabled, active")
      .eq("pincode", parsed.data)
      .eq("active", true)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return NextResponse.json({
        success: true,
        available: false,
        message: "Service availability is not confirmed for this pincode yet. Contact ScopeX to check coverage."
      });
    }

    return NextResponse.json({
      success: true,
      available: true,
      serviceArea: data,
      message: "Service is available in this area."
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to check serviceability.";
    return NextResponse.json({ success: false, available: false, message }, { status: 500 });
  }
}
