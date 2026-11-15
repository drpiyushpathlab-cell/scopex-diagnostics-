import { HttpError } from "@/backend/src/lib/http-error";
import { getSupabaseServiceClient } from "@/lib/supabase-server";

type Row = Record<string, any>;

function fail(message: string): never {
  throw new HttpError(500, message);
}

async function ensureTarget(kind: "lead" | "booking", id: string) {
  if (!id) throw new HttpError(400, "A target record is required.");
  const table = kind === "lead" ? "leads" : "bookings";
  const { data, error } = await getSupabaseServiceClient().from(table).select("id").eq("id", id).maybeSingle();
  if (error) fail("Unable to verify the customer care target.");
  if (!data) throw new HttpError(404, "Customer care target not found.");
}

function normalizeInteraction(row: Row) {
  return {
    id: row.id,
    targetId: row.target_id,
    targetKind: row.target_kind,
    interactionKind: row.interaction_kind,
    channel: row.channel,
    templateTitle: row.subject,
    messageContent: row.notes,
    callType: row.metadata?.callType || "outbound",
    outcome: row.outcome,
    durationSeconds: row.duration_seconds,
    subject: row.subject,
    notes: row.notes,
    followUpAt: row.follow_up_at,
    deliveryStatus: row.delivery_status,
    performedBy: row.performed_by,
    createdAt: row.created_at
  };
}

export async function recordCustomerCareInteraction(input: {
  targetId: string;
  targetKind: "lead" | "booking";
  interactionKind: "call" | "message";
  channel: "phone" | "whatsapp" | "sms" | "email";
  outcome?: string;
  durationSeconds?: number;
  subject?: string;
  notes?: string;
  followUpAt?: string | null;
  performedBy: string;
}) {
  await ensureTarget(input.targetKind, input.targetId);
  const { data, error } = await getSupabaseServiceClient()
    .from("customer_care_interactions")
    .insert({
      target_id: input.targetId,
      target_kind: input.targetKind,
      interaction_kind: input.interactionKind,
      channel: input.channel,
      outcome: input.outcome || null,
      duration_seconds: input.durationSeconds ?? null,
      subject: input.subject?.slice(0, 200) || null,
      notes: input.notes?.slice(0, 4000) || null,
      follow_up_at: input.followUpAt || null,
      // A recorded message is queued in the log only. Delivery is a separate
      // provider operation and is never claimed to have succeeded here.
      delivery_status: input.interactionKind === "message" ? "queued" : "not_applicable",
      performed_by: input.performedBy
    })
    .select("*")
    .single();
  if (error) fail("Unable to save the customer care interaction.");
  return normalizeInteraction(data);
}

export async function getCustomerCareDashboardFromDatabase() {
  const supabase = getSupabaseServiceClient();
  const [pending, confirmed, cancelled, dispatchCount, activeJobs, exceptions, dueFollowUps, calls, messages, recentCalls, recentMessages, pendingRows, dispatchRows, cancelledRows, exceptionRows, followUpRows, jobs] = await Promise.all([
    supabase.from("bookings").select("id", { count: "exact", head: true }).in("booking_status", ["STARTED", "DETAILS_ENTERED", "SLOT_SELECTED", "PAYMENT_STARTED", "PENDING_PAYMENT"]),
    supabase.from("bookings").select("id", { count: "exact", head: true }).in("booking_status", ["CONFIRMED", "ASSIGNED"]),
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("booking_status", "CANCELLED"),
    supabase.from("bookings").select("id", { count: "exact", head: true }).in("booking_status", ["CONFIRMED", "ASSIGNED"]).is("phlebotomist_id", null),
    supabase.from("collection_jobs").select("id", { count: "exact", head: true }).in("status", ["Assigned", "Accepted", "En Route", "Arrived", "Collected"]),
    supabase.from("collection_jobs").select("id", { count: "exact", head: true }).eq("exception_queue", true),
    supabase.from("leads").select("id", { count: "exact", head: true }).gte("follow_up_date", new Date().toISOString().slice(0, 10)).lt("follow_up_date", new Date(Date.now() + 86400000).toISOString().slice(0, 10)),
    supabase.from("customer_care_interactions").select("id", { count: "exact", head: true }).eq("interaction_kind", "call"),
    supabase.from("customer_care_interactions").select("id", { count: "exact", head: true }).eq("interaction_kind", "message").in("delivery_status", ["sent", "delivered"]),
    supabase.from("customer_care_interactions").select("*").eq("interaction_kind", "call").order("created_at", { ascending: false }).limit(15),
    supabase.from("customer_care_interactions").select("*").eq("interaction_kind", "message").order("created_at", { ascending: false }).limit(15),
    supabase.from("bookings").select("*").in("booking_status", ["STARTED", "DETAILS_ENTERED", "SLOT_SELECTED", "PAYMENT_STARTED", "PENDING_PAYMENT"]).order("created_at", { ascending: false }).limit(20),
    supabase.from("bookings").select("*").in("booking_status", ["CONFIRMED", "ASSIGNED"]).is("phlebotomist_id", null).order("created_at", { ascending: false }).limit(20),
    supabase.from("bookings").select("*").eq("booking_status", "CANCELLED").order("updated_at", { ascending: false }).limit(20),
    supabase.from("collection_jobs").select("*").eq("exception_queue", true).order("updated_at", { ascending: false }).limit(20),
    supabase.from("leads").select("*").gte("follow_up_date", new Date().toISOString().slice(0, 10)).lt("follow_up_date", new Date(Date.now() + 86400000).toISOString().slice(0, 10)).order("follow_up_date").limit(20),
    supabase.from("collection_jobs").select("*").in("status", ["Assigned", "Accepted", "En Route", "Arrived", "Collected"]).order("updated_at", { ascending: false }).limit(100)
  ]);
  const results = [pending, confirmed, cancelled, dispatchCount, activeJobs, exceptions, dueFollowUps, calls, messages, recentCalls, recentMessages, pendingRows, dispatchRows, cancelledRows, exceptionRows, followUpRows, jobs];
  if (results.some((result) => result.error)) fail("Unable to load customer care dashboard records.");
  return {
    summary: {
      pendingConfirmationsCount: pending.count || 0,
      pendingDispatchCount: dispatchCount.count || 0,
      activeCollectionsCount: activeJobs.count || 0,
      exceptionsCount: exceptions.count || 0,
      cancelledCount: cancelled.count || 0,
      followUpsDueTodayCount: dueFollowUps.count || 0,
      totalCallsLogged: calls.count || 0,
      totalMessagesSent: messages.count || 0
    },
    queues: {
      pendingConfirmations: pendingRows.data || [],
      pendingDispatch: dispatchRows.data || [],
      cancellations: cancelledRows.data || [],
      exceptions: exceptionRows.data || [],
      followUpsDueToday: followUpRows.data || []
    },
    activeCollections: jobs.data || [],
    recentCalls: (recentCalls.data || []).map(normalizeInteraction),
    recentMessages: (recentMessages.data || []).map(normalizeInteraction)
  };
}

export async function updateBookingFromCustomerCare(input: {
  bookingId: string;
  action: "confirm" | "cancel";
  notes: string;
  performedBy: string;
}) {
  const { data, error } = await getSupabaseServiceClient().rpc("customer_care_update_booking", {
    p_booking_id: input.bookingId,
    p_action: input.action,
    p_notes: input.notes,
    p_performed_by: input.performedBy
  });
  if (error) {
    if (error.code === "P0002") throw new HttpError(404, "Booking not found.");
    if (error.code === "22023") throw new HttpError(400, "Unsupported customer care booking action.");
    fail("Unable to update booking from customer care.");
  }
  return data;
}
