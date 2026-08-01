import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quality Assurance | ScopeX Diagnostics",
  description: "ScopeX Diagnostics quality assurance approach for sample collection, laboratory workflows, and digital report delivery."
};

export default function QualityAssurancePage() {
  return (
    <section className="container-px py-14 md:py-16">
      <div className="section-wrap rounded-[28px] border border-[#f1dfce] bg-white p-6 shadow-[0_16px_36px_rgba(16,24,40,0.06)] md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#F7931E]">Quality</p>
        <h1 className="mt-2 text-3xl font-bold text-[#0D0D0D] md:text-4xl">Quality Assurance</h1>
        <p className="mt-4 text-sm leading-8 text-[#5f6868] md:text-base">
          Our quality approach focuses on trained collection workflows, documented processes, careful sample handling, digital reporting, and continuous operational improvement for diagnostics at scale.
        </p>
      </div>
    </section>
  );
}
