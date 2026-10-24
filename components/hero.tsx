"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  ShieldCheck,
  ArrowRight,
  ChevronRight,
  FileText,
  Phone,
  Home,
  Clock,
  Sparkles
} from "lucide-react";
import { UploadPrescriptionModal } from "@/components/upload-prescription-modal";
import { HealthAdvisorModal } from "@/components/health-advisor-modal";

export function Hero() {
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [advisorModalOpen, setAdvisorModalOpen] = useState(false);

  return (
    <section id="hero" className="relative overflow-hidden bg-white pb-10 pt-4 sm:pb-14 sm:pt-6 md:pb-16 md:pt-8">
      <div className="section-wrap">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-14">
          {/* Left Column: Eyebrow, Giant Headline, Subtitle, 3 Trust Icons, CTAs, Quick Actions */}
          <div className="space-y-4 sm:space-y-5">
            {/* 1. NABL Quality Labs Pill Badge */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#FFD9C0] bg-[#FFF4E8] px-3.5 py-1.5 text-xs font-bold text-[#FF6B00]">
                <ShieldCheck className="h-4 w-4 text-[#FF6B00] shrink-0" />
                <span>NABL Quality Labs · Trusted by 10,000+ Families</span>
              </div>
            </div>

            {/* 2. Bold High-Contrast Editorial Headline - Matching Option C */}
            <h1 className="tracking-tight">
              <span className="block text-[2.35rem] sm:text-[3.2rem] lg:text-[3.75rem] font-black text-[#0D0D0D] leading-[1.06]">
                Blood Tests
              </span>
              <span className="block text-[2.35rem] sm:text-[3.2rem] lg:text-[3.75rem] font-black text-[#FF6B00] leading-[1.06]">
                at Home.
              </span>
            </h1>

            {/* 3. Subheading Brand Positioning */}
            <p className="text-base sm:text-lg font-bold text-[#0D0D0D] tracking-tight">
              Real Prices. Faster Diagnostics. Better Guidance.
            </p>

            {/* 4. 3 Trust Badges (Horizontal Icons matching Option C) */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-5 pt-1">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFF4E8] text-[#FF6B00]">
                  <Home className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-bold text-[#0D0D0D]">Home Collection in 30 Mins</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFF4E8] text-[#FF6B00]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-bold text-[#0D0D0D]">NABL Certified Labs</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFF4E8] text-[#FF6B00]">
                  <Clock className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-bold text-[#0D0D0D]">Same-Day Reports</span>
              </div>
            </div>

            {/* 5. Dual Action CTA Buttons */}
            <div className="flex flex-col gap-2.5 w-full pt-2 sm:flex-row sm:items-center sm:gap-3.5 sm:w-auto">
              <Link
                href="/book-home-collection"
                className="cta-btn flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl px-7 sm:px-8 py-3.5 text-xs sm:text-sm font-extrabold tracking-wider uppercase text-white shadow-[0_8px_24px_rgba(255,107,0,0.32)] transition-all hover:bg-[#E85900] whitespace-nowrap min-h-[48px] sm:min-h-[50px] text-center"
              >
                <span>Book Home Collection</span>
                <ArrowRight className="h-4 w-4 stroke-[2.5]" />
              </Link>
              <Link
                href="/packages"
                className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border-2 border-[#0D0D0D] bg-white px-7 sm:px-8 py-3.5 text-xs sm:text-sm font-extrabold tracking-wider text-[#0D0D0D] transition-all hover:bg-[#F7F7F7] whitespace-nowrap min-h-[48px] sm:min-h-[50px] text-center"
              >
                <span>View Packages</span>
              </Link>
            </div>

            {/* 6. Quick Action Cards (Upload Prescription & Talk to Expert) */}
            <div className="grid gap-2 sm:grid-cols-2 pt-1 max-w-xl">
              <button
                type="button"
                onClick={() => setPrescriptionModalOpen(true)}
                className="group flex items-center justify-between rounded-xl border border-[#EAEAEA] bg-white px-3 py-2 sm:py-2.5 text-left transition hover:border-[#FF6B00] hover:shadow-xs cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-[#FFF4E8] text-[#FF6B00] shadow-xs transition group-hover:scale-105">
                    <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#0D0D0D] truncate">
                      Upload Prescription
                    </p>
                    <p className="text-[10px] text-[#626262] leading-tight truncate mt-0.5">
                      Get instant test mapping
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-[#FF6B00] shrink-0 ml-1 transition group-hover:translate-x-0.5" />
              </button>

              <button
                type="button"
                onClick={() => setAdvisorModalOpen(true)}
                className="group flex items-center justify-between rounded-xl border border-[#EAEAEA] bg-white px-3 py-2 sm:py-2.5 text-left transition hover:border-[#FF6B00] hover:shadow-xs cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-[#FFF4E8] text-[#FF6B00] shadow-xs transition group-hover:scale-105">
                    <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#0D0D0D] truncate">
                      Talk to Health Expert
                    </p>
                    <p className="text-[10px] text-[#626262] leading-tight truncate mt-0.5">
                      Need help picking tests?
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-[#FF6B00] shrink-0 ml-1 transition group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>

          {/* Right Column: Hero Visual Frame with ScopeX Indian Phlebotomist & Orange Organic Shape */}
          <div className="relative mx-auto w-full max-w-[500px] lg:ml-auto lg:mr-0 pt-2 lg:pt-0">
            {/* Dynamic Solid Orange Swoop Backdrop */}
            <div className="absolute -inset-3 -z-10 rounded-tr-[90px] rounded-bl-[80px] rounded-br-[60px] rounded-tl-[110px] bg-gradient-to-br from-[#FF6B00] to-[#F5A623] transform translate-x-3 translate-y-3 opacity-95" />

            {/* Main Rounded Frame with Organic Arch Radius */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-tl-[60px] sm:rounded-tl-[100px] rounded-tr-[32px] sm:rounded-tr-[36px] rounded-br-[32px] sm:rounded-br-[36px] rounded-bl-[32px] sm:rounded-bl-[36px] border-2 border-white bg-white shadow-[0_24px_50px_rgba(13,13,13,0.12)]">
              <Image
                src="/images/scopex-premium-home-collection.jpg"
                alt="ScopeX trained phlebotomist in branded uniform collecting blood sample for patient at modern home"
                fill
                priority
                className="object-cover"
                referrerPolicy="no-referrer"
              />

              {/* Bottom Subtle Contrast Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent pointer-events-none" />

              {/* Handwritten Brand Script Sticker - "Your Health. Decoded." as seen in Option C */}
              <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 rounded-xl border border-white/95 bg-white/95 px-3 py-1.5 shadow-md backdrop-blur-sm">
                <span className="font-serif italic text-xs sm:text-sm font-black text-[#FF6B00] tracking-tight">
                  Your Health. Decoded.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Modal Popups */}
      <UploadPrescriptionModal
        isOpen={prescriptionModalOpen}
        onClose={() => setPrescriptionModalOpen(false)}
      />

      <HealthAdvisorModal
        isOpen={advisorModalOpen}
        onClose={() => setAdvisorModalOpen(false)}
      />
    </section>
  );
}
