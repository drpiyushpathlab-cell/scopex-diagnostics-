import crypto from "crypto";

export const PATIENT_SESSION_COOKIE = "scopex_patient_session";

type PatientSessionPayload = {
  mobile: string;
  verifiedAt: string;
};

function getSessionSecret() {
  return process.env.PATIENT_SESSION_SECRET || process.env.OTP_HASH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

export function createPatientSessionToken(payload: PatientSessionPayload) {
  const secret = getSessionSecret();

  if (!secret) {
    throw new Error("Missing patient session secret.");
  }

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto.createHmac("sha256", secret).update(encodedPayload).digest("base64url");
  return `${encodedPayload}.${signature}`;
}

export function verifyPatientSessionToken(token: string | undefined | null) {
  if (!token) return null;

  const secret = getSessionSecret();
  if (!secret) return null;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = crypto.createHmac("sha256", secret).update(encodedPayload).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as PatientSessionPayload;
    if (!payload.mobile) return null;
    return payload;
  } catch {
    return null;
  }
}
