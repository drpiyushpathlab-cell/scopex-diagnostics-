import type { Metadata } from "next";
import Link from "next/link";
import { PackageCard } from "@/components/package-card";
import { packagesData } from "@/lib/data";

export const metadata: Metadata = {
  title: "Packages",
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
    <section id="packages" className="premium-section relative overflow-hidden pb-28 pt-10 md:pb-14 md:pt-12 scroll-mt-32">
      <div className="section-wrap relative z-10">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#FF6A00]">Premium Wellness Plans</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight md:text-5xl">Packages Crafted For Preventive Care, Precision Screening, and Better Conversions.</h1>
          <p className="premium-muted mt-4 text-base leading-7 md:text-lg">
            Clean pricing, trusted processing, and home collection convenience across every SCOPEX package.
          </p>
        </div>

        <div className="mt-8 space-y-10">
          {sectionOrder.map((sectionName) => {
            const sectionItems = packagesData.filter((item) => item.section === sectionName);
            if (!sectionItems.length) return null;
            const desiredOrder = packageOrderBySection[sectionName];
            const orderedItems = desiredOrder
              .map((id) => sectionItems.find((item) => item.id === id))
              .filter((item): item is NonNullable<typeof item> => Boolean(item));

            return (
              <div key={sectionName}>
                <div className="mb-5 max-w-3xl">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#FF6A00]">{sectionName}</p>
                  <p className="premium-muted mt-2 text-sm leading-7 md:text-base">{sectionDescriptions[sectionName]}</p>
                </div>

                <div className="grid items-stretch gap-6 lg:grid-cols-3">
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

        <div className="premium-panel mx-auto mt-10 max-w-4xl rounded-[28px] p-6 text-center md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#FF6A00]">Still Confused?</p>
          <h2 className="mt-2 text-3xl font-bold md:text-[2.2rem]">Need help choosing the right package?</h2>
          <p className="premium-muted mx-auto mt-3 max-w-2xl text-sm leading-7 md:text-base">
            Not sure which test is right for you? Get expert guidance in minutes.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/health-advisor" className="secondary-btn min-w-[200px] justify-center text-center">
              Talk to Advisor
            </Link>
            <Link href="/health-advisor" className="cta-btn min-w-[200px] justify-center text-center">
              Book Advisor Slot
            </Link>
          </div>
        </div>

        <div className="premium-panel mx-auto mt-8 max-w-4xl rounded-2xl p-6">
          <h2 className="text-2xl font-bold md:text-[2rem]">Preparation Instructions</h2>
          <p className="premium-muted mt-2 text-sm md:text-base">Follow these guidelines before sample collection</p>

          <ul className="mt-6 grid gap-4 text-[15px] leading-[1.6] md:grid-cols-2 md:text-base">
            <li className="premium-card-soft flex gap-3 rounded-xl px-4 py-3">
              <span className="text-lg">{"\u23F1"}</span>
              <span>Fasting required: 10 to 12 hours before test</span>
            </li>
            <li className="premium-card-soft flex gap-3 rounded-xl px-4 py-3">
              <span className="text-lg">{"\uD83D\uDEAB\uD83C\uDF54"}</span>
              <span>No food intake during fasting period</span>
            </li>
            <li className="premium-card-soft flex gap-3 rounded-xl px-4 py-3">
              <span className="text-lg">{"\uD83D\uDCA7"}</span>
              <span>Only water is allowed</span>
            </li>
            <li className="premium-card-soft flex gap-3 rounded-xl px-4 py-3">
              <span className="text-lg">{"\uD83D\uDC8A"}</span>
              <span>Continue regular medicines as advised by your physician</span>
            </li>
            <li className="premium-card-soft flex gap-3 rounded-xl px-4 py-3 md:col-span-2">
              <span className="text-lg">{"\uD83C\uDF05"}</span>
              <span>Morning sample collection is preferred</span>
            </li>
          </ul>

          <p className="premium-subtle mt-5 text-sm">Note: Specific tests may have different preparation requirements.</p>
        </div>
      </div>

      <div className="fixed inset-x-4 bottom-24 z-30 md:hidden">
        <Link href="/book-home-collection" className="cta-btn w-full justify-center text-center">
          Book Now
        </Link>
      </div>
    </section>
  );
}
