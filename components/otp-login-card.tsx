"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { storeVerifiedMobile } from "@/lib/otp-client";
import { storeAuthToken } from "@/lib/backend-client";
import { GoogleLoginButton } from "@/components/google-login-button";

type OtpLoginCardProps = {
  title?: string;
  description?: string;
  redirectTo?: string;
  mode?: "patient" | "admin";
};

type SendOtpResponse = {
  success?: boolean;
  message?: string;
  mobile?: string;
  debugOtp?: string;
  token?: string;
};

const mobileRegex = /^[6-9]\d{9}$/;

export function OtpLoginCard({
  title = "Patient Login",
  description = "Login with OTP to manage bookings, family members, offers, and reports.",
  redirectTo = "/patient",
  mode = "patient"
}: OtpLoginCardProps) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "verifying" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const canVerify = status === "sent" || status === "verifying" || status === "error" || status === "success";

  async function requestOtp() {
    const sanitizedPhone = phone.replace(/\D/g, "");
    if (!mobileRegex.test(sanitizedPhone)) {
      setStatus("error");
      setMessage("Enter a valid 10-digit mobile number.");
      return;
    }

    setStatus("sending");
    setMessage("");
    try {
      const response = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: sanitizedPhone })
      });
      const data = (await response.json().catch(() => ({ message: "OTP service returned an invalid response." }))) as SendOtpResponse;

      if (!response.ok) {
        setStatus("error");
        setMessage(data.message || "Unable to send OTP.");
        return;
      }

      setStatus("sent");
      setMessage(data.message || "OTP sent. Enter the 6-digit code to continue.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to send OTP.");
    }
  }

  async function verifyOtp() {
    const sanitizedPhone = phone.replace(/\D/g, "");
    setStatus("verifying");
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: sanitizedPhone, otp })
      });
      const data = await response.json().catch(() => ({ message: "OTP verification returned an invalid response." }));

      if (!response.ok) {
        setStatus("error");
        setMessage(data.message || "Unable to verify OTP.");
        return;
      }

      if (data.token) {
        storeAuthToken(data.token);
      }
      storeVerifiedMobile(sanitizedPhone);
      setStatus("success");
      setMessage(data.message || (mode === "admin" ? "Admin login successful." : "Patient login successful."));
      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to verify OTP.");
    }
  }

  return (
    <div className="rounded-[28px] border border-[#deece9] bg-white p-6 shadow-[0_16px_36px_rgba(16,24,40,0.06)]">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0f8f7c]">{mode === "admin" ? "Admin Access" : "OTP Login"}</p>
      <h1 className="mt-2 text-3xl font-bold text-[#102a2d] md:text-4xl">{title}</h1>
      <p className="mt-3 max-w-xl text-sm leading-7 text-[#5a7273] md:text-base">{description}</p>

      {mode === "patient" ? (
        <div className="mt-6 grid gap-3 md:max-w-md">
          <GoogleLoginButton />
          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.14em] text-[#8aa1a2]">
            <span className="h-px flex-1 bg-[#deece9]" />
            or continue with mobile OTP
            <span className="h-px flex-1 bg-[#deece9]" />
          </div>
        </div>
      ) : null}

      <div className={`${mode === "patient" ? "mt-4" : "mt-6"} grid gap-4 md:max-w-md`}>
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder="10-digit mobile number"
          inputMode="numeric"
          className="rounded-2xl border border-[#dbe9e7] bg-white px-4 py-3 text-sm text-[#102a2d] outline-none transition focus:border-[#0f8f7c]"
        />

        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={requestOtp} className="cta-btn w-full sm:w-auto" disabled={status === "sending" || status === "verifying"}>
            {status === "sending" ? "Sending OTP..." : "Send OTP"}
          </button>
          {canVerify ? (
            <input
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Enter OTP"
              inputMode="numeric"
              className="rounded-2xl border border-[#dbe9e7] bg-white px-4 py-3 text-sm text-[#102a2d] outline-none transition focus:border-[#0f8f7c]"
            />
          ) : null}
        </div>

        {canVerify ? (
          <button type="button" onClick={verifyOtp} className="secondary-btn w-full sm:w-fit" disabled={status === "verifying" || otp.length !== 6}>
            {status === "verifying" ? "Verifying..." : "Verify OTP"}
          </button>
        ) : null}
      </div>

      {message ? <p className={`mt-4 text-sm ${status === "error" ? "text-red-600" : "text-[#0f8f7c]"}`}>{message}</p> : null}
    </div>
  );
}
