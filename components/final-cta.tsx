import Link from "next/link";
import { ShieldCheck, CheckCircle2, Clock, ArrowRight } from "lucide-react";

export function FinalCta() {
  return (
    <section id="final-cta" className="section-wrap mt-16 sm:mt-24 mb-16 scroll-mt-32">
      <div className="relative overflow-hidden rounded-3xl border border-stone-800 bg-[#0D0D0D] p-8 sm:p-14 text-white shadow-2xl">
        {/* Signature ambient orange glow blur in corner */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-[#FF6B00]/25 blur-[120px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-stone-700 bg-stone-900/90 px-3.5 py-1 text-xs font-bold text-[#FF6B00]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#FF6B00]" />
              <span>NABL Quality Standards · Safe Doorstep Phlebotomy</span>
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.12]">
              Ready to Experience <br />
              <span className="text-[#FF6B00]">Transparent Diagnostics?</span>
            </h2>
            <p className="mt-4 text-xs sm:text-sm text-stone-300 leading-relaxed max-w-xl">
              Pay the real price for every test. Enjoy transparent package savings, convenient home sample collection through trained phlebotomists, and reliable digital reports.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-semibold text-stone-300">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#FF6B00]" />
                <span>Zero Hidden Fees</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#FF6B00]" />
                <span>NABL Accredited Labs</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-[#FF6B00]" />
                <span>Reports in 12–24 Hours</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3.5 shrink-0">
            <Link
              href="/book-home-collection"
              className="cta-btn text-center justify-center cursor-pointer shadow-[0_8px_24px_rgba(255,107,0,0.35)]"
            >
              Book Home Collection
            </Link>
            <Link
              href="/packages"
              className="rounded-xl border border-stone-700 bg-stone-900/90 px-6 py-3 text-xs font-bold text-white hover:border-[#FF6B00] hover:bg-stone-800 transition text-center"
            >
              Explore Health Packages
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
