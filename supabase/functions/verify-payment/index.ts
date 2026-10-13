import { createHmac } from "node:crypto";
import { createClient } from "npm:@supabase/supabase-js@2.49.4";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

function verifySignature(orderId: string, paymentId: string, signature: string) {
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET")!;
  const expected = createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  return expected === signature;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ success: false, message: "Method not allowed." }, 405);

  try {
    const body = await request.json();
    const { bookingId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = body;
    if (!bookingId || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return jsonResponse({ success: false, message: "Missing payment verification fields." }, 400);
    }

    if (!verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      return jsonResponse({ success: false, message: "Invalid Razorpay signature." }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: paymentError } = await supabase
      .from("payments")
      .update({
        provider_payment_id: razorpay_payment_id,
        provider_signature: razorpay_signature,
        status: "PAID",
        paid_at: new Date().toISOString()
      })
      .eq("booking_id", bookingId)
      .eq("provider_order_id", razorpay_order_id);

    if (paymentError) throw paymentError;

    const { error: bookingError } = await supabase
      .from("bookings")
      .update({ payment_status: "PAID", booking_status: "CONFIRMED" })
      .eq("id", bookingId);

    if (bookingError) throw bookingError;

    return jsonResponse({ success: true, message: "Payment verified successfully." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to verify payment.";
    return jsonResponse({ success: false, message }, 500);
  }
});
