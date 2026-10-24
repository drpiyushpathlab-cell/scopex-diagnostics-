import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Heart, Clock, Award, CheckCircle2, ChevronRight, Home, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "About ScopeX Diagnostics | Your Health. Decoded.",
  description:
    "Learn about ScopeX Diagnostics, our Pan-India home sample collection network, NABL-standard laboratories, and transparent diagnostic pricing."
};

const pillars = [
  {
    title: "Real Prices, Always",
    description: "No artificial markup followed by fake 80% discounts. We offer transparent, fair pricing on every single test and package.",
    icon: Award
  },
  {
    title: "NABL Standard Precision",
    description: "Samples are processed exclusively in accredited diagnostic centers utilizing bidirectional barcode-interfaced equipment.",
    icon: ShieldCheck
  },
  {
    title: "Safe Cold-Chain Handling",
    description: "Single-use sterile vacutainers are unsealed directly in front of you and transported in temperature-monitored carriers.",
    icon: Clock
  },
  {
    title: "Empowering Patient Reports",
    description: "Fast digital reports verified by certified medical pathologists, accessible anytime through your secure patient portal.",
    icon: Heart
  }
];

export default function AboutPage() {
  return (
    <div className="bg-[#FFFFFF] min-h-screen pb-20 pt-8 sm:pt-12">
      <div className="section-wrap">
        {/* Hero Section */}
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FFD9C0] bg-[#FFF4E8] px-3.5 py-1 text-xs font-bold text-[#FF6B00]">
            <Sparkles className="h-3.5 w-3.5 text-[#FF6B00]" />
            <span>About ScopeX Diagnostics</span>
          </div>
          <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-black text-[#0D0D0D] tracking-tight leading-[1.08]">
            Your Health. Decoded.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[#626262] leading-relaxed">
            ScopeX Diagnostics is a modern health-technology platform designed to bring clinical-grade pathology diagnostics directly to your doorstep with total transparency and zero compromise on accuracy.
          </p>
        </div>

        {/* Brand Story Grid */}
        <div className="mt-12 grid gap-10 lg:grid-cols-2 items-center">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-[#EAEAEA] bg-[#F7F7F7] shadow-md">
            <Image
              src="/images/scopex-premium-home-collection.jpg"
              alt="ScopeX phlebotomist attending patient at home"
              fill
              priority
              className="object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <p className="text-xs font-bold uppercase tracking-wider text-[#FF6B00]">Pan India Diagnostics</p>
              <p className="text-sm font-semibold">Trained phlebotomists &amp; cold-chain specimen handling</p>
            </div>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-[#626262] leading-relaxed">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0D0D0D] tracking-tight">
              Why We Founded ScopeX
            </h2>
            <p>
              Traditional diagnostics in India often involve confusing pricing, hidden fees, and crowded waiting rooms. We built ScopeX Diagnostics to provide a clean, dignified healthcare experience for patients and families.
            </p>
            <p>
              Whether you need routine blood counts (CBC), diabetes monitoring (HbA1c), thyroid profiles, or comprehensive full-body annual wellness checkups, our trained phlebotomists arrive on time with sealed sterile collection kits.
            </p>
            <div className="pt-2 grid grid-cols-2 gap-3 text-xs font-bold text-[#0D0D0D]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#FF6B00]" />
                <span>NABL Quality Standards</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#FF6B00]" />
                <span>Zero Fake Discounts</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#FF6B00]" />
                <span>Same-Day Sample Pickup</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#FF6B00]" />
                <span>Encrypted Digital Reports</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Pillars Grid */}
        <div className="mt-16 sm:mt-20">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0D0D0D] tracking-tight">
              Our Healthcare Commitments
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#626262]">
              Every process at ScopeX is engineered around patient trust, accuracy, and clinical speed.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="rounded-2xl border border-[#EAEAEA] bg-white p-6 shadow-xs transition hover:-translate-y-1 hover:border-[#FF6B00]/60 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF4E8] text-[#FF6B00]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-[#0D0D0D]">
                    {pillar.title}
                  </h3>
                  <p className="mt-2 text-xs text-[#626262] leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Signature Carbon Black Stats & Clinical Excellence Row */}
        <div className="mt-16 overflow-hidden rounded-3xl border border-stone-800 bg-[#0D0D0D] p-8 sm:p-12 text-white relative shadow-xl">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-[#FF6B00]/20 blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="text-center max-w-xl mx-auto mb-8">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF6B00]">
                Diagnostic Scale &amp; Precision
              </span>
              <h3 className="mt-1 text-xl sm:text-2xl font-bold text-white">
                Clinical Metrics Built on Patient Trust
              </h3>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
              <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-5">
                <p className="text-3xl sm:text-4xl font-black text-[#FF6B00]">10,000+</p>
                <p className="mt-1.5 text-xs font-bold text-white">Families Served</p>
                <p className="text-[11px] text-stone-400">Doorstep visits across India</p>
              </div>
              <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-5">
                <p className="text-3xl sm:text-4xl font-black text-white">1,000+</p>
                <p className="mt-1.5 text-xs font-bold text-white">Diagnostic Tests</p>
                <p className="text-[11px] text-stone-400">Biochemistry &amp; specialized</p>
              </div>
              <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-5">
                <p className="text-3xl sm:text-4xl font-black text-[#FF6B00]">100%</p>
                <p className="mt-1.5 text-xs font-bold text-white">Sterile Single-Use Kits</p>
                <p className="text-[11px] text-stone-400">Opened in front of patient</p>
              </div>
              <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-5">
                <p className="text-3xl sm:text-4xl font-black text-white">12-24h</p>
                <p className="mt-1.5 text-xs font-bold text-white">Report Turnaround</p>
                <p className="text-[11px] text-stone-400">Encrypted digital delivery</p>
              </div>
            </div>
          </div>
        </div>

        {/* Call To Action Banner */}
        <div className="mt-16 rounded-3xl border border-[#EAEAEA] bg-white p-8 sm:p-12 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#FF6B00]">
              Start Your Health Journey
            </span>
            <h3 className="mt-2 text-2xl sm:text-3xl font-black text-[#0D0D0D]">
              Ready to experience modern diagnostics?
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-[#626262] max-w-xl">
              Book your home blood test or explore our full-body preventive health packages with real prices and zero fake discounts.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/book-home-collection"
              className="cta-btn rounded-xl px-6 py-3 text-xs font-bold uppercase tracking-wider"
            >
              Book Home Collection
            </Link>
            <Link
              href="/packages"
              className="rounded-xl border border-[#0D0D0D] bg-white px-5 py-3 text-xs font-bold text-[#0D0D0D] hover:bg-[#F7F7F7]"
            >
              Explore Packages
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
