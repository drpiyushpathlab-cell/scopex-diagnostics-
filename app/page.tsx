import type { Metadata } from "next";
import Link from "next/link";
import { HealthLibrary } from "@/components/seo/seo-components";
import { StructuredData } from "@/components/seo/structured-data";
import { HealthAdvisorSection } from "@/components/health-advisor-section";
import { Hero } from "@/components/hero";
import { TestSearchDiscovery } from "@/components/test-search-discovery";
import { HowItWorks } from "@/components/how-it-works";
import { LabQualitySection } from "@/components/lab-quality-section";
import { DigitalReportsTrust } from "@/components/digital-reports-trust";
import { FaqSection } from "@/components/faq-section";
import { packagesData, testsData } from "@/lib/data";
import { organizationSchemas } from "@/lib/seo-schemas";
import { getSeoCities, getTestSeoSlug, slugify } from "@/lib/seo-platform";
import { Check, ChevronRight, ShieldCheck, Clock, Home, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Book Blood Test at Home | ScopeX Diagnostics India",
  description:
    "Book blood tests at home with ScopeX Diagnostics across major Indian cities. Accurate reports, home sample collection, and preventive health packages through a growing Pan India diagnostic network."
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
    title: "Diabetes & Sugar",
    href: "/tests?focus=basic-tests&search=sugar",
    blurb: "Quick access to HbA1c and fasting blood sugar tests for metabolic screening.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3c2.5 3.2 5 5.8 5 9a5 5 0 0 1-10 0c0-3.2 2.5-5.8 5-9Z" />
        <path d="M10 14c.4.8 1 1.2 2 1.2 1 0 1.6-.4 2-1.2" />
      </svg>
    )
  },
  {
    title: "Thyroid Profile",
    href: "/tests?focus=profile-tests&search=thyroid",
    blurb: "Explore thyroid screening with Total T3, Total T4, and Ultrasensitive TSH.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 4c-2.5 0-4.5 1.8-4.5 4v1c0 1.5-.7 2.2-1.5 3 .8.8 1.5 1.5 1.5 3v1c0 2.2 2 4 4.5 4s4.5-1.8 4.5-4v-1c0-1.5.7-2.2 1.5-3-.8-.8-1.5-1.5-1.5-3V8c0-2.2-2-4-4.5-4Z" />
      </svg>
    )
  },
  {
    title: "Vitamins & Fatigue",
    href: "/tests?search=vitamin",
    blurb: "Vitamin D (25-OH) and Vitamin B12 for bone strength, energy, and nerve health.",
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
    blurb: "Preventive packages suited for hormone balance, iron/anemia, and wellness.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="9" r="4" />
        <path d="M12 13v8" />
        <path d="M9 18h6" />
      </svg>
    )
  },
  {
    title: "Senior Citizen Care",
    href: "/packages",
    blurb: "Comprehensive geriatric screening covering kidney, liver, heart, and joints.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="7.5" r="3" />
        <path d="M9.5 21v-4.5c0-1.7 1.3-3 3-3s3 1.3 3 3V21" />
        <path d="M8 12.5l-1.5 2.5" />
      </svg>
    )
  }
];

const healthSystems = [
  ["Metabolic & Sugar", "HbA1c, fasting glucose, insulin, and lipid markers"],
  ["Thyroid Care", "TSH, Free T3, and Free T4 profile testing"],
  ["Heart & Cardiovascular", "Lipid profile, cholesterol risk ratios, cardiac markers"],
  ["Liver Function (LFT)", "Bilirubin, SGOT, SGPT, alkaline phosphatase"],
  ["Kidney Function (KFT)", "Serum creatinine, BUN, uric acid, electrolytes"],
  ["Vitamins & Immunity", "Vitamin D (25-OH), B12, iron, and ferritin screening"]
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

export default function HomePage() {
  const featuredPackages = homepagePackageOrder
    .map((id) => packagesData.find((item) => item.id === id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const cityLinks = getSeoCities().slice(0, 8);
  const popularSeoTests = testsData.slice(0, 8);

  return (
    <>
      <StructuredData data={organizationSchemas()} />

      {/* 1. HERO SECTION */}
      <Hero />

      {/* 2. TEST SEARCH AND DISCOVERY (Floating Card with Tabs & 6 Quick Cards) */}
      <TestSearchDiscovery />

      {/* 3. DIGITAL REPORTS ANYTIME ANYWHERE (Option C Dark Banner) */}
      <DigitalReportsTrust />

      {/* 4. OUR POPULAR HEALTH PACKAGES (Matching Option C Concept) */}
      <section id="packages" className="bg-[#FFFFFF] py-14 sm:py-20 border-b border-[#EAEAEA]">
        <div className="section-wrap">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0D0D0D] tracking-tight">
              Our Popular Health Packages
            </h2>
            <Link
              href="/packages"
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#FF6B00] hover:underline shrink-0"
            >
              <span>View All Packages</span>
              <span className="text-base font-bold">→</span>
            </Link>
          </div>

          {/* 3 Featured Packages matching Option C */}
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Card 1: Full Body Health Checkup */}
            <article className="group flex flex-col justify-between rounded-2xl border border-[#EAEAEA] bg-white p-6 shadow-xs transition hover:-translate-y-1 hover:border-[#FF6B00]/60 hover:shadow-lg">
              <div>
                <h3 className="text-xl font-bold text-[#0D0D0D]">
                  Full Body Health Checkup
                </h3>
                <p className="text-xs font-semibold text-[#626262] mt-0.5">
                  (50+ Tests)
                </p>

                {/* Pricing Block with Strikethrough & Discount Badge */}
                <div className="mt-4 flex items-center gap-2.5">
                  <span className="text-3xl font-black text-[#FF6B00]">
                    ₹1,299
                  </span>
                  <span className="text-sm font-medium text-[#8A8A8A] line-through">
                    ₹5,000
                  </span>
                  <span className="rounded bg-[#FF6B00] px-2 py-0.5 text-[10px] font-extrabold uppercase text-white">
                    74% OFF
                  </span>
                </div>

                {/* Inclusions */}
                <ul className="mt-5 space-y-2.5 text-xs text-[#0D0D0D]">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-[#FF6B00] stroke-[2.5]" />
                    <span>Complete health overview</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-[#FF6B00] stroke-[2.5]" />
                    <span>NABL certified</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-[#FF6B00] stroke-[2.5]" />
                    <span>Home collection included</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-2">
                <Link
                  href="/book-home-collection?package=Full%20Body%20Health%20Checkup"
                  className="cta-btn flex w-full items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-extrabold uppercase tracking-wider text-white bg-[#FF6B00] shadow-[0_6px_20px_rgba(255,107,0,0.3)] transition hover:bg-[#E85900]"
                >
                  <span>Book Now</span>
                  <span className="text-sm">→</span>
                </Link>
              </div>
            </article>

            {/* Card 2: Diabetes Checkup */}
            <article className="group flex flex-col justify-between rounded-2xl border border-[#EAEAEA] bg-white p-6 shadow-xs transition hover:-translate-y-1 hover:border-[#FF6B00]/60 hover:shadow-lg">
              <div>
                <h3 className="text-xl font-bold text-[#0D0D0D]">
                  Diabetes Checkup
                </h3>
                <p className="text-xs font-semibold text-[#626262] mt-0.5">
                  (16 Tests)
                </p>

                {/* Pricing Block with Strikethrough & Discount Badge */}
                <div className="mt-4 flex items-center gap-2.5">
                  <span className="text-3xl font-black text-[#FF6B00]">
                    ₹699
                  </span>
                  <span className="text-sm font-medium text-[#8A8A8A] line-through">
                    ₹1,999
                  </span>
                  <span className="rounded bg-[#FF6B00] px-2 py-0.5 text-[10px] font-extrabold uppercase text-white">
                    65% OFF
                  </span>
                </div>

                {/* Inclusions */}
                <ul className="mt-5 space-y-2.5 text-xs text-[#0D0D0D]">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-[#FF6B00] stroke-[2.5]" />
                    <span>Blood sugar &amp; HbA1c</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-[#FF6B00] stroke-[2.5]" />
                    <span>Kidney function</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-[#FF6B00] stroke-[2.5]" />
                    <span>With report guidance</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-2">
                <Link
                  href="/book-home-collection?package=Diabetes%20Checkup"
                  className="cta-btn flex w-full items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-extrabold uppercase tracking-wider text-white bg-[#FF6B00] shadow-[0_6px_20px_rgba(255,107,0,0.3)] transition hover:bg-[#E85900]"
                >
                  <span>Book Now</span>
                  <span className="text-sm">→</span>
                </Link>
              </div>
            </article>

            {/* Card 3: Liver Health Checkup */}
            <article className="group flex flex-col justify-between rounded-2xl border border-[#EAEAEA] bg-white p-6 shadow-xs transition hover:-translate-y-1 hover:border-[#FF6B00]/60 hover:shadow-lg">
              <div>
                <h3 className="text-xl font-bold text-[#0D0D0D]">
                  Liver Health Checkup
                </h3>
                <p className="text-xs font-semibold text-[#626262] mt-0.5">
                  (12 Tests)
                </p>

                {/* Pricing Block with Strikethrough & Discount Badge */}
                <div className="mt-4 flex items-center gap-2.5">
                  <span className="text-3xl font-black text-[#FF6B00]">
                    ₹799
                  </span>
                  <span className="text-sm font-medium text-[#8A8A8A] line-through">
                    ₹2,200
                  </span>
                  <span className="rounded bg-[#FF6B00] px-2 py-0.5 text-[10px] font-extrabold uppercase text-white">
                    64% OFF
                  </span>
                </div>

                {/* Inclusions */}
                <ul className="mt-5 space-y-2.5 text-xs text-[#0D0D0D]">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-[#FF6B00] stroke-[2.5]" />
                    <span>Liver function tests</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-[#FF6B00] stroke-[2.5]" />
                    <span>Complete liver profile</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-[#FF6B00] stroke-[2.5]" />
                    <span>Home collection included</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-2">
                <Link
                  href="/book-home-collection?package=Liver%20Health%20Checkup"
                  className="cta-btn flex w-full items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-extrabold uppercase tracking-wider text-white bg-[#FF6B00] shadow-[0_6px_20px_rgba(255,107,0,0.3)] transition hover:bg-[#E85900]"
                >
                  <span>Book Now</span>
                  <span className="text-sm">→</span>
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS (Simple 4-Step Process) */}
      <HowItWorks />

      {/* 6. WHY CHOOSE SCOPEX (3 Visual Feature Cards) */}
      <LabQualitySection />

      {/* 7. DIAGNOSTICS BY HEALTH SYSTEM */}
      <section className="bg-white py-14 sm:py-20 border-b border-[#EAEAEA]">
        <div className="section-wrap grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#EAEAEA] bg-[#FFF4E8] px-3.5 py-1 text-xs font-bold text-[#FF6B00]">
              <span>System-By-System Guidance</span>
            </div>
            <h2 className="mt-3 text-3xl font-extrabold text-[#0D0D0D] sm:text-4xl leading-tight">
              Understand health by the markers that matter.
            </h2>
            <p className="mt-3 text-sm text-[#626262] leading-relaxed">
              ScopeX groups diagnostic tests into intuitive organ systems so patients and physicians can transition from symptoms to accurate clinical investigations without guesswork.
            </p>
            <div className="mt-6">
              <Link href="/tests" className="secondary-btn rounded-xl">
                Explore Full Test Catalogue
              </Link>
            </div>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            {healthSystems.map(([title, text]) => (
              <Link
                key={title}
                href={`/tests?search=${encodeURIComponent(title.split(" ")[0])}`}
                className="group rounded-2xl border border-[#EAEAEA] bg-[#F7F7F7] p-5 transition hover:-translate-y-0.5 hover:border-[#FF6B00] hover:bg-white hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#0D0D0D] group-hover:text-[#FF6B00] transition-colors">
                    {title}
                  </h3>
                  <ChevronRight className="h-4 w-4 text-[#8A8A8A] group-hover:text-[#FF6B00] group-hover:translate-x-0.5 transition" />
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-[#626262]">
                  {text}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 8. HEALTH CATEGORIES GRID */}
      <section className="bg-[#F7F7F7] py-14 sm:py-20 border-b border-[#EAEAEA]">
        <div className="section-wrap">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FF6B00]">
              Health Categories
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0D0D0D] tracking-tight">
              Choose Diagnostics by Need
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#626262]">
              Explore focused health profiles crafted for routine wellness, disease management, and preventive screening.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group rounded-2xl border border-[#EAEAEA] bg-white p-6 shadow-xs transition hover:-translate-y-0.5 hover:border-[#FF6B00]/50 hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF4E8] text-[#FF6B00] transition group-hover:scale-105">
                  {item.icon}
                </div>
                <h3 className="mt-4 text-lg font-bold text-[#0D0D0D] group-hover:text-[#FF6B00] transition-colors">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-xs text-[#626262] leading-relaxed">
                  {item.blurb}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#FF6B00] group-hover:underline">
                  <span>Explore category</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 9. HEALTH ADVISOR CONSULTATION SECTION */}
      <HealthAdvisorSection />

      {/* 10. PAN INDIA CITY COVERAGE */}
      <section className="bg-white py-14 sm:py-20 border-b border-[#EAEAEA]">
        <div className="section-wrap">
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr] items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FF6B00]">
                Pan India Diagnostic Network
              </p>
              <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0D0D0D] tracking-tight">
                Doorstep sample collection across major Indian cities
              </h2>
              <p className="mt-3 text-xs sm:text-sm text-[#626262] leading-relaxed">
                ScopeX Diagnostics provides home phlebotomy visits with sealed cold-chain logistics across Delhi NCR, Mumbai, Bengaluru, Hyderabad, Pune, Kolkata, Chennai, Ahmedabad, and more.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {cityLinks.map((city) => (
                <Link
                  key={city}
                  href={`/blood-test-in-${slugify(city)}`}
                  className="rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] p-3 text-center text-xs font-semibold text-[#0D0D0D] transition hover:border-[#FF6B00] hover:bg-[#FFF4E8] hover:text-[#FF6B00]"
                >
                  {city}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 11. FAQ SECTION */}
      <FaqSection />

      {/* 12. HEALTH LIBRARY & CLINICAL DIRECTORY */}
      <HealthLibrary />
    </>
  );
}
