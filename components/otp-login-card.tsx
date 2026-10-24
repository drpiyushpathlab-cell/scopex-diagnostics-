"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, Smartphone, CheckCircle2, ArrowRight } from "lucide-react";
import { storeVerifiedMobile } from "@/lib/otp-client";
import { storeAuthToken } from "@/lib/backend-client";

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
  title = "Patient Portal Login",
  description = "Login securely with OTP to manage your family, home collection bookings, and verified NABL digital reports.",
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
      setMessage("Please enter a valid 10-digit Indian mobile number.");
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
      setMessage(data.message || "OTP sent successfully. Enter the 6-digit code below.");
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
    <div className="mx-auto max-w-lg overflow-hidden rounded-3xl border border-[#EAEAEA] bg-white shadow-[0_20px_50px_rgba(13,13,13,0.08)]">
      {/* Signature Carbon Black Header Card with Ambient Glow */}
      <div className="relative overflow-hidden bg-[#0D0D0D] p-6 sm:p-8 text-white border-b border-stone-800">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[#FF6B00]/25 blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-stone-700 bg-stone-900/90 px-3 py-1 text-[11px] font-semibold text-[#FF6B00]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#FF6B00]" />
            <span>{mode === "admin" ? "Administrative Access" : "ScopeX Health Pass"}</span>
          </div>
          <h1 className="mt-3 text-2xl sm:text-3xl font-black text-white tracking-tight">
            {title}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-stone-300 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      {/* Form Content Area */}
      <div className="p-6 sm:p-8 space-y-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#0D0D0D] mb-1.5">
            Registered Mobile Number
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-xs font-bold text-[#626262]">
              +91
            </span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="98765 43210"
              inputMode="numeric"
              maxLength={10}
              className="w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] pl-12 pr-4 py-3 text-sm font-bold text-[#0D0D0D] placeholder-[#8A8A8A] focus:border-[#FF6B00] focus:bg-white focus:outline-none transition"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={requestOtp}
          disabled={status === "sending" || status === "verifying" || phone.length !== 10}
          className="cta-btn w-full justify-center disabled:opacity-50 cursor-pointer"
        >
          {status === "sending" ? "Sending Code..." : "Send Verification Code"}
        </button>

        {canVerify ? (
          <div className="pt-2 space-y-3.5 border-t border-[#EAEAEA]">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#0D0D0D] mb-1.5">
                Enter 6-Digit Code
              </label>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="• • • • • •"
                inputMode="numeric"
                maxLength={6}
                className="w-full text-center tracking-[0.3em] rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-4 py-3 text-lg font-black text-[#0D0D0D] focus:border-[#FF6B00] focus:bg-white focus:outline-none transition"
              />
            </div>

            <button
              type="button"
              onClick={verifyOtp}
              disabled={status === "verifying" || otp.length !== 6}
              className="w-full rounded-xl bg-[#0D0D0D] py-3 text-xs font-extrabold uppercase tracking-wider text-white hover:bg-[#FF6B00] transition disabled:opacity-50 cursor-pointer"
            >
              {status === "verifying" ? "Verifying..." : "Verify & Access Workspace"}
            </button>
          </div>
        ) : null}

        {message ? (
          <div
            className={`rounded-xl px-4 py-3 text-xs font-semibold ${
              status === "error"
                ? "bg-red-50 text-red-600 border border-red-200"
                : "bg-[#FFF4E8] text-[#FF6B00] border border-[#FFD9C0]"
            }`}
          >
            {message}
          </div>
        ) : null}

        {/* Trust Badges */}
        <div className="pt-4 border-t border-[#EAEAEA] grid grid-cols-2 gap-3 text-[11px] font-semibold text-[#626262]">
          <div className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-[#FF6B00]" />
            <span>256-Bit SSL Encrypted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>NABL Certified Reports</span>
          </div>
        </div>
      </div>
    </div>
  );
}
