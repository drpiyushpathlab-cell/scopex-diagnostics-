import assert from "node:assert/strict";
import crypto from "node:crypto";
import { afterEach, test } from "node:test";
import { isBookingPaid } from "@/lib/supabase-booking-payment";
import { getRazorpayKeyId, verifyRazorpayWebhookSignature } from "@/lib/razorpay";

const originalWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
const originalKeyId = process.env.RAZORPAY_KEY_ID;
const originalLegacyKeyId = process.env.Razorpay_Live_API_Key;
const originalKeySecret = process.env.RAZORPAY_KEY_SECRET;
afterEach(() => {
  if (originalWebhookSecret === undefined) delete process.env.RAZORPAY_WEBHOOK_SECRET;
  else process.env.RAZORPAY_WEBHOOK_SECRET = originalWebhookSecret;
  if (originalKeyId === undefined) delete process.env.RAZORPAY_KEY_ID;
  else process.env.RAZORPAY_KEY_ID = originalKeyId;
  if (originalLegacyKeyId === undefined) delete process.env.Razorpay_Live_API_Key;
  else process.env.Razorpay_Live_API_Key = originalLegacyKeyId;
  if (originalKeySecret === undefined) delete process.env.RAZORPAY_KEY_SECRET;
  else process.env.RAZORPAY_KEY_SECRET = originalKeySecret;
});

test("only verified paid state blocks creation of another collection link", () => {
  assert.equal(isBookingPaid("PAID"), true);
  assert.equal(isBookingPaid("paid"), true);
  assert.equal(isBookingPaid("PENDING"), false);
  assert.equal(isBookingPaid(undefined), false);
});

test("webhook verification uses the raw body and rejects tampering", () => {
  const secret = "test-only-webhook-secret";
  const rawBody = '{"event":"payment_link.paid","payload":{}}';
  process.env.RAZORPAY_WEBHOOK_SECRET = secret;
  const signature = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");

  assert.equal(verifyRazorpayWebhookSignature(rawBody, signature), true);
  assert.equal(verifyRazorpayWebhookSignature(`${rawBody} `, signature), false);
  assert.equal(verifyRazorpayWebhookSignature(rawBody, "bad-signature"), false);
});

test("webhook verification fails closed when its secret is absent", () => {
  delete process.env.RAZORPAY_WEBHOOK_SECRET;
  assert.equal(verifyRazorpayWebhookSignature("{}", "anything"), false);
});

test("Razorpay accepts the legacy Vercel key-id variable name as a fallback", () => {
  delete process.env.RAZORPAY_KEY_ID;
  process.env.Razorpay_Live_API_Key = "test-key-id";
  process.env.RAZORPAY_KEY_SECRET = "test-key-secret";
  assert.equal(getRazorpayKeyId(), "test-key-id");
});
