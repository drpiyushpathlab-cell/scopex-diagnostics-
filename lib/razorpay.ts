import crypto from "crypto";
import Razorpay from "razorpay";

export type RazorpayOrderInput = {
  amount: number;
  currency?: string;
  receipt: string;
};

function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
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
