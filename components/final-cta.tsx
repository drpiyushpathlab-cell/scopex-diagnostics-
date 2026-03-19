import Link from "next/link";

export function FinalCta() {
  return (
    <section id="final-cta" className="section-wrap mt-16 scroll-mt-32">
      <div className="overflow-hidden rounded-[30px] border border-scopex-orange/20 bg-[linear-gradient(135deg,#080808_0%,#121212_45%,#2a1408_100%)] px-6 py-10 text-white shadow-[0_24px_80px_rgba(255,106,0,0.12)] md:px-10 md:py-14">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#FF6A00]">Book With Confidence</p>
        <h2 className="mt-3 max-w-3xl text-3xl font-bold leading-tight md:text-5xl">Book Your Test Now</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/78 md:text-base">
          Premium home collection, transparent pricing, and fast digital reports from SCOPEX DIAGNOSTICS.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link href="/book-home-collection" className="cta-btn w-full justify-center text-center sm:w-auto">
            Book Home Collection
          </Link>
          <Link href="/packages#packages" className="secondary-btn w-full justify-center text-center sm:w-auto">
            View Packages
          </Link>
        </div>
      </div>
    </section>
  );
}
