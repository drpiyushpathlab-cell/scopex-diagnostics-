import crypto from "crypto";
import { insforge } from "@/backend/src/lib/insforge";
import { HttpError } from "@/backend/src/lib/http-error";
import { backendEnv } from "@/backend/src/config/env";

const OTP_TTL_MINUTES = 5;
const MAX_VERIFY_ATTEMPTS = 5;

type LocalOtpRecord = {
  id: string;
  mobile: string;
  otp_hash: string;
  attempts: number;
  expires_at: string;
  verified_at: string | null;
  provider_response: unknown;
};

const localOtpStore = new Map<string, LocalOtpRecord>();

export function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

export function hashOtp(mobile: string, otp: string) {
  return crypto.createHash("sha256").update(`${mobile}:${otp}:${backendEnv.OTP_HASH_SECRET}`).digest("hex");
}

function getExpiryIso() {
  return new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();
}

function canUseLocalOtpFallback() {
  return process.env.NODE_ENV !== "production" || process.env.ALLOW_DEBUG_OTP === "true";
}

function persistLocalOtp(params: { mobile: string; otp: string; providerResponse: unknown }) {
  localOtpStore.set(params.mobile, {
    id: crypto.randomUUID(),
    mobile: params.mobile,
    otp_hash: hashOtp(params.mobile, params.otp),
    attempts: 0,
    expires_at: getExpiryIso(),
    verified_at: null,
    provider_response: params.providerResponse
  });
}

function warnLocalFallback(action: string, message?: string) {
  console.warn(`[OTP] InsForge ${action} failed. Using local OTP fallback. ${message ?? ""}`.trim());
}

export async function persistOtpRequest(params: {
  mobile: string;
  otp: string;
  providerResponse: unknown;
}) {
  const { error: deleteError } = await insforge.database
    .from("otp_verification")
    .delete()
    .eq("mobile", params.mobile)
    .is("verified_at", null);

  if (deleteError) {
    if (canUseLocalOtpFallback()) {
      warnLocalFallback("delete", deleteError.message);
      persistLocalOtp(params);
      return;
    }
    throw new HttpError(500, deleteError.message || "Unable to clear previous OTP request.");
  }

  const { error } = await insforge.database
    .from("otp_verification")
    .insert({
      mobile: params.mobile,
      otp_hash: hashOtp(params.mobile, params.otp),
      attempts: 0,
      expires_at: getExpiryIso(),
      provider_response: params.providerResponse
    });

  if (error) {
    if (canUseLocalOtpFallback()) {
      warnLocalFallback("insert", error.message);
      persistLocalOtp(params);
      return;
    }
    throw new HttpError(500, error.message || "Unable to persist OTP request.");
  }

  const { error: logError } = await insforge.database
    .from("otp_logs")
    .insert({
      mobile: params.mobile,
      otp_hash: hashOtp(params.mobile, params.otp),
      attempts: 0,
      expires_at: getExpiryIso(),
      provider_response: params.providerResponse
    });

  if (logError) {
    if (canUseLocalOtpFallback()) {
      warnLocalFallback("audit insert", logError.message);
      return;
    }
    throw new HttpError(500, logError.message || "Unable to persist OTP audit log.");
  }
}

export async function verifyPersistedOtp(mobile: string, otp: string) {
  const { data, error } = await insforge.database
    .from("otp_verification")
    .select("id, otp_hash, attempts, expires_at, verified_at")
    .eq("mobile", mobile)
    .is("verified_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (canUseLocalOtpFallback()) {
      warnLocalFallback("fetch", error.message);
      verifyLocalOtp(mobile, otp);
      return;
    }
    throw new HttpError(500, error.message || "Unable to fetch OTP request.");
  }

  if (!data) {
    if (canUseLocalOtpFallback()) {
      verifyLocalOtp(mobile, otp);
      return;
    }
    throw new HttpError(404, "No OTP request found for this mobile number.");
  }

  if (new Date(data.expires_at).getTime() < Date.now()) {
    await insforge.database.from("otp_verification").delete().eq("id", data.id);
    throw new HttpError(400, "OTP expired. Please request a new code.");
  }

  if ((data.attempts ?? 0) >= MAX_VERIFY_ATTEMPTS) {
    throw new HttpError(429, "Too many incorrect attempts. Request a new OTP.");
  }

  if (hashOtp(mobile, otp) !== data.otp_hash) {
    await insforge.database
      .from("otp_verification")
      .update({ attempts: (data.attempts ?? 0) + 1, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    throw new HttpError(400, "Invalid OTP. Please try again.");
  }

  const { error: updateError } = await insforge.database
    .from("otp_verification")
    .update({ verified_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", data.id);

  if (updateError) {
    if (canUseLocalOtpFallback()) {
      warnLocalFallback("verify update", updateError.message);
      return;
    }
    throw new HttpError(500, updateError.message || "Unable to mark OTP as verified.");
  }
}

function verifyLocalOtp(mobile: string, otp: string) {
  const data = localOtpStore.get(mobile);

  if (!data || data.verified_at) {
    throw new HttpError(404, "No OTP request found for this mobile number.");
  }

  if (new Date(data.expires_at).getTime() < Date.now()) {
    localOtpStore.delete(mobile);
    throw new HttpError(400, "OTP expired. Please request a new code.");
  }

  if (data.attempts >= MAX_VERIFY_ATTEMPTS) {
    throw new HttpError(429, "Too many incorrect attempts. Request a new OTP.");
  }

  if (hashOtp(mobile, otp) !== data.otp_hash) {
    data.attempts += 1;
    localOtpStore.set(mobile, data);
    throw new HttpError(400, "Invalid OTP. Please try again.");
  }

  data.verified_at = new Date().toISOString();
  localOtpStore.set(mobile, data);
}
