import { NextResponse } from "next/server";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";
import { getSupabaseServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

const supportedEvents = new Set([
  "payment_link.paid",
  "payment_link.expired",
  "payment_link.cancelled"
]);

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") || "";
  if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ success: false, code: "INVALID_SIGNATURE" }, { status: 400 });
  }

  let event: Record<string, any>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ success: false, code: "INVALID_PAYLOAD" }, { status: 400 });
  }

  const eventId = request.headers.get("x-razorpay-event-id") || String(event.id || "");
  const eventType = String(event.event || "");
  if (!eventId || !supportedEvents.has(eventType)) {
    return NextResponse.json({ success: false, code: "UNSUPPORTED_EVENT" }, { status: 400 });
  }

  const link = event.payload?.payment_link?.entity;
  if (!link?.id) return NextResponse.json({ success: false, code: "MISSING_PAYMENT_LINK" }, { status: 400 });
  const payment = event.payload?.payment?.entity;
  const embeddedPayments = Array.isArray(link.payments) ? link.payments : [];
  const paymentId = String(payment?.id || embeddedPayments[0]?.payment_id || "");
  const amountPaidPaise = Number(link.amount_paid ?? payment?.amount ?? 0);

  try {
    const { error } = await getSupabaseServiceClient().rpc("apply_booking_payment_link_event", {
      p_event_id: eventId,
      p_event_type: eventType,
      p_provider_link_id: String(link.id),
      p_provider_payment_id: paymentId || null,
      p_amount_paid_paise: amountPaidPaise
    });
    if (error) {
      // Do not acknowledge the event so Razorpay can retry after DB recovery.
      return NextResponse.json({ success: false, code: "EVENT_PROCESSING_FAILED" }, { status: 503 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, code: "EVENT_PROCESSING_FAILED" }, { status: 503 });
  }
}
