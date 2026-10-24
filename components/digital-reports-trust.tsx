import Link from "next/link";
import { CheckCircle2, ChevronRight, Download, FileText, Smartphone } from "lucide-react";

export function DigitalReportsTrust() {
  return (
    <section className="relative overflow-hidden bg-[#0D0D0D] text-white py-14 sm:py-20">
      {/* Background ambient warm orange glow on right */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 h-[450px] w-[450px] rounded-full bg-[#FF6B00]/25 blur-[120px] pointer-events-none" />

      <div className="section-wrap relative z-10">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          {/* Left Column: Headlines & Store Badges */}
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.12]">
                Digital Reports. <br />
                <span className="text-white">Anytime. Anywhere.</span>
              </h2>
              <p className="mt-4 text-sm sm:text-base text-stone-300 leading-relaxed max-w-lg">
                Access your reports, track your bookings and get expert guidance — all in one place.
              </p>
            </div>

            {/* App Store & Google Play Badges matching Option C mockup */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              {/* Google Play Badge */}
              <Link
                href="/patient/login"
                className="inline-flex items-center gap-3 rounded-xl border border-stone-700 bg-stone-900/90 px-4 py-2.5 transition hover:border-[#FF6B00] hover:bg-stone-800"
              >
                {/* Google Play Triangle SVG */}
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
                  <path d="M4 3.5v17l13.5-8.5L4 3.5Z" fill="#00D2FF" />
                  <path d="M4 3.5l10.5 10.5-3.5 3.5L4 3.5Z" fill="#00E676" />
                  <path d="M4 20.5l10.5-10.5-3.5-3.5L4 20.5Z" fill="#FFD600" />
                  <path d="M14.5 14l3-1.5L4 3.5l10.5 10.5Z" fill="#FF3D00" />
                </svg>
                <div className="text-left leading-none">
                  <p className="text-[9px] uppercase tracking-wider text-stone-400">GET IT ON</p>
                  <p className="text-xs font-bold text-white mt-0.5">Google Play</p>
                </div>
              </Link>

              {/* App Store Badge */}
              <Link
                href="/patient/login"
                className="inline-flex items-center gap-3 rounded-xl border border-stone-700 bg-stone-900/90 px-4 py-2.5 transition hover:border-[#FF6B00] hover:bg-stone-800"
              >
                {/* Apple SVG */}
                <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.66-.82 1.11-1.96.99-3.1-.96.04-2.13.65-2.8 1.44-.59.69-1.11 1.83-.97 2.94 1.07.08 2.16-.54 2.78-1.28Z" />
                </svg>
                <div className="text-left leading-none">
                  <p className="text-[9px] uppercase tracking-wider text-stone-400">Download on the</p>
                  <p className="text-xs font-bold text-white mt-0.5">App Store</p>
                </div>
              </Link>
            </div>

            {/* Direct Web Portal Link */}
            <div className="pt-1">
              <Link
                href="/patient"
                className="inline-flex items-center gap-2 text-xs font-bold text-[#FF6B00] hover:underline"
              >
                <span>Or open online Patient Web Portal →</span>
              </Link>
            </div>
          </div>

          {/* Right Column: High-Fidelity Smartphone Mockup (As shown in Option C) */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-[280px] sm:w-[320px] rounded-[44px] border-[6px] border-stone-800 bg-[#0D0D0D] p-3 shadow-[0_25px_60px_rgba(0,0,0,0.8)] ring-1 ring-white/10">
              {/* Phone Speaker & Notch */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 h-4 w-24 rounded-full bg-stone-900 z-20 flex items-center justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-stone-700" />
              </div>

              {/* Phone Screen Canvas */}
              <div className="relative overflow-hidden rounded-[34px] bg-white p-5 pt-8 text-[#0D0D0D] text-center shadow-inner">
                {/* Brand inside app screen */}
                <div className="mt-2 text-center">
                  <p className="text-sm font-black text-[#0D0D0D] tracking-tight">
                    SCOPEX <span className="text-[#FF6B00]">Diagnostics</span>
                  </p>
                  <p className="text-[9px] text-[#626262]">Your Health. Decoded.</p>
                </div>

                {/* Big Green Report Icon */}
                <div className="mt-8 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100">
                  <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M3 3v18h18" />
                    <path d="m19 9-5 5-4-4-3 3" />
                  </svg>
                </div>

                {/* Headline inside phone */}
                <h3 className="mt-4 text-base font-extrabold text-[#0D0D0D]">
                  Your Reports Are Ready
                </h3>
                <p className="mt-1 text-[11px] text-[#626262]">
                  Sample #SCX8921 processed &amp; verified by MD Pathologist.
                </p>

                {/* Orange View Report Button */}
                <div className="mt-6 mb-2">
                  <Link
                    href="/patient"
                    className="cta-btn block w-full rounded-xl py-3 text-xs font-extrabold uppercase tracking-wider text-white bg-[#FF6B00] shadow-[0_6px_20px_rgba(255,107,0,0.35)]"
                  >
                    View Report
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
