import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Partner With Us | ScopeX Diagnostics",
  description: "Partner with ScopeX Diagnostics for diagnostic services, corporate wellness, healthcare platforms, and growth partnerships."
};

export default function PartnerWithUsPage() {
  return (
    <section className="container-px py-14 md:py-16">
      <div className="section-wrap rounded-[28px] border border-[#f1dfce] bg-white p-6 shadow-[0_16px_36px_rgba(16,24,40,0.06)] md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#F7931E]">Partners</p>
        <h1 className="mt-2 text-3xl font-bold text-[#0D0D0D] md:text-4xl">Partner With ScopeX Diagnostics</h1>
        <p className="mt-4 text-sm leading-8 text-[#5f6868] md:text-base">
          Collaborate with ScopeX for insurance medicals, corporate wellness, healthcare platform integrations, franchise opportunities, and diagnostic network expansion.
        </p>
        <Link href="/growth-partners" className="cta-btn mt-6">Explore Growth Partners</Link>
      </div>
    </section>
  );
}
