import { Router } from "express";
import { z } from "zod";
import { asyncRoute } from "@/backend/src/lib/async-route";
import { requireAuth, type AuthedRequest } from "@/backend/src/middleware/auth";
import { insforge } from "@/backend/src/lib/insforge";
import type { BookingCatalogItem } from "@/lib/booking-types";
import { HttpError } from "@/backend/src/lib/http-error";
import { calculateQuoteWithOffers } from "@/backend/src/services/offers";
import {
  triggerBookingAutomation,
  triggerPhlebotomistAssignedAutomation,
  triggerReportReadyAutomation,
  triggerSampleCollectedAutomation
} from "@/backend/src/services/automation";
import { logActivity, logAudit } from "@/backend/src/services/activity";
import { sendAdminNotification, sendBookingConfirmationEmail, sendBookingStatusEmail } from "@/backend/src/services/email";

const statusValues = ["draft", "confirmed", "assigned", "on_the_way", "collected", "processing", "completed", "cancelled"] as const;
const paidStatuses = new Set(["paid", "captured", "advance_paid"]);
const nonCancelableStatuses = new Set(["collected", "processing", "completed", "cancelled"]);

const bookingItemSchema = z.object({
  id: z.string(),
  kind: z.enum(["package", "test"]),
  slug: z.string().optional().default(""),
  name: z.string(),
  description: z.string().optional().default(""),
  price: z.coerce.number(),
  mrp: z.coerce.number().optional().default(0),
  discount: z.coerce.number().optional().default(0),
  category: z.string().optional().default(""),
  href: z.string().optional().default("")
});

const familyMemberSchema = z.object({
  fullName: z.string().min(1),
  relationship: z.string().min(1),
  age: z.string().optional().default(""),
  gender: z.string().optional().default("")
});

const bookingPatientSchema = z.object({
  patientId: z.string().min(1),
  patientType: z.enum(["self", "family"]),
  familyMemberId: z.string().uuid().optional().nullable(),
  name: z.string().min(1),
  relation: z.string().min(1),
  age: z.string().optional().default(""),
  dob: z.string().optional().default(""),
  gender: z.string().optional().default(""),
  mobile: z.string().optional().default(""),
  tests: z.array(bookingItemSchema).min(1)
});

const customerSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().min(10),
  email: z.string().optional().default(""),
  city: z.string().min(1),
  address: z.string().min(1),
  preferredDate: z.string().min(1),
  preferredTime: z.string().min(1)
});

const bookingCreateBaseSchema = z.object({
  customer: customerSchema,
  patientType: z.enum(["self", "family"]).optional().default("self"),
  familyMemberId: z.string().uuid().optional().nullable(),
  bookingPatients: z.array(bookingPatientSchema).max(11).optional(),
  familyMembers: z.array(familyMemberSchema).max(10).default([]),
  items: z.array(bookingItemSchema).default([]),
  fromCart: z.boolean().optional().default(false),
  saveAsDraft: z.boolean().optional().default(false),
  paymentMethod: z.enum(["online", "cod"]),
  couponCode: z.string().optional()
});

const bookingCreateSchema = bookingCreateBaseSchema.refine((value) => value.fromCart || value.items.length > 0 || Boolean(value.bookingPatients?.length), {
  message: "Add at least one test or package before booking."
}).refine((value) => !value.bookingPatients?.length || value.bookingPatients.every((patient) => (patient.age || patient.dob) && patient.gender), {
  message: "Age/DOB and gender are required for every selected patient."
}).refine((value) => !value.bookingPatients?.some((patient) => patient.patientType === "family" && !patient.familyMemberId), {
  message: "Select a saved family member before booking for a family patient."
});

const bookingEditSchema = bookingCreateBaseSchema.partial().extend({
  items: z.array(bookingItemSchema).optional(),
  familyMembers: z.array(familyMemberSchema).max(10).optional()
});

const assignSchema = z.object({
  bookingId: z.string().uuid(),
  phlebotomistId: z.string().uuid(),
  etaMinutes: z.coerce.number().int().min(0).max(480).optional(),
  note: z.string().optional()
});

const statusUpdateSchema = z.object({
  bookingId: z.string().uuid(),
  status: z.enum(statusValues),
  etaMinutes: z.coerce.number().int().min(0).max(480).optional(),
  note: z.string().optional()
});

type BookingRow = {
  id: string;
  user_id: string;
  payment_status?: string;
  booking_status?: string;
  locked_at?: string | null;
  is_draft?: boolean;
  contact_phone?: string;
  contact_name?: string;
};

type CartRow = {
  id: string;
  item_type: "package" | "test";
  item_ref: string;
  item_name: string;
  unit_price: number | string;
  mrp?: number | string;
  category?: string | null;
  description?: string | null;
  quantity?: number;
};

export const bookingsRouter = Router();

function generateBookingCode() {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  return `SCOPEX-${stamp}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

async function insertStatusEvent(params: {
  bookingId: string;
  status: (typeof statusValues)[number];
  note?: string;
  etaMinutes?: number;
  actorId?: string;
  actorRole?: string;
}) {
  await insforge.database.from("booking_status_events").insert({
    booking_id: params.bookingId,
    status: params.status,
    note: params.note || null,
    eta_minutes: params.etaMinutes ?? null,
    actor_id: params.actorId || null,
    actor_role: params.actorRole || null
  });
}

function toBookingItemFromCart(item: CartRow): BookingCatalogItem {
  return {
    id: item.item_ref,
    kind: item.item_type,
    slug: item.item_ref,
    name: item.item_name,
    description: item.description || "",
    price: Number(item.unit_price),
    mrp: Number(item.mrp ?? item.unit_price),
    discount: 0,
    category: item.category || "",
    href: ""
  };
}

async function getCartItems(userId: string) {
  const { data, error } = await insforge.database
    .from("cart_items")
    .select("id, item_type, item_ref, item_name, unit_price, mrp, category, description, quantity")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw new HttpError(500, error.message || "Unable to fetch cart items.");
  return (data ?? []) as CartRow[];
}

async function assertEditableBooking(bookingId: string, userId: string) {
  const { data, error } = await insforge.database
    .from("bookings")
    .select("id, user_id, payment_status, booking_status, locked_at, is_draft")
    .eq("id", bookingId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) throw new HttpError(404, error?.message || "Booking not found.");

  const booking = data as BookingRow;
  if (booking.locked_at || paidStatuses.has(String(booking.payment_status))) {
    throw new HttpError(409, "This booking is locked after payment and cannot be edited.");
  }

  return booking;
}

async function fetchTrackableBooking(bookingId: string, userId: string) {
  const { data, error } = await insforge.database
    .from("bookings")
    .select("id, booking_id, contact_name, contact_phone, city, address, preferred_date, preferred_time, booking_status, payment_status, payment_method, payable_amount, advance_amount, booking_patients, phlebotomist_id, eta_minutes, eta_updated_at, phlebotomists(id, name, mobile, vehicle_number), booking_items(item_name, item_type, booking_patient_id, family_member_id, patient_name, patient_relation), reports(id, report_url, status, generated_at)")
    .eq("id", bookingId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new HttpError(500, error.message || "Unable to fetch booking.");
  if (!data) throw new HttpError(404, "Booking not found.");
  return data;
}

bookingsRouter.post(
  "/create",
  requireAuth("patient"),
  asyncRoute(async (request: AuthedRequest, response) => {
    const parsed = bookingCreateSchema.parse(request.body);
    const auth = request.auth;
    if (!auth?.userId || !auth?.patientId) throw new HttpError(401, "Patient session is missing.");

    const cartRows = parsed.fromCart ? await getCartItems(auth.userId) : [];
    const legacyItems = parsed.fromCart ? cartRows.map(toBookingItemFromCart) : (parsed.items as BookingCatalogItem[]);
    const bookingPatients = parsed.bookingPatients?.length
      ? parsed.bookingPatients.map((patient) => ({
          ...patient,
          tests: patient.tests as BookingCatalogItem[]
        }))
      : [
          {
            patientId: parsed.patientType === "family" && parsed.familyMemberId ? parsed.familyMemberId : "self",
            patientType: parsed.patientType,
            familyMemberId: parsed.patientType === "family" ? parsed.familyMemberId || null : null,
            name: parsed.customer.fullName,
            relation: parsed.patientType === "family" ? "Family" : "Self",
            age: "",
            dob: "",
            gender: "",
            mobile: parsed.customer.phone,
            tests: legacyItems
          }
        ];
    const items = bookingPatients.flatMap((patient) => patient.tests);
    if (items.length === 0) throw new HttpError(400, "Your cart is empty.");

    const familyMemberIds = Array.from(new Set(
      bookingPatients
        .filter((patient) => patient.patientType === "family" && patient.familyMemberId)
        .map((patient) => patient.familyMemberId as string)
    ));
    if (familyMemberIds.length > 0) {
      const { data: ownedMembers, error: memberError } = await insforge.database
        .from("family_members")
        .select("id")
        .eq("user_id", auth.userId);

      if (memberError) throw new HttpError(500, memberError.message || "Unable to validate selected family members.");
      const ownedIds = new Set((ownedMembers ?? []).map((member: { id: string }) => member.id));
      const invalidMemberId = familyMemberIds.find((id) => !ownedIds.has(id));
      if (invalidMemberId) throw new HttpError(403, "Selected family member is not available for this account.");
    }

    const familyMembers = parsed.bookingPatients?.length
      ? bookingPatients
          .filter((patient) => patient.patientType === "family")
          .map((patient, index) => ({
            id: patient.familyMemberId || patient.patientId || `${index + 1}`,
            fullName: patient.name,
            relationship: patient.relation,
            age: patient.age ?? "",
            gender: patient.gender ?? ""
          }))
      : parsed.familyMembers.map((member, index) => ({
          id: `${index + 1}`,
          fullName: member.fullName,
          relationship: member.relationship,
          age: member.age ?? "",
          gender: member.gender ?? ""
        }));

    const quote = await calculateQuoteWithOffers({
      userId: auth.userId,
      items,
      familyMembers,
      couponCode: parsed.couponCode
    });

    const advanceAmount = parsed.paymentMethod === "cod" ? Math.min(100, quote.payableAmount) : 0;
    const bookingStatus = parsed.saveAsDraft ? "draft" : "confirmed";

    const { data: booking, error: bookingError } = await insforge.database
      .from("bookings")
      .insert({
        booking_id: generateBookingCode(),
        user_id: auth.userId,
        patient_id: auth.patientId,
        patient_type: bookingPatients[0]?.patientType || parsed.patientType,
        family_member_id: bookingPatients[0]?.patientType === "family" ? bookingPatients[0].familyMemberId || null : null,
        member_id: bookingPatients[0]?.patientType === "family" ? bookingPatients[0].familyMemberId || null : null,
        package_id: items.find((item) => item.kind === "package")?.id || null,
        slot_date: parsed.customer.preferredDate,
        slot_time: parsed.customer.preferredTime,
        booking_patients: bookingPatients.map((patient) => ({
          patientId: patient.patientId,
          patientType: patient.patientType,
          familyMemberId: patient.familyMemberId || null,
          name: patient.name,
          relation: patient.relation,
          age: patient.age || null,
          dob: patient.dob || null,
          gender: patient.gender || null,
          mobile: patient.mobile || null,
          tests: patient.tests.map((item) => ({
            id: item.id,
            kind: item.kind,
            name: item.name,
            price: item.price,
            mrp: item.mrp,
            category: item.category
          }))
        })),
        contact_name: parsed.customer.fullName,
        contact_phone: parsed.customer.phone.replace(/\D/g, "").slice(-10),
        contact_email: parsed.customer.email || null,
        city: parsed.customer.city,
        address: parsed.customer.address,
        preferred_date: parsed.customer.preferredDate,
        preferred_time: parsed.customer.preferredTime,
        collection_type: "home",
        family_member_count: Math.max(0, bookingPatients.length - 1),
        subtotal: quote.subtotal,
        discount_total: quote.discountTotal,
        payable_amount: quote.payableAmount,
        advance_amount: advanceAmount,
        payment_method: parsed.paymentMethod,
        payment_status: parsed.saveAsDraft ? "draft" : parsed.paymentMethod === "cod" ? "advance_required" : "created",
        booking_status: bookingStatus,
        is_draft: parsed.saveAsDraft,
        offer_breakdown: quote.appliedOffers
      })
      .select("id, booking_id, payable_amount, advance_amount, payment_status, booking_status, is_draft")
      .single();

    if (bookingError || !booking) throw new HttpError(500, bookingError?.message || "Unable to create booking.");

    if (!parsed.bookingPatients?.length && parsed.familyMembers.length > 0) {
      const { error: familyError } = await insforge.database.from("booking_family_members").insert(
        parsed.familyMembers.map((member) => ({
          booking_id: booking.id,
          full_name: member.fullName,
          relationship: member.relationship,
          age: member.age ? Number(member.age) : null,
          gender: member.gender || null
        }))
      );
      if (familyError) throw new HttpError(500, familyError.message || "Unable to save family members.");
    }

    const { error: itemsError } = await insforge.database.from("booking_items").insert(
      bookingPatients.flatMap((patient) => patient.tests.map((item) => ({
        booking_id: booking.id,
        booking_patient_id: patient.patientId,
        family_member_id: patient.familyMemberId || null,
        patient_name: patient.name,
        patient_relation: patient.relation,
        item_type: item.kind,
        item_ref: item.id,
        item_name: item.name,
        unit_price: item.price,
        mrp: item.mrp,
        category: item.category,
        description: item.description
      })))
    );
    if (itemsError) throw new HttpError(500, itemsError.message || "Unable to save selected tests.");

    await insertStatusEvent({
      bookingId: booking.id,
      status: bookingStatus as (typeof statusValues)[number],
      note: parsed.saveAsDraft ? "Draft booking saved" : "Home collection booking confirmed",
      actorId: auth.userId,
      actorRole: "patient"
    });

    if (parsed.fromCart && !parsed.saveAsDraft) {
      await insforge.database.from("cart_items").delete().eq("user_id", auth.userId);
    }

    if (!parsed.saveAsDraft) {
      void triggerBookingAutomation({
        mobile: parsed.customer.phone,
        customerName: parsed.customer.fullName,
        bookingId: booking.booking_id || booking.id
      });
      void sendBookingConfirmationEmail({
        to: parsed.customer.email,
        patientName: parsed.customer.fullName,
        bookingId: booking.booking_id || booking.id,
        city: parsed.customer.city,
        address: parsed.customer.address,
        preferredDate: parsed.customer.preferredDate,
        preferredTime: parsed.customer.preferredTime,
        amount: quote.payableAmount
      });
      void sendAdminNotification("admin_new_booking", "New ScopeX booking created", {
        bookingId: booking.booking_id || booking.id,
        patientName: parsed.customer.fullName,
        mobile: parsed.customer.phone,
        city: parsed.customer.city,
        amount: quote.payableAmount,
        paymentMethod: parsed.paymentMethod
      });
    }
    void logActivity({
      userId: auth.userId,
      role: "patient",
      action: parsed.saveAsDraft ? "booking_draft_created" : "booking_created",
      entityType: "booking",
      entityId: booking.id,
      metadata: { bookingId: booking.booking_id, patientCount: bookingPatients.length, itemCount: items.length },
      request
    });

    response.status(201).json({
      success: true,
      orderId: booking.id,
      bookingId: booking.booking_id,
      quote,
      advanceAmount,
      paymentStatus: booking.payment_status,
      orderStatus: booking.booking_status,
      isDraft: booking.is_draft
    });
  })
);

bookingsRouter.get(
  "/drafts",
  requireAuth("patient"),
  asyncRoute(async (request: AuthedRequest, response) => {
    const auth = request.auth;
    if (!auth?.userId) throw new HttpError(401, "Patient session is missing.");

    const { data, error } = await insforge.database
      .from("bookings")
      .select("id, booking_id, created_at, payable_amount, payment_status, booking_status, preferred_date, preferred_time, booking_patients, booking_items(item_name, item_type, booking_patient_id, family_member_id, patient_name, patient_relation)")
      .eq("user_id", auth.userId)
      .eq("is_draft", true)
      .order("created_at", { ascending: false });

    if (error) throw new HttpError(500, error.message || "Unable to fetch draft bookings.");
    response.json({ drafts: data ?? [] });
  })
);

bookingsRouter.patch(
  "/:id",
  requireAuth("patient"),
  asyncRoute(async (request: AuthedRequest, response) => {
    const auth = request.auth;
    if (!auth?.userId) throw new HttpError(401, "Patient session is missing.");
    const bookingId = String(request.params.id);
    await assertEditableBooking(bookingId, auth.userId);

    const parsed = bookingEditSchema.parse(request.body);
    const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (parsed.customer) {
      updatePayload.contact_name = parsed.customer.fullName;
      updatePayload.contact_phone = parsed.customer.phone.replace(/\D/g, "").slice(-10);
      updatePayload.contact_email = parsed.customer.email || null;
      updatePayload.city = parsed.customer.city;
      updatePayload.address = parsed.customer.address;
      updatePayload.preferred_date = parsed.customer.preferredDate;
      updatePayload.preferred_time = parsed.customer.preferredTime;
    }
    if (parsed.saveAsDraft !== undefined) updatePayload.is_draft = parsed.saveAsDraft;
    if (parsed.paymentMethod) updatePayload.payment_method = parsed.paymentMethod;

    const { data, error } = await insforge.database
      .from("bookings")
      .update(updatePayload)
      .eq("id", bookingId)
      .eq("user_id", auth.userId)
      .select("id, booking_id, updated_at, payment_status, booking_status")
      .single();

    if (error || !data) throw new HttpError(500, error?.message || "Unable to update booking.");
    response.json({ success: true, booking: data });
  })
);

bookingsRouter.patch(
  "/:id/cancel",
  requireAuth("patient"),
  asyncRoute(async (request: AuthedRequest, response) => {
    const auth = request.auth;
    if (!auth?.userId) throw new HttpError(401, "Patient session is missing.");
    const bookingId = String(request.params.id);

    const { data, error } = await insforge.database
      .from("bookings")
      .select("id, user_id, payment_status, booking_status, locked_at, is_draft")
      .eq("id", bookingId)
      .eq("user_id", auth.userId)
      .maybeSingle();

    if (error) throw new HttpError(500, error.message || "Unable to fetch booking.");
    if (!data) throw new HttpError(404, "Booking not found.");

    const booking = data as BookingRow;
    const status = String(booking.booking_status || "");
    if (status === "cancelled") throw new HttpError(409, "Booking is already cancelled.");
    if (nonCancelableStatuses.has(status)) {
      throw new HttpError(409, "This booking cannot be cancelled online after collection or processing starts.");
    }
    if (booking.locked_at || paidStatuses.has(String(booking.payment_status))) {
      throw new HttpError(409, "Paid bookings cannot be cancelled online. Please contact support for assistance.");
    }

    const { data: updatedBooking, error: updateError } = await insforge.database
      .from("bookings")
      .update({
        booking_status: "cancelled",
        is_draft: false,
        updated_at: new Date().toISOString()
      })
      .eq("id", bookingId)
      .eq("user_id", auth.userId)
      .select("id, booking_id, booking_status, payment_status")
      .single();

    if (updateError || !updatedBooking) {
      throw new HttpError(500, updateError?.message || "Unable to cancel booking.");
    }

    await insertStatusEvent({
      bookingId,
      status: "cancelled",
      note: "Cancelled by patient",
      actorId: auth.userId,
      actorRole: "patient"
    });
    void logActivity({ userId: auth.userId, role: "patient", action: "booking_cancelled", entityType: "booking", entityId: bookingId, request });

    response.json({ success: true, booking: updatedBooking });
  })
);

bookingsRouter.get(
  "/track/:id",
  requireAuth("patient"),
  asyncRoute(async (request: AuthedRequest, response) => {
    const auth = request.auth;
    if (!auth?.userId) throw new HttpError(401, "Patient session is missing.");
    const bookingId = String(request.params.id);

    const booking = await fetchTrackableBooking(bookingId, auth.userId);
    const { data: timeline, error } = await insforge.database
      .from("booking_status_events")
      .select("id, status, note, eta_minutes, actor_role, created_at")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: true });

    if (error) throw new HttpError(500, error.message || "Unable to fetch booking timeline.");

    response.json({ booking, timeline: timeline ?? [] });
  })
);

bookingsRouter.post(
  "/assign",
  requireAuth("admin"),
  asyncRoute(async (request: AuthedRequest, response) => {
    const auth = request.auth;
    const parsed = assignSchema.parse(request.body);

    const { data: phlebotomist, error: phlebError } = await insforge.database
      .from("phlebotomists")
      .select("id, name, mobile, vehicle_number")
      .eq("id", parsed.phlebotomistId)
      .eq("is_active", true)
      .maybeSingle();

    if (phlebError || !phlebotomist) throw new HttpError(400, phlebError?.message || "Active phlebotomist not found.");

    const { data: booking, error } = await insforge.database
      .from("bookings")
      .update({
        phlebotomist_id: parsed.phlebotomistId,
        eta_minutes: parsed.etaMinutes ?? null,
        eta_updated_at: new Date().toISOString(),
        booking_status: "assigned",
        updated_at: new Date().toISOString()
      })
      .eq("id", parsed.bookingId)
      .select("id, booking_id, contact_phone, contact_name, contact_email")
      .single();

    if (error || !booking) throw new HttpError(500, error?.message || "Unable to assign phlebotomist.");

    await insertStatusEvent({
      bookingId: parsed.bookingId,
      status: "assigned",
      etaMinutes: parsed.etaMinutes,
      note: parsed.note || "Phlebotomist assigned",
      actorId: auth?.userId,
      actorRole: "admin"
    });
    void logAudit({ adminId: auth?.userId, role: auth?.role, action: "phlebotomist_assigned", entityType: "booking", entityId: parsed.bookingId, request });

    void triggerPhlebotomistAssignedAutomation({
      mobile: booking.contact_phone,
      customerName: booking.contact_name,
      bookingId: booking.booking_id || booking.id,
      phlebotomistName: (phlebotomist as { name: string }).name,
      etaMinutes: parsed.etaMinutes
    });

    response.json({ success: true, booking, phlebotomist });
  })
);

bookingsRouter.post(
  "/status-update",
  requireAuth("admin"),
  asyncRoute(async (request: AuthedRequest, response) => {
    const auth = request.auth;
    const parsed = statusUpdateSchema.parse(request.body);

    const { data: booking, error } = await insforge.database
      .from("bookings")
      .update({
        booking_status: parsed.status,
        eta_minutes: parsed.etaMinutes ?? null,
        eta_updated_at: parsed.etaMinutes !== undefined ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString()
      })
      .eq("id", parsed.bookingId)
      .select("id, booking_id, contact_phone, contact_name")
      .single();

    if (error || !booking) throw new HttpError(500, error?.message || "Unable to update booking status.");

    await insertStatusEvent({
      bookingId: parsed.bookingId,
      status: parsed.status,
      etaMinutes: parsed.etaMinutes,
      note: parsed.note,
      actorId: auth?.userId,
      actorRole: "admin"
    });
    void logAudit({ adminId: auth?.userId, role: auth?.role, action: "booking_status_updated", entityType: "booking", entityId: parsed.bookingId, metadata: { status: parsed.status }, request });

    if (parsed.status === "collected") {
      void triggerSampleCollectedAutomation({ mobile: booking.contact_phone, customerName: booking.contact_name, bookingId: booking.booking_id || booking.id });
    }
    if (parsed.status === "completed") {
      void triggerReportReadyAutomation({ mobile: booking.contact_phone, customerName: booking.contact_name, bookingId: booking.booking_id || booking.id });
    }
    void sendBookingStatusEmail({
      to: booking.contact_email,
      patientName: booking.contact_name,
      bookingId: booking.booking_id || booking.id,
      status: parsed.status
    });

    response.json({ success: true, booking });
  })
);

bookingsRouter.get(
  "/user",
  requireAuth("patient"),
  asyncRoute(async (request: AuthedRequest, response) => {
    const auth = request.auth;
    if (!auth?.userId) throw new HttpError(401, "Patient session is missing.");

    const { data, error } = await insforge.database
      .from("bookings")
      .select("id, booking_id, created_at, payable_amount, advance_amount, payment_status, booking_status, patient_type, family_member_id, member_id, preferred_date, preferred_time, booking_patients, booking_items(item_name, item_type, booking_patient_id, family_member_id, patient_name, patient_relation), reports(id, report_url, status)")
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: false });

    if (error) throw new HttpError(500, error.message || "Unable to fetch user bookings.");
    response.json({ bookings: data ?? [] });
  })
);

bookingsRouter.get(
  "/history",
  requireAuth("patient"),
  asyncRoute(async (request: AuthedRequest, response) => {
    const auth = request.auth;
    if (!auth?.userId) throw new HttpError(401, "Patient session is missing.");

    const { data, error } = await insforge.database
      .from("bookings")
      .select("id, booking_id, created_at, payable_amount, advance_amount, payment_status, booking_status, patient_type, family_member_id, member_id, preferred_date, preferred_time, booking_patients, booking_items(item_name, item_type, booking_patient_id, family_member_id, patient_name, patient_relation), reports(id, report_url, status)")
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: false });

    if (error) throw new HttpError(500, error.message || "Unable to fetch booking history.");
    response.json({ bookings: data ?? [] });
  })
);


