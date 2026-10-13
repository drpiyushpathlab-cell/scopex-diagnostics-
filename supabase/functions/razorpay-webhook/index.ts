import { createHmac } from "node:crypto";
import { createClient } from "npm:@supabase/supabase-js@2.49.4";
import { jsonResponse } from "../_shared/cors.ts";

function isValidWebhook(payload: string, signature: string | null) {
  const secret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  return expected === signature;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return jsonResponse({ success: false, message: "Method not allowed." }, 405);

  const payload = await request.text();
  if (!isValidWebhook(payload, request.headers.get("x-razorpay-signature"))) {
    return jsonResponse({ success: false, message: "Invalid webhook signature." }, 400);
  }

  try {
    const event = JSON.parse(payload);
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const payment = event?.payload?.payment?.entity;
    const orderId = payment?.order_id;
    if (event.event === "payment.captured" && orderId) {
      const { data: paymentRows, error: paymentLookupError } = await supabase
        .from("payments")
        .select("booking_id")
        .eq("provider_order_id", orderId)
        .limit(1);

      if (paymentLookupError) throw paymentLookupError;
      const bookingId = paymentRows?.[0]?.booking_id;

      if (bookingId) {
        await supabase
          .from("payments")
          .update({
            provider_payment_id: payment.id,
            status: "PAID",
            paid_at: new Date((payment.created_at || Date.now() / 1000) * 1000).toISOString()
          })
          .eq("provider_order_id", orderId);

        await supabase
          .from("bookings")
          .update({ payment_status: "PAID", booking_status: "CONFIRMED" })
          .eq("id", bookingId);
      }
    }

    return jsonResponse({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed.";
    return jsonResponse({ success: false, message }, 500);
  }
});
