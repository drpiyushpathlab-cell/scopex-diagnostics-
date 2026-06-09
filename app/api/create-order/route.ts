import { NextResponse } from "next/server";
import { z } from "zod";
import { createRazorpayOrder, getRazorpayKeyId } from "@/lib/razorpay";

export const runtime = "nodejs";

const createOrderSchema = z.object({
  amount: z.coerce.number().int().min(100, "Amount must be at least 100 paise."),
  currency: z.string().default("INR"),
  receipt: z.string().min(1, "Receipt is required.")
});

export async function POST(request: Request) {
  try {
    const parsed = createOrderSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: parsed.error.issues[0]?.message || "Invalid request." }, { status: 400 });
    }

    const order = await createRazorpayOrder(parsed.data);

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
    const razorpayError = error as {
      statusCode?: number;
      error?: { description?: string };
      message?: string;
    };
    const message =
      razorpayError.error?.description ||
      razorpayError.message ||
      "Unable to create Razorpay order.";
    const status = razorpayError.statusCode === 401 || message.toLowerCase().includes("credential") ? 401 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
