import type { Metadata } from "next";
import Link from "next/link";
import { PackageCard } from "@/components/package-card";
import { packagesData } from "@/lib/data";

export const metadata: Metadata = {
  title: "Packages",
  description: "Explore SCOPEX premium health packages with strong pricing visibility, savings, and home collection support."
};

export default function PackagesPage() {
  const featured = packagesData.find((item) => item.featured);
  const standard = packagesData.filter((item) => !item.featured);
  const orderedPackages = featured ? [featured, ...standard] : packagesData;

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

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-3">
          {orderedPackages.map((item) => (
            <div key={item.id} className={item.featured ? "lg:col-span-2" : ""}>
              <PackageCard item={item} />
            </div>
          ))}
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
