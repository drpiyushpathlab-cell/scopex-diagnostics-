import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact ScopeX Diagnostics",
  description:
    "Contact ScopeX Diagnostics for home sample collection, blood test booking, and preventive health package support."
};

export default function ContactPage() {
  return (
    <section className="container-px py-14 md:py-16">
      <div className="section-wrap rounded-[28px] border border-[#f1dfce] bg-white p-6 shadow-[0_16px_36px_rgba(16,24,40,0.06)] md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#F7931E]">Contact</p>
        <h1 className="mt-2 text-3xl font-bold text-[#0D0D0D] md:text-4xl">Get in touch with ScopeX Diagnostics</h1>
        <div className="mt-5 space-y-3 text-sm leading-8 text-[#5f6868] md:text-base">
          <p>Need help with a package, test booking, or home sample collection slot? Our team is here to help.</p>
          <p>
            WhatsApp:
            {" "}
            <Link href="https://wa.me/918989273440" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#F7931E]">
              +91 89892 73440
            </Link>
          </p>
          <p>
            Email:
            {" "}
            <Link href="mailto:scopex.lab@gmail.com" className="font-semibold text-[#F7931E]">
              scopex.lab@gmail.com
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
