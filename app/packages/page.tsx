import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PackageCard } from "@/components/package-card";
import { packagesData } from "@/lib/data";
import { Sparkles, ShieldCheck, CheckCircle2, Clock, Home, ArrowRight } from "lucide-react";
import { PackagesCompareTrigger } from "@/components/packages-compare-trigger";

export const metadata: Metadata = {
  title: "Health Packages | ScopeX Diagnostics",
  description: "Explore SCOPEX premium health packages with strong pricing visibility, savings, and home collection support."
};

export default function PackagesPage() {
  const sectionOrder = ["Stress & Lifestyle", "Preventive Health", "Advanced & Specialized"] as const;
  const sectionDescriptions: Record<(typeof sectionOrder)[number], string> = {
    "Stress & Lifestyle": "Stress, fatigue, digestion, and performance-focused screening built for modern routines.",
    "Preventive Health": "Routine wellness and full-body screening packages for proactive health tracking.",
    "Advanced & Specialized": "Deeper diagnostic plans for hormonal balance, confidential screening, and long-term monitoring."
  };
  const packageOrderBySection: Record<(typeof sectionOrder)[number], string[]> = {
    "Stress & Lifestyle": ["burnout-predictor-basic", "burnout-predictor-pro", "gut-health-check"],
    "Preventive Health": ["health-360-basic", "health-360-pro", "health-360-elite"],
    "Advanced & Specialized": ["longevity-package", "pcod-package", "std-package"]
  };

  return (
    <section id="packages" className="bg-[#FFFFFF] min-h-screen pb-20 pt-8 sm:pt-12">
      <div className="section-wrap">
        {/* Hero Banner matching Option C */}
        <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] mb-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#FFD9C0] bg-[#FFF4E8] px-3.5 py-1 text-xs font-bold text-[#FF6B00]">
              <Sparkles className="h-3.5 w-3.5 text-[#FF6B00]" />
              <span>NABL Certified Labs · Transparent Bundle Savings</span>
            </div>
            <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-black text-[#0D0D0D] tracking-tight leading-[1.08]">
              Preventive Health Packages for Every Family.
            </h1>
            <p className="mt-3 text-sm sm:text-base text-[#626262] leading-relaxed">
              Real prices with package savings applied automatically. Enjoy doorstep sample collection and certified NABL laboratory processing across every health panel.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-bold text-[#0D0D0D]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#FF6B00]" />
                <span>Zero Hidden Fees</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[#FF6B00]" />
                <span>NABL Standard Labs</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-[#FF6B00]" />
                <span>Digital Reports in 12-24 Hrs</span>
              </div>
            </div>

            <div className="mt-6">
              <PackagesCompareTrigger />
            </div>
          </div>

          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-[#EAEAEA] shadow-[0_16px_40px_rgba(13,13,13,0.06)] bg-[#F7F7F7]">
            <Image
              src="/images/family-health.jpg"
              alt="ScopeX preventive health checkups for the whole family"
              fill
              priority
              className="object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs font-bold">
              <span>Trusted by 10,000+ Indian Families</span>
              <span className="rounded-lg bg-white/20 px-2.5 py-1 backdrop-blur-sm">Home Collection</span>
            </div>
          </div>
        </div>

        {/* Section Groups */}
        <div className="space-y-14">
          {sectionOrder.map((sectionName) => {
            const sectionItems = packagesData.filter((item) => item.section === sectionName);
            if (!sectionItems.length) return null;
            const desiredOrder = packageOrderBySection[sectionName];
            const orderedItems = desiredOrder
              .map((id) => sectionItems.find((item) => item.id === id))
              .filter((item): item is NonNullable<typeof item> => Boolean(item));

            return (
              <div key={sectionName}>
                <div className="mb-6 max-w-3xl border-b border-[#EAEAEA] pb-3">
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#FF6B00]">{sectionName}</span>
                  <p className="mt-1 text-xs sm:text-sm text-[#626262]">{sectionDescriptions[sectionName]}</p>
                </div>

                <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {orderedItems.map((item) => (
                    <div key={item.id}>
                      <PackageCard item={item} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Signature Carbon Black Annual Health & Advisory Section */}
        <div className="mt-16 overflow-hidden rounded-3xl border border-stone-800 bg-[#0D0D0D] p-8 sm:p-12 text-white relative shadow-xl">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-[#FF6B00]/22 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-stone-700 bg-stone-900/90 px-3.5 py-1 text-xs font-bold text-[#FF6B00]">
                <ShieldCheck className="h-3.5 w-3.5 text-[#FF6B00]" />
                <span>Full-Body Wellness · Zero Hidden Fees</span>
              </span>
              <h3 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
                Need Help Choosing the Right Health Package?
              </h3>
              <p className="mt-3 text-xs sm:text-sm text-stone-300 leading-relaxed">
                Whether you need basic metabolic monitoring, deep vitamin checks, or complete full-body longevity profiles for your family, our clinical diagnostics team ensures transparent bundle pricing with doorstep sample pickup.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-semibold text-stone-300">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#FF6B00]" />
                  <span>Doorstep Collection Included</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#FF6B00]" />
                  <span>Free Report Consultation</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#FF6B00]" />
                  <span>NABL Standard Laboratories</span>
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
              <Link
                href="/book-home-collection"
                className="cta-btn text-center justify-center cursor-pointer shadow-[0_8px_24px_rgba(255,107,0,0.35)]"
              >
                Book Package Now
              </Link>
              <Link
                href="/health-advisor"
                className="rounded-xl border border-stone-700 bg-stone-900/90 px-6 py-3 text-xs font-bold text-white hover:border-[#FF6B00] hover:bg-stone-800 transition text-center"
              >
                Talk to Health Advisor
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
