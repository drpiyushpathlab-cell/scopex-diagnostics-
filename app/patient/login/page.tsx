import type { Metadata } from "next";
import { OtpLoginCard } from "@/components/otp-login-card";
import { ShieldCheck, FileText, CheckCircle2, Lock, Sparkles, Smartphone, Award, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Patient Login | ScopeX Diagnostics",
  description: "OTP-based patient login for ScopeX Diagnostics bookings, family management, and verified NABL digital reports."
};

export default function PatientLoginPage() {
  return (
    <div className="bg-[#FFFFFF] min-h-[85vh] py-10 sm:py-16">
      <div className="section-wrap">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] items-center">
          {/* Left Column: Signature Carbon Black Diagnostic Showcase (Matching Homepage & User Theme) */}
          <div className="relative overflow-hidden rounded-3xl border border-stone-800 bg-[#0D0D0D] p-8 sm:p-12 text-white shadow-2xl">
            {/* Ambient warm orange glow */}
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-[#FF6B00]/25 blur-3xl pointer-events-none" />
            <div className="absolute left-1/4 bottom-0 h-48 w-48 rounded-full bg-[#FF6B00]/15 blur-3xl pointer-events-none" />

            <div className="relative z-10">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-stone-700 bg-stone-900/90 px-3.5 py-1 text-xs font-bold text-[#FF6B00]">
                <Sparkles className="h-3.5 w-3.5 text-[#FF6B00]" />
                <span>ScopeX Digital Health Pass</span>
              </div>

              {/* Headings */}
              <p className="mt-4 text-xs sm:text-sm font-bold uppercase tracking-wider text-stone-400">
                Digital Reports &amp; Clinical Trust
              </p>
              <h1 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.1]">
                Your Health Data. Always Within Reach.
              </h1>
              <p className="mt-3 text-xs sm:text-sm text-stone-300 leading-relaxed max-w-xl">
                Login securely using your registered 10-digit mobile number. Track ongoing doorstep phlebotomy visits, view past health markers, and download pathologist-verified reports anytime.
              </p>

              {/* 4 Carbon Black Trust Cards */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="rounded-2xl border border-stone-800 bg-stone-900/70 p-4 backdrop-blur-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-800 text-[#FF6B00] mb-2.5">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-bold text-white">NABL Standard Labs</h3>
                  <p className="mt-1 text-[11px] text-stone-400 leading-normal">
                    100% processed through accredited clinical reference centers with automated analyzers.
                  </p>
                </div>

                <div className="rounded-2xl border border-stone-800 bg-stone-900/70 p-4 backdrop-blur-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-800 text-[#FF6B00] mb-2.5">
                    <Smartphone className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-bold text-white">Zero Paper Hassle</h3>
                  <p className="mt-1 text-[11px] text-stone-400 leading-normal">
                    Instant encrypted PDF reports delivered directly to WhatsApp, SMS, and portal.
                  </p>
                </div>

                <div className="rounded-2xl border border-stone-800 bg-stone-900/70 p-4 backdrop-blur-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-800 text-[#FF6B00] mb-2.5">
                    <Clock className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-bold text-white">Cold-Chain Sample Safety</h3>
                  <p className="mt-1 text-[11px] text-stone-400 leading-normal">
                    Sealed sterile kits opened in front of you and transported in temperature-controlled boxes.
                  </p>
                </div>

                <div className="rounded-2xl border border-stone-800 bg-stone-900/70 p-4 backdrop-blur-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-800 text-[#FF6B00] mb-2.5">
                    <Award className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-bold text-white">MD Pathologist Verified</h3>
                  <p className="mt-1 text-[11px] text-stone-400 leading-normal">
                    Every diagnostic report is digitally validated and signed by registered doctors.
                  </p>
                </div>
              </div>

              {/* Bottom security strip */}
              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-stone-800 pt-5 text-xs text-stone-400">
                <span className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-emerald-400" />
                  <span>256-Bit Encrypted Patient Privacy</span>
                </span>
                <span className="font-semibold text-stone-300">
                  10,000+ Happy Families
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: OTP Login Card */}
          <div className="w-full">
            <OtpLoginCard
              title="Patient Portal Login"
              description="Enter your registered mobile number to receive a secure one-time verification code."
              redirectTo="/patient"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
