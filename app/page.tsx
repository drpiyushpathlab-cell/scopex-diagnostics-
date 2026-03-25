import type { Metadata } from "next";
import Link from "next/link";
import { HealthAdvisorSection } from "@/components/health-advisor-section";
import { packagesData } from "@/lib/data";

export const metadata: Metadata = {
  title: "Book Blood Test at Home | ScopeX Diagnostics India",
  description:
    "Book blood tests at home with ScopeX Diagnostics. Accurate reports, home sample collection, and preventive health packages. Now live in Lucknow and expanding across India."
};

type CategoryCard = {
  title: string;
  href: string;
  blurb: string;
  icon: React.ReactNode;
};

const categories: CategoryCard[] = [
  {
    title: "Full Body Checkup",
    href: "/packages",
    blurb: "Curated preventive packages for routine health screening and annual wellness.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z" />
        <path d="M8.5 21v-5.5l-1.5-4a2 2 0 0 1 1.9-2.7h6.2a2 2 0 0 1 1.9 2.7l-1.5 4V21" />
        <path d="M10 13h4" />
      </svg>
    )
  },
  {
    title: "Diabetes",
    href: "/tests?focus=basic-tests&search=sugar",
    blurb: "Quick access to HbA1c and sugar tests for diabetes-focused screening.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3c2.5 3.2 5 5.8 5 9a5 5 0 0 1-10 0c0-3.2 2.5-5.8 5-9Z" />
        <path d="M10 14c.4.8 1 1.2 2 1.2 1 0 1.6-.4 2-1.2" />
      </svg>
    )
  },
  {
    title: "Thyroid",
    href: "/tests?focus=profile-tests&search=thyroid",
    blurb: "Explore thyroid-focused screening with relevant profile and booking options.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 4c-2.5 0-4.5 1.8-4.5 4v1c0 1.5-.7 2.2-1.5 3 .8.8 1.5 1.5 1.5 3v1c0 2.2 2 4 4.5 4s4.5-1.8 4.5-4v-1c0-1.5.7-2.2 1.5-3-.8-.8-1.5-1.5-1.5-3V8c0-2.2-2-4-4.5-4Z" />
      </svg>
    )
  },
  {
    title: "Vitamins",
    href: "/tests?search=vitamin",
    blurb: "Book vitamin-focused screening for fatigue, wellness, and nutritional monitoring.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M9 7a3 3 0 0 1 6 0v10a3 3 0 0 1-6 0V7Z" />
        <path d="M9 12h6" />
      </svg>
    )
  },
  {
    title: "Women Health",
    href: "/packages",
    blurb: "Discover preventive packages suited for women's routine and wellness needs.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="9" r="4" />
        <path d="M12 13v8" />
        <path d="M9 18h6" />
      </svg>
    )
  },
  {
    title: "Senior Care",
    href: "/packages",
    blurb: "Preventive package options designed for age-focused screening and follow-up.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="7.5" r="3" />
        <path d="M9.5 21v-4.5c0-1.7 1.3-3 3-3s3 1.3 3 3V21" />
        <path d="M8 12.5l-1.5 2.5" />
      </svg>
    )
  }
];

const trustPoints = [
  {
    title: "NABL Standard",
    value: "Quality-first processing and dependable workflows.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3l7 4v5c0 4.2-2.9 7.9-7 9-4.1-1.1-7-4.8-7-9V7l7-4Z" />
        <path d="m9.5 12 1.7 1.7 3.3-3.3" />
      </svg>
    )
  },
  {
    title: "4.8 Star Rating",
    value: "Built for patients and families who want a smooth experience.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="m12 3 2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.9 7.2 18l.9-5.4-3.9-3.8 5.4-.8L12 3Z" />
      </svg>
    )
  },
  {
    title: "Home Collection",
    value: "Doorstep sample pickup that fits modern schedules.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M6.5 10.5V20h11V10.5" />
        <path d="M9.5 20v-5h5v5" />
      </svg>
    )
  },
  {
    title: "Fast Reports",
    value: "Digital reports designed for quick, clear follow-up.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V5A1.5 1.5 0 0 1 7.5 3.5H7Z" />
        <path d="M14 3.5V8h4" />
        <path d="M9 12h6M9 15.5h6" />
      </svg>
    )
  }
];

const seoHighlights = [
  "Book blood tests at home with digital-first convenience.",
  "Explore preventive health packages for routine and annual screening.",
  "Choose trusted home sample collection for patients, parents, and families.",
  "Access common diagnostics like CBC, thyroid, diabetes, vitamin, liver, and kidney tests."
];

const popularTests = [
  { label: "CBC", href: "/tests?focus=basic-tests&filter=blood&search=cbc" },
  { label: "Lipid Profile", href: "/tests?focus=profile-tests&filter=profile&search=lipid" },
  { label: "Thyroid", href: "/tests?focus=profile-tests&filter=profile&search=thyroid" },
  { label: "Vitamin D", href: "/tests?focus=hormone-special-tests&filter=hormone&search=vitamin%20d" },
  { label: "HbA1c", href: "/tests?focus=basic-tests&filter=blood&search=hba1c" },
  { label: "LFT", href: "/tests?focus=organ-function-tests&filter=profile&search=liver" }
];

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

const homepagePackageOrder = [
  "health-360-pro",
  "burnout-predictor-basic",
  "burnout-predictor-pro",
  "gut-health-check"
] as const;

const homepageBadgeClassMap: Record<string, string> = {
  "Most Popular": "bg-[#fff1e8] text-[#f37021] border border-[#ffd8bf]",
  Recommended: "bg-[#fff8d9] text-[#9a7600] border border-[#f6e294]",
  Advanced: "bg-[#f3ebff] text-[#7c3aed] border border-[#dac8ff]",
  Specialized: "bg-[#fff0e4] text-[#9a5a20] border border-[#f3d0ad]",
  "Start Here": "bg-[#eaf8ef] text-[#16a34a] border border-[#bde5c8]",
  "Best Value": "bg-[#eaf2ff] text-[#2563eb] border border-[#c8dafd]",
  Premium: "bg-[#ffe8ea] text-[#dc2626] border border-[#ffc5cb]",
  "Women Health": "bg-[#ffeaf4] text-[#db2777] border border-[#ffc8df]",
  Confidential: "bg-[#eef2f7] text-[#475569] border border-[#d4dbe4]"
};

export default function HomePage() {
  const featuredPackages = homepagePackageOrder
    .map((id) => packagesData.find((item) => item.id === id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <>
      <section id="hero" className="container-px pt-5 md:pt-8">
        <div className="section-wrap rounded-[32px] border border-[#d9ebe7] bg-white px-6 py-8 shadow-[0_20px_60px_rgba(16,24,40,0.08)] md:px-10 md:py-12">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="max-w-3xl">
              <p className="inline-flex rounded-full bg-[#ecfbf8] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#0f8f7c]">
                Home Diagnostics Across India
              </p>
              <h1 className="mt-5 text-4xl font-extrabold leading-tight text-[#102a2d] md:text-6xl">
                Book Blood Test at Home
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-[#4f6b6d] md:text-xl">
                Accurate, affordable diagnostics with home sample collection.
              </p>
              <p className="mt-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#0f8f7c] md:text-base">
                Now Live in Lucknow | Expanding to Pune, Nagpur, Varanasi &amp; Kanpur
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/book-home-collection" className="cta-btn w-full sm:w-auto">
                  Book Test Now
                </Link>
                <Link href="/packages" className="secondary-btn w-full sm:w-auto">
                  View Packages
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[28px] border border-[#d9ebe7] bg-[#f7fbfa] p-5 shadow-[0_14px_36px_rgba(15,143,124,0.08)]">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0f8f7c]">Why patients choose ScopeX</p>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-[#4f6b6d]">
                  <li>{"\u2714"} Easy online booking</li>
                  <li>{"\u2714"} Home sample collection</li>
                  <li>{"\u2714"} Preventive health packages</li>
                  <li>{"\u2714"} Fast digital reports</li>
                </ul>
              </div>
              <div className="rounded-[28px] border border-[#d9ebe7] bg-white p-5 shadow-[0_14px_36px_rgba(16,24,40,0.06)]">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0f8f7c]">Popular tests</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {popularTests.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="rounded-full bg-[#eef7f6] px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#24484a] transition hover:bg-[#fff2e9] hover:text-[#f37021]"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
                <div className="mt-4">
                  <Link
                    href="/tests"
                    className="inline-flex items-center justify-center rounded-full border border-[#dbe9e7] bg-[#f7fbfa] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#264547] transition hover:border-[#ffd8bf] hover:bg-[#fff7f1] hover:text-[#f37021]"
                  >
                    View All Tests
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-px pt-8 md:pt-10">
        <div className="section-wrap rounded-[28px] border border-[#d9ebe7] bg-[#f7fbfa] p-6 shadow-[0_12px_30px_rgba(16,24,40,0.05)]">
          <div className="max-w-4xl">
            <h2 className="text-2xl font-bold text-[#102a2d] md:text-3xl">Book tests, packages, and home collection with confidence</h2>
            <p className="mt-3 text-sm leading-8 text-[#4f6b6d] md:text-base">
              ScopeX Diagnostics is building a cleaner, digital-first diagnostic experience for patients and families.
              From routine blood tests to preventive health packages, our platform is designed for simple booking,
              transparent pricing, and dependable home sample collection.
            </p>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {seoHighlights.map((item) => (
              <div key={item} className="rounded-2xl bg-white px-4 py-3 text-sm leading-7 text-[#3f5d60] shadow-[0_8px_20px_rgba(16,24,40,0.04)]">
                {"\u2022"} {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="packages" className="container-px pt-12 md:pt-14">
        <div className="section-wrap">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0f8f7c]">Popular Packages</p>
              <h2 className="mt-2 text-3xl font-bold text-[#102a2d] md:text-4xl">Preventive packages with clear pricing</h2>
            </div>
            <Link href="/packages" className="hidden text-sm font-semibold text-[#0f8f7c] md:inline-flex">
              View all packages
            </Link>
          </div>

          <div className="mt-4 md:hidden">
            <Link
              href="/packages"
              className="inline-flex items-center text-sm font-semibold text-[#0f8f7c] underline-offset-4 transition hover:text-[#f37021] hover:underline"
            >
              View all packages
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featuredPackages.map((item) => (
              <article key={item.id} className="rounded-[28px] border border-[#deece9] bg-white p-5 shadow-[0_16px_36px_rgba(16,24,40,0.06)] transition hover:-translate-y-1 hover:shadow-[0_22px_46px_rgba(16,24,40,0.11)]">
                <Link
                  href={`/packages/${item.id}`}
                  aria-label={`${item.name} package details`}
                  className="group block cursor-pointer rounded-[20px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f8f7c]"
                >
                  <div className="flex items-start justify-between gap-3">
                  <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] ${homepageBadgeClassMap[item.badge] ?? "bg-[#ecfbf8] text-[#0f8f7c] border border-[#d9ebe7]"}`}>
                    {item.badge}
                  </span>
                  <span className="text-xs font-semibold text-[#0f8f7c]">{item.discount}% OFF</span>
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-[#102a2d] transition group-hover:text-[#0f8f7c]">{item.name}</h3>
                  <p className="mt-2 text-sm leading-7 text-[#5a7273]">{item.tagline}</p>
                  <div className="mt-5 flex items-end gap-3">
                    <p className="text-4xl font-extrabold text-[#102a2d]">{"\u20B9"}{formatPrice(item.price)}</p>
                    <div className="pb-1">
                      <p className="text-xs text-[#7c8f90] line-through">MRP {"\u20B9"}{formatPrice(item.mrp)}</p>
                      <p className="text-xs font-semibold text-[#0f8f7c]">Save {"\u20B9"}{formatPrice(item.mrp - item.price)}</p>
                    </div>
                  </div>
                  <ul className="mt-5 space-y-2 text-sm leading-7 text-[#4f6b6d]">
                    {item.overview.slice(0, 3).map((test) => (
                      <li key={test}>{"\u2022"} {test}</li>
                    ))}
                  </ul>
                  <span className="mt-4 inline-flex text-sm font-semibold text-[#0f8f7c] transition group-hover:text-[#f37021]">
                    View package details
                  </span>
                </Link>
                <Link href={`/book-home-collection?package=${encodeURIComponent(item.name)}`} className="cta-btn mt-6 w-full">
                  Book Now
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-5 flex justify-center">
            <Link
              href="/packages"
              className="inline-flex items-center text-sm font-semibold text-[#0f8f7c] underline-offset-4 transition hover:text-[#f37021] hover:underline"
            >
              View all other packages
            </Link>
          </div>
        </div>
      </section>

      <section className="container-px pt-12 md:pt-14">
        <div className="section-wrap">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0f8f7c]">Categories</p>
            <h2 className="mt-2 text-3xl font-bold text-[#102a2d] md:text-4xl">Choose diagnostics by health need</h2>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {categories.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group rounded-[28px] border border-[#deece9] bg-white p-6 shadow-[0_16px_36px_rgba(16,24,40,0.05)] transition duration-300 hover:-translate-y-1 hover:border-[#cfe4df] hover:shadow-[0_22px_46px_rgba(16,24,40,0.11)]"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-[#dcebe8] bg-[#f4fbf9] text-[#0f8f7c] transition-all duration-300 group-hover:border-[#ffd8bf] group-hover:bg-[#fff7f1] group-hover:text-[#f37021]">
                  {item.icon}
                </div>
                <h3 className="text-[1.9rem] font-bold leading-tight text-[#102a2d] md:text-[2rem]">{item.title}</h3>
                <p className="mt-3 max-w-[32ch] text-base leading-8 text-[#5a7273]">{item.blurb}</p>
                <span className="mt-5 inline-flex text-sm font-semibold uppercase tracking-[0.12em] text-[#0f8f7c] transition-colors duration-300 group-hover:text-[#f37021]">
                  Explore
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="why-scopex" className="container-px pt-12 md:pt-14">
        <div className="section-wrap">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0f8f7c]">Why ScopeX</p>
            <h2 className="mt-2 text-3xl font-bold text-[#102a2d] md:text-4xl">Designed for modern home diagnostics</h2>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {trustPoints.map((item) => (
              <article key={item.title} className="rounded-[26px] border border-[#deece9] bg-white p-5 shadow-[0_16px_36px_rgba(16,24,40,0.05)]">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#dcebe8] bg-[#f4fbf9] text-[#0f8f7c]">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-[#102a2d]">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[#5a7273]">{item.value}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <HealthAdvisorSection />

      <section className="container-px pb-10 pt-12 md:pb-14 md:pt-14">
        <div className="section-wrap rounded-[30px] border border-[#deece9] bg-white p-6 shadow-[0_18px_42px_rgba(16,24,40,0.06)] md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0f8f7c]">About ScopeX Diagnostics</p>
              <h2 className="mt-2 text-3xl font-bold text-[#102a2d] md:text-4xl">A cleaner diagnostic experience for patients and families</h2>
              <p className="mt-4 text-sm leading-8 text-[#5a7273] md:text-base">
                ScopeX Diagnostics helps patients book blood tests at home, access preventive health packages, and get
                digital reports with less friction. We are live in Lucknow today and building a broader D2C diagnostic
                platform for more cities across India. Our focus is simple: easy booking, reliable collection,
                transparent pricing, and a healthcare experience that feels modern and trustworthy.
              </p>
            </div>
            <div className="grid gap-3">
              {[
                "Home sample collection for busy schedules",
                "Full body checkup and preventive health packages",
                "Common tests like CBC, thyroid, sugar, vitamins, liver, and kidney profiles",
                "Built for mobile-first discovery and fast conversion"
              ].map((item) => (
                <div key={item} className="rounded-2xl bg-[#f7fbfa] px-4 py-3 text-sm leading-7 text-[#4f6b6d]">
                  {"\u2714"} {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
