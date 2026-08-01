import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Thank You | ScopeX Diagnostics",
  description: "Thank you for contacting ScopeX Diagnostics. Our team will get back to you shortly."
};

export default function ThankYouPage() {
  return (
    <section className="container-px py-14 md:py-16">
      <div className="section-wrap max-w-3xl rounded-[30px] border border-[#f1dfce] bg-white p-6 text-center shadow-[0_18px_42px_rgba(16,24,40,0.06)] md:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fff3e5] text-[#F7931E]">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12.5 4 4L19 6.5" />
          </svg>
        </div>
        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-[#F7931E]">Submission Received</p>
        <h1 className="mt-2 text-3xl font-bold text-[#0D0D0D] md:text-4xl">Thank you for contacting ScopeX Diagnostics</h1>
        <p className="mt-4 text-sm leading-8 text-[#5f6868] md:text-base">
          Your business enquiry has been submitted successfully. Our team will review your details and contact you shortly.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/growth-partners" className="secondary-btn">Back to Growth Partners</Link>
          <Link href="/" className="cta-btn">Go to Home</Link>
        </div>
      </div>
    </section>
  );
}
