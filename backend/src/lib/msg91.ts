import { backendEnv } from "@/backend/src/config/env";
import { HttpError } from "@/backend/src/lib/http-error";

type Msg91Response = {
  type?: string;
  message?: string;
  request_id?: string;
};

type Msg91Config = { authKey?: string; templateId?: string };
type FetchLike = typeof fetch;

export function normalizeIndianMobile(input: string | undefined | null) {
  const digits = (input ?? "").replace(/\D/g, "");

  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);

  return "";
}

export function toInternationalIndianMobile(mobile: string) {
  return `91${mobile}`;
}

export function createMsg91OtpSender(config: Msg91Config, fetcher: FetchLike = fetch) {
  return async (mobile: string, otp: string) => {
    if (!config.authKey || !config.templateId) {
      throw new HttpError(503, "OTP service is temporarily unavailable.", "OTP_PROVIDER_UNAVAILABLE");
    }

    const query = new URLSearchParams({
      template_id: config.templateId,
      mobile: toInternationalIndianMobile(mobile),
      otp,
      otp_length: "6",
      otp_expiry: "5"
    });

    let response: Response;
    try {
      response = await fetcher(`https://control.msg91.com/api/v5/otp?${query.toString()}`, {
        method: "POST",
        headers: { authkey: config.authKey, "content-type": "application/json" },
        body: "{}",
        cache: "no-store"
      });
    } catch {
      throw new HttpError(502, "OTP provider is temporarily unavailable.", "OTP_PROVIDER_UNAVAILABLE");
    }

    let payload: Msg91Response = {};
    try {
      payload = (await response.json()) as Msg91Response;
    } catch {
      // Treat malformed provider responses as a temporary provider failure.
    }

    if (!response.ok || payload.type !== "success") {
      throw new HttpError(502, "OTP provider could not send a code. Please try again.", "OTP_PROVIDER_UNAVAILABLE");
    }

    return { type: "success", request_id: payload.request_id };
  };
}

export const sendMsg91Otp = createMsg91OtpSender({
  authKey: backendEnv.MSG91_AUTH_KEY,
  templateId: backendEnv.MSG91_TEMPLATE_ID
});
