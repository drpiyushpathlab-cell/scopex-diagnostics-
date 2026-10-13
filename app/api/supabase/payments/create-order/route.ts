import { NextResponse } from "next/server";
import { z } from "zod";
import { createRazorpayOrder, getRazorpayKeyId } from "@/lib/razorpay";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { calculatePayablePaise } from "@/lib/supabase-booking";

export const runtime = "nodejs";

const paymentOrderSchema = z.object({
  bookingId: z.string().uuid()
});

export async function POST(request: Request) {
  try {
    const parsed = paymentOrderSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "bookingId is required." }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, booking_number, payable_amount, payment_status")
      .eq("id", parsed.data.bookingId)
      .single();

    if (bookingError) throw bookingError;
    if (booking.payment_status === "PAID") {
      return NextResponse.json({ success: false, message: "This booking is already paid." }, { status: 409 });
    }

    const amount = calculatePayablePaise(Number(booking.payable_amount));
    const order = await createRazorpayOrder({
      amount,
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

    await supabase.from("bookings").update({ booking_status: "PAYMENT_STARTED" }).eq("id", booking.id);

    return NextResponse.json({
      success: true,
      id: order.id,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: getRazorpayKeyId(),
      key_id: getRazorpayKeyId()
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create payment order.";
    const status = message.toLowerCase().includes("credential") ? 401 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
