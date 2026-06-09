import crypto from "crypto";
import { Router } from "express";
import { z } from "zod";
import { asyncRoute } from "@/backend/src/lib/async-route";
import { backendEnv } from "@/backend/src/config/env";
import { insforge } from "@/backend/src/lib/insforge";
import { HttpError } from "@/backend/src/lib/http-error";
import { requireAuth, type AuthedRequest } from "@/backend/src/middleware/auth";
import { sendAdminNotification } from "@/backend/src/services/email";

const createOrderSchema = z.object({
  amount: z.number().positive(),
  receipt: z.string().min(1),
  notes: z.record(z.string(), z.string()).optional().default({})
});

const verifyPaymentSchema = z.object({
  orderId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
  amount: z.number().positive()
});

export const paymentsRouter = Router();

paymentsRouter.post(
  "/create-order",
  requireAuth("patient"),
  asyncRoute(async (request: AuthedRequest, response) => {
    const parsed = createOrderSchema.parse(request.body);

    const auth = Buffer.from(`${backendEnv.RAZORPAY_KEY_ID}:${backendEnv.RAZORPAY_KEY_SECRET}`).toString("base64");
    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: Math.round(parsed.amount * 100),
        currency: "INR",
        receipt: parsed.receipt,
        notes: parsed.notes
      })
    });

    const raw = await razorpayResponse.text();
    const data = raw ? JSON.parse(raw) : {};

    if (!razorpayResponse.ok) {
      throw new HttpError(502, data.error?.description || "Unable to create Razorpay order.");
    }

    response.json({
      ...data,
      keyId: backendEnv.RAZORPAY_KEY_ID
    });
  })
);

paymentsRouter.post(
  "/verify",
  requireAuth("patient"),
  asyncRoute(async (request: AuthedRequest, response) => {
    const auth = request.auth;
    const parsed = verifyPaymentSchema.parse(request.body);
    const signature = crypto
      .createHmac("sha256", backendEnv.RAZORPAY_KEY_SECRET)
      .update(`${parsed.razorpayOrderId}|${parsed.razorpayPaymentId}`)
      .digest("hex");

    if (signature !== parsed.razorpaySignature) {
      throw new HttpError(400, "Invalid Razorpay signature.");
    }

    const { data: booking, error: bookingFetchError } = await insforge.database
      .from("bookings")
      .select("id, user_id, payment_method, payable_amount, advance_amount")
      .eq("id", parsed.orderId)
      .eq("user_id", auth?.userId)
      .maybeSingle();

    if (bookingFetchError || !booking) {
      throw new HttpError(404, bookingFetchError?.message || "Booking not found.");
    }

    const bookingRow = booking as {
      payment_method?: string;
      payable_amount?: number | string;
      advance_amount?: number | string;
    };
    const expectedFullAmount = Number(bookingRow.payable_amount ?? 0);
    const expectedAdvanceAmount = Number(bookingRow.advance_amount ?? 0);
    const isCodAdvance = bookingRow.payment_method === "cod" && parsed.amount >= expectedAdvanceAmount && parsed.amount < expectedFullAmount;
    const isFullPayment = parsed.amount >= expectedFullAmount;

    if (!isCodAdvance && !isFullPayment) {
      throw new HttpError(400, "Payment amount does not match booking amount.");
    }

    const paymentStatus = isFullPayment ? "paid" : "advance_paid";

    const { error: paymentError } = await insforge.database.from("payments").insert({
      booking_id: parsed.orderId,
      provider: "razorpay",
      provider_order_id: parsed.razorpayOrderId,
      provider_payment_id: parsed.razorpayPaymentId,
      provider_signature: parsed.razorpaySignature,
      amount: parsed.amount,
      status: paymentStatus
    });

    if (paymentError) {
      throw new HttpError(500, paymentError.message || "Unable to save payment.");
    }

    const { error: bookingError } = await insforge.database
      .from("bookings")
      .update({ payment_status: paymentStatus, booking_status: "confirmed", locked_at: new Date().toISOString(), is_draft: false })
      .eq("id", parsed.orderId);

    if (bookingError) {
      throw new HttpError(500, bookingError.message || "Unable to confirm booking payment.");
    }
    void sendAdminNotification("admin_payment_received", "ScopeX payment received", {
      bookingId: parsed.orderId,
      razorpayOrderId: parsed.razorpayOrderId,
      razorpayPaymentId: parsed.razorpayPaymentId,
      amount: parsed.amount,
      status: paymentStatus
    });

    response.json({ success: true });
  })
);
