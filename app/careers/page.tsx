import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Careers | ScopeX Diagnostics",
  description: "Explore career opportunities with ScopeX Diagnostics as we build a scalable diagnostics platform across India."
};

export default function CareersPage() {
  return (
    <section className="container-px py-14 md:py-16">
      <div className="section-wrap rounded-[28px] border border-[#f1dfce] bg-white p-6 shadow-[0_16px_36px_rgba(16,24,40,0.06)] md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#F7931E]">Careers</p>
        <h1 className="mt-2 text-3xl font-bold text-[#0D0D0D] md:text-4xl">Build the Future of Diagnostics</h1>
        <p className="mt-4 text-sm leading-8 text-[#5f6868] md:text-base">
          ScopeX Diagnostics is growing across technology, operations, customer support, business partnerships, and healthcare delivery. For career enquiries, contact our team through the website.
        </p>
      </div>
    </section>
  );
}
