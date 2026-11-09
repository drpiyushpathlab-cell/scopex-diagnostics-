import Link from "next/link";
import { Clock, Droplet, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, Calendar, Sparkles } from "lucide-react";
import { SeoLandingTemplate } from "@/components/seo/seo-components";
import { StructuredData } from "@/components/seo/structured-data";
import { packagesData, testsData } from "@/lib/data";
import { breadcrumbSchema, faqSchema, medicalTestSchema, organizationSchemas, productSchema, serviceSchema } from "@/lib/seo-schemas";
import { getPackageSeoSlug, getTestSeoSlug, type SeoLandingPage } from "@/lib/seo-platform";
import { QuickLeadTrigger } from "@/components/quick-lead-trigger";

export function SeoPageView({ page }: { page: SeoLandingPage }) {
  const test = testsData.find((item) => getTestSeoSlug(item) === page.slug || item.id === page.slug);
  const pkg = packagesData.find((item) => getPackageSeoSlug(item) === page.slug || item.id === page.slug);
  const schemas = [
    ...organizationSchemas(),
    breadcrumbSchema([{ name: "Home", path: "/" }, { name: page.h1, path: page.canonicalPath }]),
    faqSchema(page),
    serviceSchema(page),
    test ? medicalTestSchema(test, page.canonicalPath) : null,
    pkg ? productSchema(pkg, page.canonicalPath) : null
  ].filter(Boolean) as Record<string, unknown>[];

  return (
    <>
      <StructuredData data={schemas} />
      <SeoLandingTemplate page={page}>
        {page.kind === "blog" ? (
          <BlogBody page={page} />
        ) : test ? (
          <TestDetailBody test={test} page={page} />
        ) : (
          <SeoBody page={page} />
        )}
      </SeoLandingTemplate>
    </>
  );
}

function TestDetailBody({ test, page }: { test: typeof testsData[number]; page: SeoLandingPage }) {
  const savings = test.mrp && test.mrp > test.price ? test.mrp - test.price : 0;
  const savingsPercent = test.discount || (test.mrp ? Math.round((savings / test.mrp) * 100) : 0);

  return (
    <div className="mt-8 space-y-8">
      {/* Primary Clinical & Pricing Summary Card */}
      <div className="overflow-hidden rounded-3xl border border-[#EAEAEA] bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-[#FFF4E8] px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[#FF6B00]">
                {test.category} Category
              </span>
              <span className="rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-semibold text-[#0D0D0D]">
                {test.group}
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>NABL Quality Standards</span>
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-[#0D0D0D] tracking-tight">
              {test.name}
            </h2>

            <p className="text-sm sm:text-base text-[#626262] leading-relaxed">
              {page.intro || `${test.name} is processed in certified diagnostic laboratories using standardized automated analyzers with digital delivery.`}
            </p>
          </div>

          {/* Pricing Box */}
          <div className="rounded-2xl border border-[#FFD9C0] bg-[#FFF8F2] p-5 sm:p-6 lg:w-72 shrink-0">
            <p className="text-xs font-bold uppercase tracking-wider text-[#FF6B00]">Real Transparent Price</p>
            <div className="mt-1 flex items-baseline gap-2.5">
              <span className="text-3xl sm:text-4xl font-black text-[#0D0D0D]">
                ₹{test.price}
              </span>
              {test.mrp && test.mrp > test.price ? (
                <span className="text-base font-semibold text-[#8A8A8A] line-through">
                  ₹{test.mrp}
                </span>
              ) : null}
            </div>

            {savings > 0 ? (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-100/70 px-2.5 py-1 text-xs font-bold text-emerald-900">
                <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
                <span>You Save ₹{savings} ({savingsPercent}% Off)</span>
              </div>
            ) : null}

            <p className="mt-3 text-[11px] text-[#626262] leading-relaxed">
              Complimentary home phlebotomy on orders above ₹600. No hidden lab processing fees.
            </p>

            <div className="mt-4 flex flex-col gap-2">
              <Link
                href={`/book-home-collection?test=${encodeURIComponent(test.name)}`}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0D0D0D] px-4 py-3 text-xs font-bold text-white shadow-md transition hover:bg-[#FF6B00]"
              >
                <span>Book Home Collection</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <QuickLeadTrigger
                itemType="test"
                itemId={test.id}
                itemName={test.name}
                itemPrice={test.price}
                label="Request Callback / Enquire"
                className="w-full py-2.5"
                variant="outline"
              />
            </div>
          </div>
        </div>

        {/* Clinical Spec Grid: Fasting, Specimen, TAT, Prep */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 border-t border-[#EAEAEA] pt-6">
          <div className="rounded-2xl border border-[#EAEAEA] bg-[#F7F7F7] p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[#FF6B00]">
              <Droplet className="h-4 w-4" />
              <span>Specimen Type</span>
            </div>
            <p className="mt-2 text-sm font-bold text-[#0D0D0D]">{test.specimenType || "Blood Serum / EDTA"}</p>
            <p className="mt-1 text-[11px] text-[#626262]">Collected via sterile vacutainer</p>
          </div>

          <div className="rounded-2xl border border-[#EAEAEA] bg-[#F7F7F7] p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[#FF6B00]">
              <Clock className="h-4 w-4" />
              <span>Fasting Requirement</span>
            </div>
            <p className="mt-2 text-sm font-bold text-[#0D0D0D]">{test.fastingHours || "No Fasting Required"}</p>
            <p className="mt-1 text-[11px] text-[#626262]">Plain water permitted</p>
          </div>

          <div className="rounded-2xl border border-[#EAEAEA] bg-[#F7F7F7] p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[#FF6B00]">
              <Calendar className="h-4 w-4" />
              <span>Report Turnaround (TAT)</span>
            </div>
            <p className="mt-2 text-sm font-bold text-[#0D0D0D]">{test.tat || "12-24 Hrs"}</p>
            <p className="mt-1 text-[11px] text-[#626262]">Delivered to WhatsApp & Email</p>
          </div>

          <div className="rounded-2xl border border-[#EAEAEA] bg-[#F7F7F7] p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[#FF6B00]">
              <AlertCircle className="h-4 w-4" />
              <span>Preparation Guidance</span>
            </div>
            <p className="mt-2 text-xs font-semibold text-[#0D0D0D] line-clamp-2">
              {test.preparation || "Maintain standard hydration and take prescribed medications as instructed."}
            </p>
            <p className="mt-1 text-[11px] text-[#626262]">Follow advisor instructions</p>
          </div>
        </div>
      </div>

      {/* Biomarkers / Parameters Breakdown */}
      {test.components && test.components.length > 0 ? (
        <div className="rounded-3xl border border-[#EAEAEA] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-baseline justify-between border-b border-[#EAEAEA] pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#FF6B00]">Diagnostic Menu</p>
              <h3 className="mt-1 text-xl sm:text-2xl font-bold text-[#0D0D0D]">
                Included Biomarkers & Parameters ({test.components.length})
              </h3>
            </div>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-[#0D0D0D]">
              {test.components.length} Tests Included
            </span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {test.components.map((parameter, idx) => (
              <div
                key={parameter}
                className="flex items-start gap-2.5 rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] p-3 text-xs"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#FF6B00] mt-0.5" />
                <div>
                  <p className="font-bold text-[#0D0D0D]">{parameter}</p>
                  <p className="text-[10px] text-[#8A8A8A]">Parameter #{idx + 1}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* ScopeX Quality & Process Guarantee */}
      <div className="rounded-3xl border border-stone-800 bg-[#0D0D0D] p-6 text-white sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-700 bg-stone-900 px-3 py-1 text-xs font-bold text-[#FF6B00]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#FF6B00]" />
              <span>ScopeX Laboratory Quality Standard</span>
            </span>
            <h3 className="mt-3 text-xl sm:text-2xl font-black text-white">
              Zero Fake Discounts. Genuine NABL Quality Diagnostics.
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-stone-300 leading-relaxed">
              Every sample is drawn with barcoded, single-use vacuum tubes, stored in cold-chain transport, and processed on automated analytical platforms. Digital reports are verified by pathologist signature.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <Link
              href={`/book-home-collection?test=${encodeURIComponent(test.name)}`}
              className="cta-btn text-center"
            >
              Book Home Collection
            </Link>
            <Link
              href="/tests"
              className="rounded-xl border border-stone-700 bg-stone-900 px-5 py-2.5 text-center text-xs font-bold text-white hover:border-[#FF6B00] transition"
            >
              Browse All Tests
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function SeoBody({ page }: { page: SeoLandingPage }) {
  return (
    <div className="mt-8 grid gap-5 md:grid-cols-3">
      {[
        "Home sample collection workflows for convenient diagnostic booking.",
        "Digital reports designed for quick access and easy sharing.",
        "Internal links across tests, packages, cities, diseases, and health education."
      ].map((item) => (
        <div key={item} className="rounded-[24px] border border-[#f1dfce] bg-[#FFF8F2] p-5 text-sm leading-7 text-[#5f6868]">
          {item}
        </div>
      ))}
      <div className="rounded-[24px] border border-[#f1dfce] bg-white p-5 md:col-span-3">
        <h2 className="text-2xl font-bold text-[#0D0D0D]">Why choose ScopeX for {page.h1}?</h2>
        <p className="mt-3 text-sm leading-8 text-[#5f6868]">
          ScopeX Diagnostics combines transparent online booking, preventive health packages, advisor support, and a scalable city-first diagnostics architecture. This page is part of a structured SEO system that connects related tests, diseases, packages, corporate services, and city pages.
        </p>
      </div>
    </div>
  );
}

function BlogBody({ page }: { page: SeoLandingPage }) {
  return (
    <article className="mt-8 rounded-[28px] border border-[#f1dfce] bg-white p-6 shadow-[0_16px_36px_rgba(16,24,40,0.05)] md:p-8">
      <h2 className="text-2xl font-bold text-[#0D0D0D]">Table of Contents</h2>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-7 text-[#5f6868]">
        <li>What this report means</li>
        <li>When this test is useful</li>
        <li>Related tests and packages</li>
        <li>When to speak with a doctor</li>
      </ol>
      <h2 className="mt-8 text-2xl font-bold text-[#0D0D0D]">Patient Education</h2>
      <p className="mt-3 text-sm leading-8 text-[#5f6868]">{page.intro}</p>
      <p className="mt-3 text-sm leading-8 text-[#5f6868]">
        Diagnostic reports should be interpreted with symptoms, history, medication, and clinical context. ScopeX content is educational and does not replace medical consultation.
      </p>
    </article>
  );
}
