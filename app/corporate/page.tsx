import type { Metadata } from "next";
import Link from "next/link";
import { corporatePages } from "@/lib/seo-platform";

export const metadata: Metadata = {
  title: "Corporate Healthcare | ScopeX Diagnostics",
  description: "Corporate health checkups, pre-employment medicals, factory screening, CSR health camps, and workplace wellness solutions."
};

export default function CorporateIndexPage() {
  return (
    <section className="container-px py-14 md:py-16">
      <div className="section-wrap">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#F7931E]">Corporate Healthcare</p>
          <h1 className="mt-2 text-3xl font-bold text-[#0D0D0D] md:text-4xl">Enterprise diagnostic programs</h1>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {corporatePages.map((page) => (
            <Link key={page.slug} href={`/corporate/${page.slug}`} className="rounded-[26px] border border-[#f1dfce] bg-white p-5 shadow-[0_16px_36px_rgba(16,24,40,0.05)] transition hover:-translate-y-1">
              <h2 className="text-xl font-bold text-[#0D0D0D]">{page.h1}</h2>
              <p className="mt-2 text-sm leading-7 text-[#5f6868]">{page.intro}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
