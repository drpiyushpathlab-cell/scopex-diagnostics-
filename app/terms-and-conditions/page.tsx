import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions | ScopeX Diagnostics",
  description: "Read the ScopeX Diagnostics terms and conditions for diagnostic testing, health packages, home sample collection, pricing, reports, and website use."
};

type TermsSection =
  | {
      title: string;
      body: string;
      items?: never;
    }
  | {
      title: string;
      items: string[];
      body?: never;
    };

const sections: TermsSection[] = [
  {
    title: "Services",
    body: "ScopeX Diagnostics provides diagnostic testing, health packages, home sample collection, and report delivery services."
  },
  {
    title: "User Responsibilities",
    items: ["Provide accurate information.", "Use services lawfully.", "Maintain confidentiality of login credentials."]
  },
  {
    title: "Pricing",
    body: "Prices may change without prior notice."
  },
  {
    title: "Reports",
    body: "Diagnostic reports should be interpreted by qualified healthcare professionals."
  },
  {
    title: "Limitation of Liability",
    body: "ScopeX Diagnostics shall not be liable for indirect or consequential losses arising from use of services."
  },
  {
    title: "Changes",
    body: "We reserve the right to update these terms at any time."
  },
  {
    title: "Contact",
    body: "scopexdiagnostic@gmail.com"
  }
];

export default function TermsAndConditionsPage() {
  return (
    <section className="container-px py-14 md:py-16">
      <div className="section-wrap rounded-[32px] border border-[#f1dfce] bg-white p-6 shadow-[0_16px_36px_rgba(16,24,40,0.06)] md:p-10">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#F7931E]">ScopeX Diagnostics</p>
        <h1 className="mt-3 text-3xl font-black text-[#0D0D0D] md:text-5xl">Terms &amp; Conditions</h1>
        <p className="mt-3 text-sm font-semibold text-[#F7931E]">Last Updated: June 2026</p>
        <p className="mt-5 max-w-4xl text-sm leading-8 text-[var(--muted)] md:text-base">
          By using ScopeX Diagnostics services, you agree to these terms.
        </p>

        <div className="mt-8 grid gap-4">
          {sections.map((section) => (
            <article key={section.title} className="rounded-[24px] border border-[#f1dfce] bg-[#FFF8F2] p-5">
              <h2 className="text-xl font-black text-[#0D0D0D]">{section.title}</h2>
              {section.items ? (
                <ul className="mt-3 grid gap-2 text-sm leading-7 text-[var(--muted)] md:text-base">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="text-[#F7931E]">-</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm leading-8 text-[var(--muted)] md:text-base">{section.body}</p>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
