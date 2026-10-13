import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { requirePatientAuth } from "@/lib/supabase-patient";

export const runtime = "nodejs";

const verifySchema = z.object({
  bookingId: z.string().uuid(),
  razorpay_payment_id: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_signature: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const parsed = verifySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Missing payment verification fields." }, { status: 400 });
    }

    const auth = requirePatientAuth(request);
    const isValid = verifyRazorpaySignature({
      razorpayOrderId: parsed.data.razorpay_order_id,
      razorpayPaymentId: parsed.data.razorpay_payment_id,
      razorpaySignature: parsed.data.razorpay_signature
    });

    if (!isValid) {
      return NextResponse.json({ success: false, message: "Invalid Razorpay signature." }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();
    const { data: booking, error: bookingLookupError } = await supabase
      .from("bookings")
      .select("id, user_id")
      .eq("id", parsed.data.bookingId)
      .maybeSingle();
    if (bookingLookupError) throw bookingLookupError;
    if (!booking || booking.user_id !== auth.userId) {
      return NextResponse.json({ success: false, message: "Booking not found for this account." }, { status: 404 });
    }

    const { error: paymentError } = await supabase
      .from("payments")
      .update({
        provider_payment_id: parsed.data.razorpay_payment_id,
        provider_signature: parsed.data.razorpay_signature,
        status: "PAID",
        raw_payload: parsed.data,
        updated_at: new Date().toISOString()
      })
      .eq("booking_id", parsed.data.bookingId)
      .eq("provider_order_id", parsed.data.razorpay_order_id);

    if (paymentError) throw paymentError;

    const { error: bookingError } = await supabase
      .from("bookings")
      .update({ payment_status: "PAID", booking_status: "CONFIRMED" })
      .eq("id", parsed.data.bookingId);

    if (bookingError) throw bookingError;

    return NextResponse.json({ success: true, message: "Payment verified successfully." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to verify payment.";
    const status = message.toLowerCase().includes("credential") ? 401 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
