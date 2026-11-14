import crypto from "crypto";
import { HttpError } from "@/backend/src/lib/http-error";
import { backendEnv } from "@/backend/src/config/env";
import { getSupabaseServiceClient } from "@/lib/supabase-server";

const OTP_TTL_MINUTES = 5;
const MAX_VERIFY_ATTEMPTS = 5;
export const OTP_CHALLENGE_COOKIE = "scopex_otp_challenge";

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

function getOtpSecret() {
  if (process.env.NODE_ENV === "production") {
    const secret = process.env.OTP_HASH_SECRET;
    if (!secret || secret.length < 32) {
      throw new HttpError(503, "OTP service is temporarily unavailable.", "OTP_PROVIDER_UNAVAILABLE");
    }
    return secret;
  }
  return backendEnv.OTP_HASH_SECRET || "scopex_demo_otp_secret_key_diagnostics_2026";
}

export function assertOtpSecurityConfigured() {
  getOtpSecret();
}

export function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

export function hashOtp(mobile: string, otp: string) {
  const secret = getOtpSecret();
  return crypto.createHash("sha256").update(`${mobile}:${otp}:${secret}`).digest("hex");
}

function signValue(value: string) {
  const secret = getOtpSecret();
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function encode(value: unknown) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function decode<T>(value: string) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
}

function getExpiryIso() {
  return new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();
}

export function getOtpChallengeMaxAgeSeconds() {
  return OTP_TTL_MINUTES * 60;
}

export function createOtpChallengeToken(mobile: string, otp: string) {
  const payload = encode({
    mobile,
    otp_hash: hashOtp(mobile, otp),
    expires_at: getExpiryIso()
  });
  return `${payload}.${signValue(payload)}`;
}

export function verifyOtpChallengeToken(token: string | undefined | null, mobile: string, otp: string) {
  if (!token) {
    throw new HttpError(404, "No OTP request found. Please request a new code.", "OTP_EXPIRED");
  }

  const [payload, signature] = token.split(".");
  if (!payload || !signature) {
    throw new HttpError(400, "OTP request is invalid. Please request a new code.", "OTP_INVALID");
  }

  const expectedSignature = signValue(payload);
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    throw new HttpError(400, "OTP request is invalid. Please request a new code.", "OTP_INVALID");
  }

  const data = decode<{ mobile: string; otp_hash: string; expires_at: string }>(payload);
  if (data.mobile !== mobile) {
    throw new HttpError(400, "OTP was requested for a different mobile number.", "OTP_INVALID");
  }

  if (new Date(data.expires_at).getTime() < Date.now()) {
    throw new HttpError(400, "OTP expired. Please request a new code.", "OTP_EXPIRED");
  }

  if (hashOtp(mobile, otp) !== data.otp_hash) {
    throw new HttpError(400, "Invalid OTP. Please try again.", "OTP_INVALID");
  }
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

function warnLocalFallback(action: string, sqlState?: string) {
  console.warn("[OTP] Supabase operation failed; using local fallback.", {
    operation: action,
    sqlState: sqlState || "unknown"
  });
}

export async function persistOtpRequest(params: {
  mobile: string;
  otp: string;
  providerResponse: unknown;
}) {
  const supabase = getSupabaseServiceClient();
  const { error: deleteError } = await supabase
    .from("otp_verification")
    .delete()
    .eq("mobile", params.mobile)
    .is("verified_at", null);

  if (deleteError) {
    if (canUseLocalOtpFallback()) {
      warnLocalFallback("delete", deleteError.code);
      persistLocalOtp(params);
      return;
    }
    throw new HttpError(503, "OTP verification service is temporarily unavailable.", "OTP_PROVIDER_UNAVAILABLE");
  }

  const { error } = await supabase
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
      warnLocalFallback("insert", error.code);
      persistLocalOtp(params);
      return;
    }
    throw new HttpError(503, "OTP verification service is temporarily unavailable.", "OTP_PROVIDER_UNAVAILABLE");
  }

  const { error: logError } = await supabase
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
      warnLocalFallback("audit insert", logError.code);
      return;
    }
    throw new HttpError(503, "OTP verification service is temporarily unavailable.", "OTP_PROVIDER_UNAVAILABLE");
  }
}

export async function verifyPersistedOtp(mobile: string, otp: string) {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("otp_verification")
    .select("id, otp_hash, attempts, expires_at, verified_at")
    .eq("mobile", mobile)
    .is("verified_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (canUseLocalOtpFallback()) {
      warnLocalFallback("fetch", error.code);
      verifyLocalOtp(mobile, otp);
      return;
    }
    throw new HttpError(503, "OTP verification service is temporarily unavailable.", "OTP_PROVIDER_UNAVAILABLE");
  }

  if (!data) {
    if (canUseLocalOtpFallback()) {
      verifyLocalOtp(mobile, otp);
      return;
    }
    throw new HttpError(404, "No OTP request found. Please request a new code.", "OTP_EXPIRED");
  }

  if (new Date(data.expires_at).getTime() < Date.now()) {
    await supabase.from("otp_verification").delete().eq("id", data.id);
    throw new HttpError(400, "OTP expired. Please request a new code.", "OTP_EXPIRED");
  }

  if ((data.attempts ?? 0) >= MAX_VERIFY_ATTEMPTS) {
    throw new HttpError(429, "Too many incorrect attempts. Request a new OTP.");
  }

  if (hashOtp(mobile, otp) !== data.otp_hash) {
    await supabase
      .from("otp_verification")
      .update({ attempts: (data.attempts ?? 0) + 1, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    throw new HttpError(400, "Invalid OTP. Please try again.", "OTP_INVALID");
  }

  const { error: updateError } = await supabase
    .from("otp_verification")
    .update({ verified_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", data.id);

  if (updateError) {
    if (canUseLocalOtpFallback()) {
      warnLocalFallback("verify update", updateError.code);
      return;
    }
    throw new HttpError(503, "OTP verification service is temporarily unavailable.", "OTP_PROVIDER_UNAVAILABLE");
  }
}

function verifyLocalOtp(mobile: string, otp: string) {
  const data = localOtpStore.get(mobile);

  if (!data || data.verified_at) {
    throw new HttpError(404, "No OTP request found. Please request a new code.", "OTP_EXPIRED");
  }

  if (new Date(data.expires_at).getTime() < Date.now()) {
    localOtpStore.delete(mobile);
    throw new HttpError(400, "OTP expired. Please request a new code.", "OTP_EXPIRED");
  }

  if (data.attempts >= MAX_VERIFY_ATTEMPTS) {
    throw new HttpError(429, "Too many incorrect attempts. Request a new OTP.");
  }

  if (hashOtp(mobile, otp) !== data.otp_hash) {
    data.attempts += 1;
    localOtpStore.set(mobile, data);
    throw new HttpError(400, "Invalid OTP. Please try again.", "OTP_INVALID");
  }

  data.verified_at = new Date().toISOString();
  localOtpStore.set(mobile, data);
}
