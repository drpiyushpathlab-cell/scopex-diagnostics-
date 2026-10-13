import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Sparkles, Award, Microscope, HeartHandshake, ArrowRight } from "lucide-react";

export function LabQualitySection() {
  return (
    <section className="bg-white py-14 sm:py-20 border-y border-[#f1dfce]">
      <div className="section-wrap">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#f1dfce] bg-[#FFF8F2] px-3.5 py-1 text-xs font-semibold text-[#F7931E]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Clinical Precision & Zero Compromise</span>
          </div>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#0D0D0D] sm:text-4xl md:text-5xl">
            Modern pathology labs and barcoded sample safety.
          </h2>
          <p className="mt-4 text-base text-[#5f6868] sm:text-lg">
            Every sample undergoes a sealed cold-chain journey from your living room to fully automated, NABL-standard diagnostic analyzers.
          </p>
        </div>

        {/* 3 High-Impact Visual Pillars */}
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {/* Card 1: Pathology Lab */}
          <div className="group flex flex-col overflow-hidden rounded-3xl border border-[#E8E2DC] bg-[#FFFDFB] shadow-[0_12px_36px_rgba(13,13,13,0.04)] transition hover:-translate-y-1 hover:border-[#F7931E]/40 hover:shadow-[0_20px_46px_rgba(247,147,30,0.1)]">
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
              <Image
                src="/images/modern-lab.jpg"
                alt="Automated clinical pathology laboratory with certified medical equipment"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-4 flex items-center gap-2 text-white">
                <Microscope className="h-4 w-4 text-[#F7931E]" />
                <span className="text-xs font-semibold">Automated Clinical Analyzers</span>
              </div>
            </div>
            <div className="flex flex-1 flex-col p-6">
              <h3 className="text-xl font-bold text-[#0D0D0D]">NABL Standard Laboratories</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-[#5f6868]">
                Samples are processed in certified partner diagnostic centers using bidirectional barcode interfaced equipment to eliminate human transcription errors.
              </p>
              <div className="mt-auto pt-4 text-xs font-semibold text-[#F7931E] flex items-center gap-1.5">
                <span>View Quality Procedures</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>

          {/* Card 2: Vacutainer Safety & Cold-Chain */}
          <div className="group flex flex-col overflow-hidden rounded-3xl border border-[#E8E2DC] bg-[#FFFDFB] shadow-[0_12px_36px_rgba(13,13,13,0.04)] transition hover:-translate-y-1 hover:border-[#F7931E]/40 hover:shadow-[0_20px_46px_rgba(247,147,30,0.1)]">
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
              <Image
                src="/images/test-kit-safety.jpg"
                alt="Sterile vacuum blood collection tubes with barcode labels and cold-chain specimen box"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-4 flex items-center gap-2 text-white">
                <ShieldCheck className="h-4 w-4 text-[#F7931E]" />
                <span className="text-xs font-semibold">100% Sterile & Barcoded</span>
              </div>
            </div>
            <div className="flex flex-1 flex-col p-6">
              <h3 className="text-xl font-bold text-[#0D0D0D]">Cold-Chain Specimen Logistics</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-[#5f6868]">
                Single-use sterile safety needles and vacutainers are unsealed directly in front of you. Insulated temperature-monitored carriers keep samples viable during transit.
              </p>
              <div className="mt-auto pt-4 text-xs font-semibold text-[#F7931E] flex items-center gap-1.5">
                <span>Safe Sample Protocol</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>

          {/* Card 3: Family Health & Wellness */}
          <div className="group flex flex-col overflow-hidden rounded-3xl border border-[#E8E2DC] bg-[#FFFDFB] shadow-[0_12px_36px_rgba(13,13,13,0.04)] transition hover:-translate-y-1 hover:border-[#F7931E]/40 hover:shadow-[0_20px_46px_rgba(247,147,30,0.1)]">
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
              <Image
                src="/images/family-health.jpg"
                alt="Happy multi-generation family at home enjoying preventive health wellness"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-4 flex items-center gap-2 text-white">
                <HeartHandshake className="h-4 w-4 text-[#F7931E]" />
                <span className="text-xs font-semibold">Preventive Care for Every Age</span>
              </div>
            </div>
            <div className="flex flex-1 flex-col p-6">
              <h3 className="text-xl font-bold text-[#0D0D0D]">Complete Family Protection</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-[#5f6868]">
                From routine wellness packages for working professionals to comprehensive diabetic and cardiac checkups for parents and senior citizens.
              </p>
              <div className="mt-auto pt-4 text-xs font-semibold text-[#F7931E] flex items-center gap-1.5">
                <span>Explore Family Plans</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA Banner */}
        <div className="mt-12 rounded-3xl border border-[#f1dfce] bg-gradient-to-r from-[#FFF8F2] via-white to-[#FFF4EA] p-6 sm:p-10 shadow-[0_16px_40px_rgba(247,147,30,0.06)]">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F7931E]">
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
