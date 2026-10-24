import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Sparkles, Award, Microscope, HeartHandshake, ArrowRight } from "lucide-react";

export function LabQualitySection() {
  return (
    <section id="why-choose-scopex" className="bg-[#F7F7F7] py-14 sm:py-20 border-y border-[#EAEAEA]">
      <div className="section-wrap">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#EAEAEA] bg-[#FFF4E8] px-3.5 py-1 text-xs font-bold text-[#FF6B00]">
            <Sparkles className="h-3.5 w-3.5 text-[#FF6B00]" />
            <span>Why Choose SCOPEX</span>
          </div>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#0D0D0D] sm:text-4xl">
            Clinical excellence meets doorstep convenience.
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-[#626262] leading-relaxed max-w-2xl mx-auto">
            Experience reliable diagnostic workflows with transparent pricing, certified testing partners, and dependable digital reports.
          </p>
        </div>

        {/* 3 High-Impact Visual Feature Cards */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {/* Card 1: NABL Standard Laboratories */}
          <div className="group flex flex-col overflow-hidden rounded-2xl border border-[#EAEAEA] bg-white shadow-xs transition hover:-translate-y-1 hover:border-[#FF6B00]/40 hover:shadow-md">
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
              <Image
                src="/images/modern-lab.jpg"
                alt="Automated clinical pathology laboratory with certified diagnostic analyzers"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-4 flex items-center gap-2 text-white">
                <Microscope className="h-4 w-4 text-[#FF6B00]" />
                <span className="text-xs font-bold">Automated Analyzers</span>
              </div>
            </div>
            <div className="flex flex-1 flex-col p-6">
              <h3 className="text-xl font-bold text-[#0D0D0D]">NABL Standard Laboratories</h3>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#626262]">
                Samples are processed in certified partner diagnostic centers utilizing bidirectional barcode-interfaced equipment to eliminate human transcription errors.
              </p>
              <div className="mt-auto pt-4 text-xs font-bold text-[#FF6B00] flex items-center gap-1.5">
                <Link href="/quality-assurance" className="hover:underline flex items-center gap-1">
                  <span>View quality standards</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Card 2: Safe Sample Collection */}
          <div className="group flex flex-col overflow-hidden rounded-2xl border border-[#EAEAEA] bg-white shadow-xs transition hover:-translate-y-1 hover:border-[#FF6B00]/40 hover:shadow-md">
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
              <Image
                src="/images/test-kit-safety.jpg"
                alt="Sterile vacuum blood collection tubes with barcode labels and cold-chain specimen kit"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-4 flex items-center gap-2 text-white">
                <ShieldCheck className="h-4 w-4 text-[#FF6B00]" />
                <span className="text-xs font-bold">Sterile & Barcoded</span>
              </div>
            </div>
            <div className="flex flex-1 flex-col p-6">
              <h3 className="text-xl font-bold text-[#0D0D0D]">Safe Sample Collection</h3>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#626262]">
                Trained phlebotomists unseal single-use sterile safety vacutainers right before you. Temperature-controlled carriers preserve specimen integrity in transit.
              </p>
              <div className="mt-auto pt-4 text-xs font-bold text-[#FF6B00] flex items-center gap-1.5">
                <Link href="/book-home-collection" className="hover:underline flex items-center gap-1">
                  <span>Book home collection</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Card 3: Complete Family Healthcare */}
          <div className="group flex flex-col overflow-hidden rounded-2xl border border-[#EAEAEA] bg-white shadow-xs transition hover:-translate-y-1 hover:border-[#FF6B00]/40 hover:shadow-md">
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
              <Image
                src="/images/family-health.jpg"
                alt="Happy Indian family enjoying preventive health wellness checkup"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-4 flex items-center gap-2 text-white">
                <HeartHandshake className="h-4 w-4 text-[#FF6B00]" />
                <span className="text-xs font-bold">Preventive Care for All Ages</span>
              </div>
            </div>
            <div className="flex flex-1 flex-col p-6">
              <h3 className="text-xl font-bold text-[#0D0D0D]">Complete Family Healthcare</h3>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#626262]">
                Tailored preventive packages for busy working professionals, diabetic risk screening, and comprehensive annual health panels for senior family members.
              </p>
              <div className="mt-auto pt-4 text-xs font-bold text-[#FF6B00] flex items-center gap-1.5">
                <Link href="/packages" className="hover:underline flex items-center gap-1">
                  <span>Explore family packages</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA Banner */}
        <div className="mt-12 rounded-3xl border border-[#f1dfce] bg-gradient-to-r from-[#FFF8F2] via-white to-[#FFF4EA] p-6 sm:p-10 shadow-[0_16px_40px_rgba(247,147,30,0.06)]">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF6B00]">
                <Award className="h-4 w-4" />
                <span>Zero Hidden Fees Guarantee</span>
              </div>
              <h3 className="mt-1.5 text-2xl font-extrabold text-[#0D0D0D] sm:text-3xl">
                Ready to book home sample collection?
              </h3>
              <p className="mt-2 text-sm text-[#5f6868] sm:text-base">
                Choose your tests, pick your preferred morning slot, and pay online or at pickup.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/book-home-collection" className="cta-btn rounded-xl px-7 py-3 text-xs tracking-wider">
                Book Test Now
              </Link>
              <Link href="/packages" className="secondary-btn rounded-xl px-6 py-3 text-xs tracking-wider">
                View Packages
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
