import crypto from "crypto";
import Razorpay from "razorpay";

export type RazorpayOrderInput = {
  amount: number;
  currency?: string;
  receipt: string;
};

function getRazorpayCredentials() {
  // Keep the documented name canonical, while accepting the Vercel name shown
  // in the user's prior environment-variable screenshot.
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.Razorpay_Live_API_Key;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Missing Razorpay credentials.");
  }

  return { keyId, keySecret };
}

export function getRazorpayKeyId() {
  return getRazorpayCredentials().keyId;
}

export function getRazorpayClient() {
  const { keyId, keySecret } = getRazorpayCredentials();
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });
}

export async function createRazorpayOrder(input: RazorpayOrderInput) {
  const amount = Math.round(Number(input.amount));
  const currency = input.currency || "INR";

  if (!Number.isFinite(amount) || amount < 100) {
    throw new Error("Amount must be at least 100 paise.");
  }

  if (!input.receipt?.trim()) {
    throw new Error("Receipt is required.");
  }

  const razorpay = getRazorpayClient();
  return razorpay.orders.create({
    amount,
    currency,
    receipt: input.receipt
  });
}

export async function createRazorpayPaymentLink(input: {
  amount: number;
  currency?: string;
  referenceId: string;
  description: string;
  customer: { name: string; email?: string | null; contact?: string | null };
  bookingId: string;
  paymentLinkRecordId: string;
}) {
  const amount = Math.round(Number(input.amount));
  if (!Number.isFinite(amount) || amount < 100) {
    throw new Error("Payment link amount must be at least 100 paise.");
  }
  if (!input.referenceId.trim() || !input.bookingId || !input.paymentLinkRecordId) {
    throw new Error("Payment link reference is required.");
  }

  // Notifications are deliberately disabled here. Delivery is recorded separately
  // only after a configured channel explicitly confirms sending.
  return getRazorpayClient().paymentLink.create({
    amount,
    currency: input.currency || "INR",
    accept_partial: false,
    reference_id: input.referenceId.slice(0, 40),
    description: input.description.slice(0, 200),
    customer: {
      name: input.customer.name.slice(0, 120),
      ...(input.customer.email ? { email: input.customer.email.slice(0, 254) } : {}),
      ...(input.customer.contact ? { contact: input.customer.contact.replace(/\D/g, "").slice(-15) } : {})
    },
    notify: { email: false, sms: false },
    reminder_enable: false,
    notes: {
      booking_id: input.bookingId,
      booking_payment_link_id: input.paymentLinkRecordId
    }
  });
}

export function verifyRazorpaySignature(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  const { keySecret } = getRazorpayCredentials();
  const generatedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${params.razorpayOrderId}|${params.razorpayPaymentId}`)
    .digest("hex");

  const generatedBuffer = Buffer.from(generatedSignature);
  const receivedBuffer = Buffer.from(params.razorpaySignature);

  if (generatedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(generatedBuffer, receivedBuffer);
}

export function verifyRazorpayWebhookSignature(rawBody: string, signature: string) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret || !signature) return false;
  const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody, "utf8").digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(signature, "hex");
  return expectedBuffer.length === receivedBuffer.length && crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}
