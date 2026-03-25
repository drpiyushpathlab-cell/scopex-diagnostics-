import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Read the privacy policy for ScopeX Diagnostics."
};

export default function PrivacyPolicyPage() {
  return (
    <section className="container-px py-14 md:py-16">
      <div className="section-wrap rounded-[28px] border border-[#deece9] bg-white p-6 shadow-[0_16px_36px_rgba(16,24,40,0.06)] md:p-8">
        <h1 className="text-3xl font-bold text-[#102a2d] md:text-4xl">Privacy Policy</h1>
        <p className="mt-4 text-sm leading-8 text-[var(--muted)] md:text-base">
          ScopeX Diagnostics respects patient privacy and protects personal information shared during test booking,
          home sample collection, and support interactions.
        </p>
      </div>
    </section>
  );
}
