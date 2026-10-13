"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ShieldCheck, Clock, ThermometerSnowflake, FileUp, Headphones } from "lucide-react";
import { UploadPrescriptionModal } from "@/components/upload-prescription-modal";
import { HealthAdvisorModal } from "@/components/health-advisor-modal";

export function Hero() {
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [advisorModalOpen, setAdvisorModalOpen] = useState(false);

  return (
    <section id="hero" className="relative overflow-hidden bg-gradient-to-b from-[#FFFDFB] via-white to-[#FBF8F5] pb-12 pt-6 md:pb-16 md:pt-10">
      <div className="section-wrap">
        <div className="grid items-center gap-10 lg:grid-cols-[1.18fr_0.82fr] lg:gap-12 xl:gap-16">
          {/* Left Column: Value Proposition & Clear Actions */}
          <div className="space-y-6">
            {/* 1. Trust Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#f1dfce] bg-[#FFF8F2] px-3.5 py-1 text-xs font-semibold text-[#F7931E]">
              <span className="flex h-2 w-2 rounded-full bg-[#F7931E]" />
              <span>NABL Quality Standards · Safe Sample Handling</span>
            </div>

            {/* 2. Main Headline - EXACTLY TWO LINES */}
            <h1 className="text-[1.95rem] font-extrabold tracking-tight text-[#0D0D0D] sm:text-[2.45rem] md:text-[2.75rem] lg:text-[2.7rem] xl:text-[3.05rem] leading-[1.14]">
              <span className="block sm:whitespace-nowrap">Blood Tests at Home.</span>
              <span className="block text-[#F7931E] sm:whitespace-nowrap mt-1">
                Real Prices. Zero Fake Discounts.
              </span>
            </h1>

            {/* 3. Description */}
            <p className="max-w-2xl text-base leading-relaxed text-[#5f6868] sm:text-lg">
              Pay the real price for every test. Add multiple tests to unlock transparent bundle savings and get convenient home collection through trusted lab partners with reliable digital reports.
            </p>

            {/* 4. Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/book-home-collection"
                className="cta-btn rounded-xl px-8 py-3.5 text-xs font-bold tracking-widest uppercase text-center"
              >
                BOOK HOME COLLECTION
              </Link>
              <Link
                href="/packages"
                className="secondary-btn rounded-xl px-7 py-3.5 text-xs font-bold tracking-widest uppercase text-center"
              >
                EXPLORE PACKAGES
              </Link>
            </div>

            {/* 5. Quick Actions */}
            <div className="pt-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#8A8A8A]">
                Quick Actions
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPrescriptionModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#E8E2DC] bg-[#FFF8F2] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#0D0D0D] transition hover:border-[#F7931E] hover:bg-white hover:text-[#F7931E] shadow-xs cursor-pointer"
                >
                  <FileUp className="h-4 w-4 text-[#F7931E]" />
                  <span>UPLOAD PRESCRIPTION</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdvisorModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#E8E2DC] bg-[#FFF8F2] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#0D0D0D] transition hover:border-[#F7931E] hover:bg-white hover:text-[#F7931E] shadow-xs cursor-pointer"
                >
                  <Headphones className="h-4 w-4 text-[#F7931E]" />
                  <span>TALK TO A HEALTH ADVISOR</span>
                </button>
              </div>
            </div>

            {/* 6. Key Trust Signals Strip */}
            <div className="grid grid-cols-3 gap-4 border-t border-[#f1dfce] pt-6">
              <div>
                <p className="text-lg font-extrabold text-[#0D0D0D] sm:text-2xl">Free*</p>
                <p className="mt-0.5 text-xs text-[#5f6868]">Home collection</p>
              </div>
              <div>
                <p className="text-lg font-extrabold text-[#0D0D0D] sm:text-2xl">10-12 Hrs</p>
                <p className="mt-0.5 text-xs text-[#5f6868]">Verified digital reports</p>
              </div>
              <div>
                <p className="text-lg font-extrabold text-[#0D0D0D] sm:text-2xl">100% Sterile</p>
                <p className="mt-0.5 text-xs text-[#5f6868]">Single-use vacutainers</p>
              </div>
            </div>
          </div>

          {/* Right Column: High-Fidelity Diagnostic Imagery & Clean Integrated Badges */}
          <div className="relative">
            <div className="relative mx-auto aspect-[4/3] w-full max-w-[520px] overflow-hidden rounded-3xl border border-[#E8E2DC] bg-[#f2ebe5] shadow-[0_16px_44px_rgba(13,13,13,0.08)] lg:aspect-[16/11]">
              <Image
                src="/images/hero-home-collection.jpg"
                alt="ScopeX certified diagnostic phlebotomist performing professional home blood collection"
                fill
                priority
                className="object-cover"
                referrerPolicy="no-referrer"
              />

              {/* Gradient scrim at bottom for text contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* In-image caption */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#F7931E]" />
                  <span className="text-xs font-semibold sm:text-sm">Verified Healthcare Specialist</span>
                </div>
                <span className="rounded-md bg-white/20 px-2 py-1 text-[11px] font-medium backdrop-blur-sm">
                  At-Home Service
                </span>
              </div>
            </div>

            {/* Clean 2-Badge Integrated Trust Strip Below Image */}
            <div className="mx-auto mt-3.5 grid max-w-[520px] grid-cols-2 gap-3">
              <div className="flex items-center gap-2.5 rounded-2xl border border-[#E8E2DC] bg-white p-3 shadow-xs">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF8F2] text-[#F7931E]">
                  <Clock className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#0D0D0D] truncate">Morning Slots Open</p>
                  <p className="text-[11px] text-[#5f6868] truncate">Daily 6:30 AM – 11:30 AM</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-2xl border border-[#E8E2DC] bg-white p-3 shadow-xs">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <ThermometerSnowflake className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#0D0D0D] truncate">Cold-Chain Protected</p>
                  <p className="text-[11px] text-[#5f6868] truncate">2°C – 8°C Specimen Box</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
