import type { Metadata } from "next";
import Link from "next/link";
import { CustomPackageBuilder } from "@/components/custom-package-builder";
import { Sparkles, ShieldCheck, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Build Custom Package | ScopeX Diagnostics",
  description: "Select individual diagnostic tests, recalculate dynamic bundle savings, and enforce per-test discount caps."
};

export default function CustomPackagePage() {
  return (
    <section className="bg-[#FFFFFF] min-h-screen pb-20 pt-8 sm:pt-12">
      <div className="section-wrap">
        <div className="mb-6">
          <Link
            href="/packages"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF6B00] hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to All Packages</span>
          </Link>

          <div className="mt-3 flex items-center gap-2">
            <span className="rounded-full bg-[#FFF4E8] px-3 py-1 text-xs font-bold text-[#FF6B00]">
              TYPE 2: CUSTOM PACKAGES
            </span>
            <span className="text-xs text-stone-500">· Dynamic Recalculation Engine</span>
          </div>

          <h1 className="mt-2 text-3xl sm:text-4xl font-black text-[#0D0D0D] tracking-tight">
            Build Your Personalized Health Package
          </h1>
          <p className="mt-2 text-sm text-[#626262] max-w-2xl leading-relaxed">
            Pick only the tests you need. Subtotals, eligible bundle discounts, and transparent savings recalculate in real-time while strictly enforcing each test&apos;s configured discount cap.
          </p>
        </div>

        <CustomPackageBuilder />
      </div>
    </section>
  );
}
