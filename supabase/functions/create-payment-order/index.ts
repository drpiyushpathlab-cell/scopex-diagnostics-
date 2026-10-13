import Razorpay from "npm:razorpay@2.9.6";
import { createClient } from "npm:@supabase/supabase-js@2.49.4";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ success: false, message: "Method not allowed." }, 405);

  try {
    const { bookingId } = await request.json();
    if (!bookingId) return jsonResponse({ success: false, message: "bookingId is required." }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, booking_number, payable_amount, payment_status")
      .eq("id", bookingId)
      .single();

    if (bookingError) throw bookingError;
    if (booking.payment_status === "PAID") {
      return jsonResponse({ success: false, message: "This booking is already paid." }, 409);
    }

    const razorpay = new Razorpay({
      key_id: Deno.env.get("RAZORPAY_KEY_ID")!,
      key_secret: Deno.env.get("RAZORPAY_KEY_SECRET")!
    });

    const order = await razorpay.orders.create({
      amount: Math.max(100, Math.round(Number(booking.payable_amount) * 100)),
      currency: "INR",
      receipt: booking.booking_number || booking.id
    });

    const { error: paymentError } = await supabase.from("payments").insert({
      booking_id: booking.id,
      provider: "razorpay",
      provider_order_id: order.id,
      amount: Number(booking.payable_amount),
      currency: order.currency || "INR",
      status: "PENDING"
    });
    if (paymentError) throw paymentError;

    return jsonResponse({
      success: true,
      id: order.id,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: Deno.env.get("RAZORPAY_KEY_ID")
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create payment order.";
    return jsonResponse({ success: false, message }, 500);
  }
});
