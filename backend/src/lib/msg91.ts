import { backendEnv } from "@/backend/src/config/env";
import { HttpError } from "@/backend/src/lib/http-error";

type Msg91Response = {
  type?: string;
  message?: string;
  request_id?: string;
};

export function normalizeIndianMobile(input: string | undefined | null) {
  const digits = (input ?? "").replace(/\D/g, "");

  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);

  return "";
}

export function toInternationalIndianMobile(mobile: string) {
  return `91${mobile}`;
}

export async function sendMsg91Otp(mobile: string, otp: string) {
  if (!backendEnv.MSG91_AUTH_KEY) {
    throw new HttpError(500, "MSG91 OTP credentials are not configured.");
  }

  if (!backendEnv.MSG91_DLT_TEMPLATE_ID) {
    throw new HttpError(500, "MSG91 DLT Template ID is not configured.");
  }

  const message = `Dear Customer, your OTP for login to your Scopex Diagnostics account is ${otp}. This OTP is valid for 5 minutes. Please do not share it with anyone`;
  const query = new URLSearchParams({
    authkey: backendEnv.MSG91_AUTH_KEY,
    mobile: toInternationalIndianMobile(mobile),
    sender: backendEnv.MSG91_SENDER_ID,
    otp,
    message,
    DLT_TE_ID: backendEnv.MSG91_DLT_TEMPLATE_ID
  });

  const response = await fetch(`https://control.msg91.com/api/sendotp.php?${query.toString()}`, {
    method: "GET",
    cache: "no-store"
  });

  const raw = await response.text();
  let payload: Msg91Response = {};
  try {
    payload = raw ? (JSON.parse(raw) as Msg91Response) : {};
  } catch {
    payload = { message: raw };
  }

  if (!response.ok || payload.type === "error") {
    throw new HttpError(502, payload.message || "MSG91 OTP delivery failed.");
  }

  return payload;
}
