import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyRazorpaySignature } from "@/lib/razorpay";

export const runtime = "nodejs";

const verifyPaymentSchema = z.object({
  razorpay_payment_id: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_signature: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const parsed = verifyPaymentSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Missing payment verification fields." }, { status: 400 });
    }

    const isValid = verifyRazorpaySignature({
      razorpayOrderId: parsed.data.razorpay_order_id,
      razorpayPaymentId: parsed.data.razorpay_payment_id,
      razorpaySignature: parsed.data.razorpay_signature
    });

    if (!isValid) {
      return NextResponse.json({ success: false, message: "Invalid Razorpay signature." }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Payment verified successfully." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to verify payment.";
    const status = message.toLowerCase().includes("credential") ? 401 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
