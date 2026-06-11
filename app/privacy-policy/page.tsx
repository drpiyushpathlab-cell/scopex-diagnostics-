import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | ScopeX Diagnostics",
  description: "Read the ScopeX Diagnostics privacy policy for personal information, patient data, Google login, and diagnostic booking details."
};

type PrivacySection =
  | {
      title: string;
      items: string[];
      body?: never;
    }
  | {
      title: string;
      body: string;
      items?: never;
    };

const sections: PrivacySection[] = [
  {
    title: "Information We Collect",
    items: ["Name", "Mobile Number", "Email Address", "Address", "Patient Information", "Diagnostic Test Booking Details"]
  },
  {
    title: "How We Use Information",
    items: ["Booking confirmation", "Sample collection scheduling", "Report delivery", "Customer support", "Service improvement"]
  },
  {
    title: "Data Security",
    body: "We implement reasonable security measures to protect user information from unauthorized access."
  },
  {
    title: "Data Sharing",
    body:
      "We do not sell personal information. Data may be shared only with authorized healthcare partners and service providers as required to deliver services."
  },
  {
    title: "Google Login",
    body: "If you sign in with Google, we may access your name, email address, and profile picture for authentication purposes."
  },
  {
    title: "Contact",
    body: "Email: scopexdiagnostic@gmail.com\nWebsite: https://www.scopexdiagnostics.in"
  }
];

export default function PrivacyPolicyPage() {
  return (
    <section className="container-px py-14 md:py-16">
      <div className="section-wrap rounded-[32px] border border-[#deece9] bg-white p-6 shadow-[0_16px_36px_rgba(16,24,40,0.06)] md:p-10">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0f8f7c]">ScopeX Diagnostics</p>
        <h1 className="mt-3 text-3xl font-black text-[#102a2d] md:text-5xl">Privacy Policy</h1>
        <p className="mt-3 text-sm font-semibold text-[#f37021]">Last Updated: June 2026</p>
        <p className="mt-5 max-w-4xl text-sm leading-8 text-[var(--muted)] md:text-base">
          ScopeX Diagnostics respects your privacy and is committed to protecting your personal information.
        </p>

        <div className="mt-8 grid gap-4">
          {sections.map((section) => (
            <article key={section.title} className="rounded-[24px] border border-[#deece9] bg-[#f7fbfa] p-5">
              <h2 className="text-xl font-black text-[#102a2d]">{section.title}</h2>
              {section.items ? (
                <ul className="mt-3 grid gap-2 text-sm leading-7 text-[var(--muted)] md:text-base">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="text-[#f37021]">-</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 whitespace-pre-line text-sm leading-8 text-[var(--muted)] md:text-base">{section.body}</p>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
