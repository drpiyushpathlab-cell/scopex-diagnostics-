import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About ScopeX Diagnostics",
  description:
    "Learn about ScopeX Diagnostics, our home sample collection model, and our preventive diagnostics platform."
};

export default function AboutPage() {
  return (
    <section className="container-px py-14 md:py-16">
      <div className="section-wrap rounded-[28px] border border-[#f1dfce] bg-white p-6 shadow-[0_16px_36px_rgba(16,24,40,0.06)] md:p-8">
        <h1 className="text-3xl font-bold text-[#0D0D0D] md:text-4xl">About ScopeX Diagnostics</h1>
        <p className="mt-4 text-sm leading-8 text-[var(--muted)] md:text-base">
          ScopeX Diagnostics is a home-first diagnostic platform focused on accurate testing, preventive health
          packages, and convenient sample collection for patients and families.
        </p>
      </div>
    </section>
  );
}
