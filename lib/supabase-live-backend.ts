import { z } from "zod";
import { HttpError } from "@/backend/src/lib/http-error";
import type { AppJwtPayload } from "@/backend/src/lib/jwt";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { getSupabaseServiceClient } from "@/lib/supabase";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const legacyBookingSchema = z.object({
  customer: z.object({
    fullName: z.string().trim().min(2),
    phone: z.string().trim().min(10),
    email: z.string().trim().optional().or(z.literal("")),
    city: z.string().trim().min(2),
    address: z.string().trim().min(5),
    preferredDate: z.string().trim().min(1),
    preferredTime: z.string().trim().min(1)
  }),
  bookingPatients: z.array(z.object({
    patientId: z.string().optional(),
    patientType: z.string().optional(),
    familyMemberId: z.string().nullable().optional(),
    name: z.string().trim().min(1),
    relation: z.string().trim().optional(),
    age: z.union([z.string(), z.number()]).optional(),
    dob: z.string().optional(),
    gender: z.string().optional(),
    mobile: z.string().optional(),
    tests: z.array(z.any()).optional()
  })).optional(),
  items: z.array(z.any()).min(1),
  quote: z.object({
    subtotal: z.coerce.number().default(0),
    realPriceSubtotal: z.coerce.number().optional(),
    discountTotal: z.coerce.number().default(0),
    bundleSaving: z.coerce.number().optional(),
    collectionCharge: z.coerce.number().optional(),
    payableAmount: z.coerce.number().min(0),
    appliedOffers: z.array(z.any()).optional()
  }),
  paymentMethod: z.enum(["online", "cod"]).default("online")
});

const reportUploadSchema = z.object({
  bookingId: z.string().uuid(),
  bookingCode: z.string().optional().default(""),
  patientName: z.string().min(1),
  mobileNumber: z.string().min(10),
  files: z.array(z.object({
    fileName: z.string().min(1),
    fileSize: z.coerce.number().max(10 * 1024 * 1024),
    mimeType: z.literal("application/pdf"),
    fileData: z.string().min(1)
  })).min(1).max(10)
});

const paymentVerifySchema = z.object({
  bookingId: z.string().uuid(),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1)
});

function normalizeMobile(value: string | undefined | null) {
  return String(value || "").replace(/\D/g, "").slice(-10);
}

function isUuid(value: unknown) {
  return typeof value === "string" && uuidRegex.test(value);
}

function bookingCode() {
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `SX${new Date().getFullYear()}${Date.now().toString().slice(-6)}${suffix}`;
}

function firstPatient(parsed: z.infer<typeof legacyBookingSchema>) {
  return parsed.bookingPatients?.[0] || {
    name: parsed.customer.fullName,
    age: "",
    dob: "",
    gender: "",
    mobile: parsed.customer.phone,
    relation: "Self",
    patientType: "self"
  };
}

function itemQuantity(item: any) {
  const quantity = Number(item?.quantity || 1);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
}

function itemKind(item: any) {
  return item?.kind === "package" || item?.type === "package" ? "package" : "test";
}

export async function createSupabaseLegacyBooking(auth: AppJwtPayload, body: unknown) {
  const parsed = legacyBookingSchema.parse(body);
  const supabase = getSupabaseServiceClient();
  const patientInput = firstPatient(parsed);
  const mobile = normalizeMobile(parsed.customer.phone || patientInput.mobile);
  if (mobile.length !== 10) throw new HttpError(400, "Enter a valid 10-digit mobile number.");

  const { data: existingPatient, error: patientLookupError } = await supabase
    .from("patients")
    .select("id")
    .eq("mobile", mobile)
    .maybeSingle();
  if (patientLookupError) throw new HttpError(500, patientLookupError.message || "Unable to check patient.");

  const patientPayload = {
    auth_user_id: isUuid(auth.userId) ? auth.userId : null,
    name: patientInput.name || parsed.customer.fullName,
    full_name: patientInput.name || parsed.customer.fullName,
    mobile,
    email: parsed.customer.email || null,
    age: patientInput.age ? Number(patientInput.age) || null : null,
    gender: patientInput.gender || null,
    updated_at: new Date().toISOString()
  };

  const patientResult = existingPatient
    ? await supabase.from("patients").update(patientPayload).eq("id", existingPatient.id).select("id").single()
    : await supabase.from("patients").insert(patientPayload).select("id").single();

  if (patientResult.error || !patientResult.data) {
    throw new HttpError(500, patientResult.error?.message || "Unable to save patient.");
  }

  const subtotal = Number(parsed.quote.realPriceSubtotal ?? parsed.quote.subtotal ?? 0);
  const discountTotal = Number(parsed.quote.discountTotal || parsed.quote.bundleSaving || 0);
  const collectionCharge = Number(parsed.quote.collectionCharge || 0);
  const payableAmount = Number(parsed.quote.payableAmount);
  const code = bookingCode();

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      booking_number: code,
      booking_id: code,
      user_id: auth.userId,
      patient_id: patientResult.data.id,
      contact_name: parsed.customer.fullName,
      contact_phone: mobile,
      contact_email: parsed.customer.email || null,
      city: parsed.customer.city,
      address: parsed.customer.address,
      preferred_date: parsed.customer.preferredDate,
      preferred_time: parsed.customer.preferredTime,
      scheduled_date: parsed.customer.preferredDate,
      collection_type: "HOME_COLLECTION",
      subtotal,
      discount: discountTotal,
      discount_total: discountTotal,
      collection_charge: collectionCharge,
      payable_amount: payableAmount,
      total_amount: payableAmount,
      payment_method: parsed.paymentMethod,
      payment_status: "PENDING",
      booking_status: parsed.paymentMethod === "cod" ? "CONFIRMED" : "PENDING_PAYMENT",
      offer_breakdown: parsed.quote.appliedOffers || [],
      booking_patients: parsed.bookingPatients || [],
      family_member_count: Math.max(0, (parsed.bookingPatients?.length || 1) - 1),
      patient_type: patientInput.patientType || "self"
    })
    .select("id, booking_number, booking_id, payable_amount, total_amount")
    .single();

  if (bookingError || !booking) throw new HttpError(500, bookingError?.message || "Unable to create booking.");

  const itemRows = parsed.items.map((item: any) => {
    const quantity = itemQuantity(item);
    const kind = itemKind(item);
    const unitPrice = Number(item?.price || 0);
    return {
      booking_id: booking.id,
      item_type: kind,
      item_ref: String(item?.id || item?.slug || item?.name || ""),
      item_name: String(item?.name || "Diagnostic item"),
      quantity,
      unit_price: unitPrice,
      total_price: unitPrice * quantity,
      mrp: Number(item?.mrp || item?.price || 0),
      category: item?.category || null,
      description: item?.description || null,
      test_id: kind === "test" && isUuid(item?.id) ? item.id : null,
      package_id: kind === "package" && isUuid(item?.id) ? item.id : null,
      patient_name: patientInput.name || parsed.customer.fullName,
      patient_relation: patientInput.relation || "Self"
    };
  });

  const { error: itemsError } = await supabase.from("booking_items").insert(itemRows);
  if (itemsError) throw new HttpError(500, itemsError.message || "Unable to save booking items.");

  return {
    success: true,
    orderId: booking.booking_id || booking.booking_number || booking.id,
    bookingId: booking.id,
    booking
  };
}

export async function listSupabaseBookings(auth: AppJwtPayload) {
  const { data, error } = await getSupabaseServiceClient()
    .from("bookings")
    .select("id, booking_id, booking_number, contact_name, contact_phone, preferred_date, preferred_time, booking_status, payment_status, payable_amount, total_amount, created_at, booking_items(item_name, item_type, quantity)")
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false });

  if (error) throw new HttpError(500, error.message || "Unable to fetch bookings.");
  return data ?? [];
}

export async function trackSupabaseBooking(auth: AppJwtPayload, bookingId: string) {
  const { data, error } = await getSupabaseServiceClient()
    .from("bookings")
    .select("id, booking_id, booking_number, booking_status, payment_status, eta_minutes, eta_updated_at, updated_at, created_at")
    .or(`id.eq.${bookingId},booking_id.eq.${bookingId},booking_number.eq.${bookingId}`)
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (error) throw new HttpError(500, error.message || "Unable to track booking.");
  if (!data) throw new HttpError(404, "Booking not found.");
  return {
    booking: data,
    timeline: [
      { label: "Booking created", status: "done", at: data.created_at },
      { label: String(data.booking_status || "Pending").replace(/_/g, " "), status: "current", at: data.updated_at }
    ]
  };
}

export async function cancelSupabaseBooking(auth: AppJwtPayload, bookingId: string) {
  const { data, error } = await getSupabaseServiceClient()
    .from("bookings")
    .update({ booking_status: "CANCELLED", updated_at: new Date().toISOString() })
    .or(`id.eq.${bookingId},booking_id.eq.${bookingId},booking_number.eq.${bookingId}`)
    .eq("user_id", auth.userId)
    .select("id, booking_status")
    .maybeSingle();

  if (error) throw new HttpError(500, error.message || "Unable to cancel booking.");
  if (!data) throw new HttpError(404, "Booking not found.");
  return data;
}

export async function listSupabaseReports(auth: AppJwtPayload) {
  const { data, error } = await getSupabaseServiceClient()
    .from("reports")
    .select("id, booking_id, report_url, file_name, status, generated_at, uploaded_at, created_at, bookings!inner(user_id, booking_id, booking_number, preferred_date)")
    .eq("bookings.user_id", auth.userId)
    .order("created_at", { ascending: false });

  if (error) throw new HttpError(500, error.message || "Unable to fetch reports.");
  return data ?? [];
}

export async function uploadSupabaseReports(auth: AppJwtPayload, body: unknown) {
  const parsed = reportUploadSchema.parse(body);
  const supabase = getSupabaseServiceClient();
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, user_id, booking_id, booking_number, contact_name, contact_phone")
    .eq("id", parsed.bookingId)
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (bookingError) throw new HttpError(500, bookingError.message || "Unable to validate booking.");
  if (!booking) throw new HttpError(404, "Booking not found for this account.");

  const rows = parsed.files.map((file) => ({
    booking_id: parsed.bookingId,
    booking_code: parsed.bookingCode || booking.booking_id || booking.booking_number || null,
    user_id: auth.userId,
    patient_name: parsed.patientName,
    mobile_number: normalizeMobile(parsed.mobileNumber),
    file_name: file.fileName,
    file_size: file.fileSize,
    mime_type: file.mimeType,
    file_data: file.fileData,
    uploaded_by: auth.userId
  }));

  const { data, error } = await supabase
    .from("report_uploads")
    .insert(rows)
    .select("id, booking_id, booking_code, patient_name, mobile_number, file_name, file_size, created_at");

  if (error) throw new HttpError(500, error.message || "Unable to upload previous reports.");
  return data ?? [];
}

export async function verifySupabasePayment(auth: AppJwtPayload, body: unknown) {
  const parsed = paymentVerifySchema.parse(body);
  const valid = verifyRazorpaySignature({
    razorpayOrderId: parsed.razorpay_order_id,
    razorpayPaymentId: parsed.razorpay_payment_id,
    razorpaySignature: parsed.razorpay_signature
  });

  if (!valid) throw new HttpError(400, "Invalid Razorpay signature.");

  const supabase = getSupabaseServiceClient();
  const { data: booking, error: bookingLookupError } = await supabase
    .from("bookings")
    .select("id")
    .eq("id", parsed.bookingId)
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (bookingLookupError) throw new HttpError(500, bookingLookupError.message || "Unable to validate booking.");
  if (!booking) throw new HttpError(404, "Booking not found for this account.");

  const { error: paymentError } = await supabase
    .from("payments")
    .update({
      provider_payment_id: parsed.razorpay_payment_id,
      provider_signature: parsed.razorpay_signature,
      status: "PAID",
      raw_payload: parsed
    })
    .eq("booking_id", parsed.bookingId)
    .eq("provider_order_id", parsed.razorpay_order_id);

  if (paymentError) throw new HttpError(500, paymentError.message || "Unable to update payment.");

  const { error: bookingError } = await supabase
    .from("bookings")
    .update({ payment_status: "PAID", booking_status: "CONFIRMED", updated_at: new Date().toISOString() })
    .eq("id", parsed.bookingId)
    .eq("user_id", auth.userId);

  if (bookingError) throw new HttpError(500, bookingError.message || "Unable to confirm booking.");
  return { success: true, message: "Payment verified successfully." };
}

