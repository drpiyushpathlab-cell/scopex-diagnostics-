import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Medical Advisory Board | ScopeX Diagnostics",
  description: "Learn about ScopeX Diagnostics medical advisory and clinical governance approach for patient education and diagnostic quality."
};

export default function MedicalAdvisoryBoardPage() {
  return (
    <section className="container-px py-14 md:py-16">
      <div className="section-wrap rounded-[28px] border border-[#f1dfce] bg-white p-6 shadow-[0_16px_36px_rgba(16,24,40,0.06)] md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#F7931E]">EEAT</p>
        <h1 className="mt-2 text-3xl font-bold text-[#0D0D0D] md:text-4xl">Medical Advisory Board</h1>
        <p className="mt-4 text-sm leading-8 text-[#5f6868] md:text-base">
          ScopeX Diagnostics is building a medically reviewed health education and diagnostics platform. Medical review workflows help ensure patient-facing content remains responsible, educational, and aligned with qualified clinical guidance.
        </p>
      </div>
    </section>
  );
}
