import Link from "next/link";
import { Search, CalendarCheck, Home, FileText, ArrowRight } from "lucide-react";

const steps = [
  {
    step: "01",
    title: "Search",
    description: "Find tests or packages by health need, organ system, or marker.",
    icon: Search
  },
  {
    step: "02",
    title: "Book",
    description: "Choose patient, address, collection slot, and payment method.",
    icon: CalendarCheck
  },
  {
    step: "03",
    title: "Collect",
    description: "A trained collection partner visits your home at the selected time.",
    icon: Home
  },
  {
    step: "04",
    title: "Report",
    description: "Track booking status and access reports from your patient dashboard.",
    icon: FileText
  }
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-14 sm:py-20">
      <div className="section-wrap">
        {/* Section Header */}
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FF6B00]">
            Simple 4-Step Process
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0D0D0D] tracking-tight">
            How ScopeX Works
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#626262] leading-relaxed">
            Diagnostics designed around your comfort, precision, and complete transparent pricing.
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.step}
                className="group relative flex flex-col justify-between rounded-2xl border border-[#EAEAEA] bg-white p-6 shadow-xs transition hover:-translate-y-1 hover:border-[#FF6B00]/50 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-[#FF6B00] tracking-tight">
                      {item.step}
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF4E8] text-[#FF6B00] transition group-hover:scale-105">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-[#0D0D0D]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#626262]">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#EAEAEA]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF6B00] flex items-center gap-1 group-hover:underline">
                    <span>Learn more</span>
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        {/* Action Link */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-[#EAEAEA] bg-[#F7F7F7] p-4 sm:p-5">
          <p className="text-xs sm:text-sm text-[#0D0D0D] font-medium text-center sm:text-left">
            Need home sample collection today or tomorrow morning?
          </p>
          <Link
            href="/book-home-collection"
            className="cta-btn rounded-xl px-5 py-2.5 text-xs font-bold shrink-0"
          >
            Book Home Collection Now
          </Link>
        </div>
      </div>
    </section>
  );
}
