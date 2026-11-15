import { HttpError } from "@/backend/src/lib/http-error";
import { createRazorpayPaymentLink } from "@/lib/razorpay";
import { getSupabaseServiceClient } from "@/lib/supabase-server";

type DbRow = Record<string, any>;

export function isBookingPaid(status: unknown) {
  return String(status || "").trim().toLowerCase() === "paid";
}

function mapLink(row: DbRow) {
  return {
    id: row.id,
    bookingId: row.booking_id,
    providerLinkId: row.provider_link_id || null,
    shortUrl: row.short_url || null,
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status,
    expiresAt: row.expires_at || null,
    createdAt: row.created_at,
    reminderCount: Number(row.reminder_count || 0)
  };
}

async function activeLinkForBooking(supabase: ReturnType<typeof getSupabaseServiceClient>, bookingId: string) {
  const { data, error } = await supabase.from("booking_payment_links")
    .select("*").eq("booking_id", bookingId)
    .in("status", ["creating", "created"])
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw new HttpError(503, "Payment-link storage is not ready. Review the pending database migration.");
  return data as DbRow | null;
}

export async function getOrCreateBookingPaymentLink(bookingId: string, actor: string) {
  const supabase = getSupabaseServiceClient();
  const { data: booking, error: bookingError } = await supabase.from("bookings").select("*").eq("id", bookingId).maybeSingle();
  if (bookingError) throw new HttpError(503, "Unable to load booking payment details.");
  if (!booking) throw new HttpError(404, "Booking not found.");
  const record = booking as DbRow;
  if (isBookingPaid(record.payment_status)) throw new HttpError(409, "This booking is already paid.");

  const active = await activeLinkForBooking(supabase, bookingId);
  if (active?.status === "created" && active.short_url && (!active.expires_at || new Date(active.expires_at).getTime() > Date.now())) {
    return { link: mapLink(active), reused: true };
  }
  if (active?.status === "created" && active.expires_at && new Date(active.expires_at).getTime() <= Date.now()) {
    const { error } = await supabase.from("booking_payment_links").update({ status: "expired", updated_at: new Date().toISOString() }).eq("id", active.id);
    if (error) throw new HttpError(503, "Unable to expire the old payment link before creating a replacement.");
  }
  if (active?.status === "creating") throw new HttpError(409, "A payment link is already being generated. Try again shortly.");

  const payable = Number(record.payable_amount ?? record.total_amount ?? record.final_amount);
  if (!Number.isFinite(payable) || payable <= 0) throw new HttpError(400, "Booking has no payable balance.");
  const amount = Math.round(payable * 100);
  const bookingNumber = String(record.booking_number || record.booking_id || record.id);

  // Reserve an idempotency slot before contacting Razorpay. The partial unique
  // index serializes concurrent requests for the same booking.
  const { data: reservation, error: reserveError } = await supabase.from("booking_payment_links").insert({
    booking_id: bookingId,
    amount: payable,
    currency: "INR",
    status: "creating",
    generated_by: actor
  }).select("id").single();
  if (reserveError) {
    if (reserveError.code === "23505") {
      const winner = await activeLinkForBooking(supabase, bookingId);
      if (winner?.status === "created" && winner.short_url) return { link: mapLink(winner), reused: true };
      throw new HttpError(409, "A payment link is already being generated. Try again shortly.");
    }
    throw new HttpError(503, "Unable to reserve a payment link. Apply the pending database migration first.");
  }

  let providerLinkCreated = false;
  try {
    const providerLink = await createRazorpayPaymentLink({
      amount,
      referenceId: `${bookingNumber}-${String(reservation.id).replace(/-/g, "").slice(0, 8)}`,
      description: `ScopeX booking ${bookingNumber}`,
      customer: {
        name: String(record.contact_name || record.customer_name || "ScopeX customer"),
        email: record.contact_email || record.customer_email || null,
        contact: record.contact_phone || record.customer_phone || null
      },
      bookingId,
      paymentLinkRecordId: reservation.id
    });
    providerLinkCreated = true;

    const expiresAt = providerLink.expire_by ? new Date(providerLink.expire_by * 1000).toISOString() : null;
    const { data: saved, error: saveError } = await supabase.from("booking_payment_links").update({
      provider_link_id: providerLink.id,
      short_url: providerLink.short_url,
      status: providerLink.status === "paid" ? "paid" : providerLink.status === "expired" ? "expired" : "created",
      expires_at: expiresAt,
      provider_metadata: { providerStatus: providerLink.status },
      updated_at: new Date().toISOString()
    }).eq("id", reservation.id).select("*").single();
    if (saveError) throw new HttpError(503, "Razorpay created a link, but the app could not save it. Contact support before retrying.");

    const { error: eventError } = await supabase.from("booking_payment_link_events").insert({
      payment_link_id: reservation.id,
      booking_id: bookingId,
      event_key: `generated:${reservation.id}`,
      event_type: "payment_link_generated",
      actor,
      details: { amount: payable, currency: "INR" }
    });
    if (eventError) throw new HttpError(503, "The payment link exists, but its audit event could not be saved. Contact support before retrying.");

    return { link: mapLink(saved), reused: false };
  } catch (error) {
    if (!providerLinkCreated) {
      await supabase.from("booking_payment_links").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", reservation.id);
    }
    if (error instanceof HttpError) throw error;
    throw new HttpError(502, "Razorpay could not create a payment link. Check provider configuration and retry.");
  }
}
