import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, ArrowRight, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Partner With Us | ScopeX Diagnostics",
  description: "Partner with ScopeX Diagnostics for diagnostic services, corporate wellness, healthcare platforms, and growth partnerships."
};

export default function PartnerWithUsPage() {
  return (
    <section className="bg-[#FFFFFF] min-h-[75vh] flex items-center py-16 sm:py-20">
      <div className="section-wrap w-full">
        {/* Signature Carbon Black & White Hybrid Card */}
        <div className="max-w-3xl mx-auto overflow-hidden rounded-3xl border border-[#EAEAEA] bg-white shadow-[0_20px_50px_rgba(13,13,13,0.08)]">
          {/* Signature Carbon Black Header */}
          <div className="relative overflow-hidden bg-[#0D0D0D] p-8 sm:p-10 text-white border-b border-stone-800">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#FF6B00]/25 blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-stone-700 bg-stone-900/90 px-3.5 py-1 text-xs font-bold text-[#FF6B00]">
                <Sparkles className="h-3.5 w-3.5 text-[#FF6B00]" />
                <span>B2B &amp; Growth Partnerships</span>
              </span>
              <h1 className="mt-3 text-3xl sm:text-4xl font-black text-white tracking-tight">
                Partner With ScopeX Diagnostics
              </h1>
              <p className="mt-3 text-xs sm:text-sm text-stone-300 leading-relaxed">
                Collaborate with ScopeX for insurance medicals, corporate wellness checkups, healthcare platform integrations, hospital diagnostic support, and diagnostic collection center franchise expansion across India.
              </p>
            </div>
          </div>

          {/* Action Area */}
          <div className="p-8 sm:p-10 space-y-6">
            <div className="grid gap-3 sm:grid-cols-3 text-xs text-[#0D0D0D] font-bold">
              <div className="rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] p-3 text-center">
                1,000+ Test Menu
              </div>
              <div className="rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] p-3 text-center">
                NABL Quality Standards
              </div>
              <div className="rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] p-3 text-center">
                Pan-India Phlebotomy
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link href="/growth-partners" className="cta-btn w-full sm:w-auto text-center justify-center">
                Explore Growth Partners
              </Link>
              <Link
                href="/growth-partners#growth-partner-form"
                className="rounded-xl border border-[#0D0D0D] bg-white px-6 py-3 text-xs font-bold text-[#0D0D0D] transition hover:bg-[#F7F7F7] w-full sm:w-auto text-center"
              >
                Submit Business Enquiry
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
