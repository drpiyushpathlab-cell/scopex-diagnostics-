import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { bookingItemSchema, getUtmPayload, indianMobileSchema, normalizeMoney, pincodeSchema } from "@/lib/supabase-booking";

export const runtime = "nodejs";

const bookingSchema = z.object({
  sessionId: z.string().trim().min(8).max(160),
  patient: z.object({
    fullName: z.string().trim().min(2),
    mobile: indianMobileSchema,
    email: z.string().trim().email().optional().or(z.literal("")),
    age: z.coerce.number().int().min(0).max(125).optional(),
    gender: z.string().trim().max(40).optional()
  }),
  collectionType: z.enum(["HOME_COLLECTION", "CENTRE_VISIT"]),
  serviceAreaId: z.string().uuid().optional(),
  centreId: z.string().uuid().optional(),
  slotHoldId: z.string().uuid(),
  pincode: pincodeSchema,
  city: z.string().trim().min(2),
  address: z.string().trim().min(5).optional(),
  landmark: z.string().trim().max(160).optional(),
  items: z.array(bookingItemSchema).min(1),
  attribution: z.record(z.string(), z.unknown()).optional()
}).refine((value) => value.collectionType === "CENTRE_VISIT" || value.address, {
  path: ["address"],
  message: "Address is required for home collection."
});

async function loadPricedItems(
  supabase: ReturnType<typeof getSupabaseServiceClient>,
  items: z.infer<typeof bookingItemSchema>[]
) {
  const testIds = items.filter((item) => item.type === "test").map((item) => item.id);
  const packageIds = items.filter((item) => item.type === "package").map((item) => item.id);

  const [testsResult, packagesResult] = await Promise.all([
    testIds.length
      ? supabase.from("tests").select("id, name, price, discounted_price, active").in("id", testIds).eq("active", true)
      : Promise.resolve({ data: [], error: null }),
    packageIds.length
      ? supabase.from("packages").select("id, name, regular_price, selling_price, active").in("id", packageIds).eq("active", true)
      : Promise.resolve({ data: [], error: null })
  ]);

  if (testsResult.error) throw testsResult.error;
  if (packagesResult.error) throw packagesResult.error;

  const testsById = new Map((testsResult.data || []).map((item) => [item.id, item]));
  const packagesById = new Map((packagesResult.data || []).map((item) => [item.id, item]));

  return items.map((requested) => {
    if (requested.type === "test") {
      const test = testsById.get(requested.id);
      if (!test) throw new Error("One or more selected tests are unavailable.");
      const unitPrice = normalizeMoney(test.discounted_price || test.price);
      return {
        item_type: "test",
        item_id: requested.id,
        item_name: test.name,
        quantity: requested.quantity,
        unit_price: unitPrice,
        line_total: unitPrice * requested.quantity
      };
    }

    const packageItem = packagesById.get(requested.id);
    if (!packageItem) throw new Error("One or more selected packages are unavailable.");
    const unitPrice = normalizeMoney(packageItem.selling_price);
    return {
      item_type: "package",
      item_id: requested.id,
      item_name: packageItem.name,
      quantity: requested.quantity,
      unit_price: unitPrice,
      line_total: unitPrice * requested.quantity
    };
  });
}

export async function POST(request: Request) {
  try {
    const parsed = bookingSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: parsed.error.issues[0]?.message || "Invalid booking request." }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();
    const serviceQuery = supabase
      .from("service_areas")
      .select("id, pincode, city, active, home_collection_enabled, centre_visit_enabled")
      .eq("pincode", parsed.data.pincode)
      .eq("active", true);

    const { data: serviceArea, error: serviceError } = parsed.data.serviceAreaId
      ? await serviceQuery.eq("id", parsed.data.serviceAreaId).maybeSingle()
      : await serviceQuery.maybeSingle();

    if (serviceError) throw serviceError;
    if (!serviceArea) {
      return NextResponse.json({ success: false, message: "Service is not available for this pincode yet." }, { status: 400 });
    }
    if (parsed.data.collectionType === "HOME_COLLECTION" && !serviceArea.home_collection_enabled) {
      return NextResponse.json({ success: false, message: "Home collection is not available for this pincode." }, { status: 400 });
    }
    if (parsed.data.collectionType === "CENTRE_VISIT" && !serviceArea.centre_visit_enabled) {
      return NextResponse.json({ success: false, message: "Centre visit is not available for this pincode." }, { status: 400 });
    }

    const pricedItems = await loadPricedItems(supabase, parsed.data.items);
    const subtotal = pricedItems.reduce((sum, item) => sum + Number(item.line_total), 0);
    const discountTotal = 0;
    const payableAmount = subtotal - discountTotal;

    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .upsert(
        {
          full_name: parsed.data.patient.fullName,
          mobile: parsed.data.patient.mobile,
          email: parsed.data.patient.email || null,
          age: parsed.data.patient.age || null,
          gender: parsed.data.patient.gender || null
        },
        { onConflict: "mobile" }
      )
      .select("id")
      .single();

    if (patientError) throw patientError;

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        patient_id: patient.id,
        collection_type: parsed.data.collectionType,
        service_area_id: serviceArea.id,
        centre_id: parsed.data.centreId || null,
        booking_status: "PENDING_PAYMENT",
        payment_status: "PENDING",
        address: parsed.data.address || null,
        landmark: parsed.data.landmark || null,
        city: parsed.data.city,
        pincode: parsed.data.pincode,
        subtotal,
        discount_total: discountTotal,
        payable_amount: payableAmount
      })
      .select("id, booking_number, payable_amount")
      .single();

    if (bookingError) throw bookingError;

    const { error: itemsError } = await supabase.from("booking_items").insert(
      pricedItems.map((item) => ({
        booking_id: booking.id,
        ...item
      }))
    );
    if (itemsError) throw itemsError;

    const { error: convertError } = await supabase.rpc("convert_slot_hold", {
      p_hold_id: parsed.data.slotHoldId,
      p_booking_id: booking.id
    });
    if (convertError) throw convertError;

    const attribution = getUtmPayload(parsed.data.attribution);
    if (Object.keys(attribution).length) {
      await supabase.from("marketing_attribution").insert({
        booking_id: booking.id,
        session_id: parsed.data.sessionId,
        ...attribution
      });
    }

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create booking.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
