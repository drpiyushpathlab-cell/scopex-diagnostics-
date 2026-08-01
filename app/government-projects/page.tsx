import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Government Healthcare Projects | ScopeX Diagnostics",
  description: "Scalable diagnostic support for public health programs, institutional screening, and government healthcare projects."
};

export default function GovernmentProjectsPage() {
  return (
    <section className="container-px py-14 md:py-16">
      <div className="section-wrap rounded-[28px] border border-[#f1dfce] bg-white p-6 shadow-[0_16px_36px_rgba(16,24,40,0.06)] md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#F7931E]">Government Projects</p>
        <h1 className="mt-2 text-3xl font-bold text-[#0D0D0D] md:text-4xl">Diagnostic support for public health programs</h1>
        <p className="mt-4 text-sm leading-8 text-[#5f6868] md:text-base">
          ScopeX Diagnostics can support institutional screening, public health diagnostics, health camps, and scalable reporting workflows for government and semi-government healthcare initiatives.
        </p>
        <Link href="/corporate/government-health-projects" className="cta-btn mt-6">Explore Project Support</Link>
      </div>
    </section>
  );
}
