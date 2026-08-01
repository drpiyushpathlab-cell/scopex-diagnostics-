import type { Metadata } from "next";
import Link from "next/link";
import { getSeoCities, slugify } from "@/lib/seo-platform";

export const metadata: Metadata = {
  title: "Blood Test at Home by City | ScopeX Diagnostics",
  description:
    "Find ScopeX Diagnostics city pages for blood tests at home, lab tests, full body checkups, and home sample collection across India."
};

export default function CitiesIndexPage() {
  const cities = getSeoCities();

  return (
    <section className="container-px py-14 md:py-16">
      <div className="section-wrap">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#F7931E]">City SEO</p>
          <h1 className="mt-2 text-3xl font-bold text-[#0D0D0D] md:text-4xl">Blood test at home across India</h1>
          <p className="mt-4 text-sm leading-8 text-[#5f6868] md:text-base">
            ScopeX Diagnostics is building scalable city pages for home sample collection, preventive health checkups,
            and diagnostic services across India.
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cities.map((city) => (
            <Link
              key={city}
              href={`/blood-test-in-${slugify(city)}`}
              className="rounded-[22px] border border-[#f1dfce] bg-white p-4 text-sm font-semibold text-[#5f6868] shadow-[0_12px_28px_rgba(16,24,40,0.05)] transition hover:-translate-y-1 hover:border-[#F7931E] hover:text-[#F7931E]"
            >
              Blood Test in {city}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
