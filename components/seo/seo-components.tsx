import Link from "next/link";
import { Sparkles, ShieldCheck, BookOpen, ExternalLink, MapPin, CheckCircle2, Info } from "lucide-react";
import { packagesData, testsData } from "@/lib/data";
import {
  findPackageById,
  findTestById,
  getPackageSeoSlug,
  getSeoCities,
  getTestSeoSlug,
  slugify,
  type FaqItem,
  type SeoLandingPage
} from "@/lib/seo-platform";
import { getPublishedSeoPageBySlug, type MedicalCitation } from "@/lib/seo-service";

export function Breadcrumb({ items }: { items: Array<{ label: string; href: string }> }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-[#5f6868]">
      <ol className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {items.map((item, index) => (
          <li key={item.href} className="flex items-center gap-1.5 sm:gap-2">
            {index > 0 ? <span className="text-[#9aa9aa]">/</span> : null}
            <Link
              href={item.href}
              className={`font-medium transition hover:text-[#FF6B00] ${
                index === items.length - 1 ? "font-bold text-[#0D0D0D]" : "text-[#FF6B00]"
              }`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function AeoDirectAnswerBox({
  answer,
  title
}: {
  answer: string;
  title?: string;
}) {
  if (!answer) return null;

  return (
    <section
      aria-label="Direct Clinical Answer"
      className="mt-6 rounded-3xl border-2 border-[#FFD9C0] bg-gradient-to-br from-[#FFF8F2] to-white p-5 sm:p-7 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FF6B00] px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white">
          <Sparkles className="h-3 w-3" />
          <span>Direct Answer (AEO Summary)</span>
        </span>
        <span className="text-xs text-[#8A8A8A] hidden sm:inline">Concise diagnostic summary</span>
      </div>

      <h2 className="mt-3 text-lg sm:text-xl font-black text-[#0D0D0D]">
        {title ? `Summary: ${title}` : "Key Diagnostic Takeaway"}
      </h2>

      <p className="mt-2 text-sm sm:text-base leading-relaxed text-[#2C2C2C] font-medium">
        {answer}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[#FFD9C0]/50 pt-3 text-xs text-[#626262]">
        <span className="flex items-center gap-1 text-emerald-700 font-semibold">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Factual & Verified Data</span>
        </span>
        <span className="text-stone-300">•</span>
        <span>Specimen Handling: Cold-Chain Protocol</span>
        <span className="text-stone-300">•</span>
        <span>Reporting: WhatsApp & Digital Portal</span>
      </div>
    </section>
  );
}

export function ClinicalReviewCard({
  reviewedBy = "Dr. Piyush Pathlab Clinical Team",
  reviewerCredentials = "MBBS, MD Pathology, ScopeX Medical Advisory Board",
  reviewDate = "2026-10-15",
  references
}: {
  reviewedBy?: string;
  reviewerCredentials?: string;
  reviewDate?: string;
  references?: MedicalCitation[];
}) {
  const defaultReferences: MedicalCitation[] = [
    {
      title: "ISO 15189: Medical laboratories — Requirements for quality and competence",
      source: "National Accreditation Board for Testing and Calibration Laboratories (NABL)",
      url: "https://nabl-india.org"
    },
    {
      title: "Standard Treatment Workflows & Diagnostic Guidelines",
      source: "Indian Council of Medical Research (ICMR)",
      url: "https://www.icmr.gov.in"
    },
    {
      title: "Laboratory Diagnostic Safety Protocols",
      source: "World Health Organization (WHO)",
      url: "https://www.who.int"
    }
  ];

  const citations = references && references.length > 0 ? references : defaultReferences;

  return (
    <section
      aria-label="Clinical Governance and Medical References"
      className="mt-8 rounded-3xl border border-[#EAEAEA] bg-white p-6 shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#EAEAEA] pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                Clinical Governance Sign-Off
              </span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                Verified
              </span>
            </div>
            <p className="text-sm font-bold text-[#0D0D0D]">
              Reviewed by {reviewedBy}
            </p>
            <p className="text-xs text-[#626262]">{reviewerCredentials}</p>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-[11px] text-[#8A8A8A]">Clinical Audit Date</p>
          <p className="text-xs font-bold text-[#0D0D0D]">{reviewDate}</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-2 text-xs font-bold text-[#0D0D0D]">
          <BookOpen className="h-4 w-4 text-[#FF6B00]" />
          <span>Medical Source References & Regulatory Standards:</span>
        </div>
        <ul className="mt-2.5 space-y-1.5 text-xs text-[#5f6868]">
          {citations.map((cite, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-[#FF6B00] font-bold">[{idx + 1}]</span>
              <div>
                <span className="font-semibold text-[#2C2C2C]">{cite.title}</span> —{" "}
                <span className="text-[#626262]">{cite.source}</span>
                {cite.url ? (
                  <a
                    href={cite.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1.5 inline-flex items-center gap-0.5 text-[#FF6B00] hover:underline"
                  >
                    <span>View</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function FAQ({ items }: { items: FaqItem[] }) {
  if (!items || items.length === 0) return null;

  return (
    <section className="mt-8 rounded-[28px] border border-[#f1dfce] bg-white p-6 shadow-[0_16px_36px_rgba(16,24,40,0.05)] sm:p-8">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B00]">AEO Structured Q&A</span>
          <h2 className="mt-1 text-2xl font-bold text-[#0D0D0D]">Frequently Asked Questions</h2>
        </div>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-[#626262]">
          {items.length} Answers
        </span>
      </div>

      <div className="mt-6 grid gap-3">
        {items.map((item, idx) => (
          <details
            key={item.question || idx}
            className="group rounded-2xl border border-[#f1dfce] bg-[#FFF8F2] p-4 transition-all open:bg-white open:shadow-sm"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm sm:text-base font-bold text-[#0D0D0D]">
              <span>{item.question}</span>
              <span className="text-[#FF6B00] font-black group-open:rotate-180 transition-transform text-lg ml-2">
                ↓
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-[#5f6868] border-t border-[#f1dfce] pt-3">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function TrustSection() {
  const items = [
    { title: "NABL Quality Protocols", desc: "Automated analyzers & standardized calibration" },
    { title: "Cold-Chain Phlebotomy", desc: "Temperature monitored sample transport bags" },
    { title: "Digital Verified Reports", desc: "Delivered directly via WhatsApp and web portal" },
    { title: "Zero Fake Discounts", desc: "Real honest pricing without inflated MRP tricks" }
  ];

  return (
    <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.title}
          className="rounded-[22px] border border-[#f1dfce] bg-white p-5 shadow-[0_12px_28px_rgba(16,24,40,0.05)]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff3e5] text-[#FF6B00]">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <h3 className="mt-4 text-base font-bold text-[#0D0D0D]">{item.title}</h3>
          <p className="mt-1 text-xs text-[#626262] leading-relaxed">{item.desc}</p>
        </div>
      ))}
    </section>
  );
}

export function PopularTests({ ids = testsData.slice(0, 6).map((item) => item.id) }: { ids?: string[] }) {
  const items = ids.map(findTestById).filter((item): item is NonNullable<typeof item> => Boolean(item));
  return (
    <RelatedPanel title="Popular Blood & Lab Tests">
      {items.map((item) => (
        <Link key={item.id} href={`/${getTestSeoSlug(item)}`} className="related-link text-xs">
          {item.name}
        </Link>
      ))}
    </RelatedPanel>
  );
}

export function PopularPackages({ ids = packagesData.slice(0, 4).map((item) => item.id) }: { ids?: string[] }) {
  const items = ids.map(findPackageById).filter((item): item is NonNullable<typeof item> => Boolean(item));
  return (
    <RelatedPanel title="Preventive Health Packages">
      {items.map((item) => (
        <Link key={item.id} href={`/${getPackageSeoSlug(item)}`} className="related-link text-xs">
          {item.name}
        </Link>
      ))}
    </RelatedPanel>
  );
}

export function RelatedCities({ cities = getSeoCities().slice(0, 8) }: { cities?: string[] }) {
  return (
    <RelatedPanel title="Doorstep Collection Cities">
      {cities.map((city) => (
        <Link key={city} href={`/blood-test-in-${slugify(city)}`} className="related-link text-xs flex items-center gap-1">
          <MapPin className="h-3 w-3 text-[#FF6B00]" />
          <span>{city}</span>
        </Link>
      ))}
    </RelatedPanel>
  );
}

export function RelatedArticles({
  slugs = ["how-to-read-hba1c-report", "understand-lipid-profile"]
}: {
  slugs?: string[]
}) {
  const labels: Record<string, string> = {
    "how-to-read-hba1c-report": "How to Read HbA1c Report",
    "understand-lipid-profile": "Understand Lipid Profile Report"
  };

  return (
    <RelatedPanel title="Health Education Library">
      {slugs.map((slug) => (
        <Link key={slug} href={`/blogs/${slug}`} className="related-link text-xs flex items-center gap-1.5">
          <BookOpen className="h-3 w-3 text-[#FF6B00]" />
          <span>{labels[slug] ?? slug.replace(/-/g, " ")}</span>
        </Link>
      ))}
    </RelatedPanel>
  );
}

function RelatedPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[24px] border border-[#f1dfce] bg-white p-5 shadow-[0_12px_28px_rgba(16,24,40,0.05)]">
      <h2 className="text-base font-bold text-[#0D0D0D]">{title}</h2>
      <div className="mt-3.5 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function ReportCTA({ label = "Book Home Collection" }: { label?: string }) {
  return (
    <div className="mt-8 rounded-[28px] border border-[#f1dfce] bg-white p-6 shadow-[0_16px_36px_rgba(16,24,40,0.05)] md:p-8">
      <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#FF6B00]">ScopeX Diagnostics</p>
          <h2 className="mt-2 text-2xl font-bold text-[#0D0D0D]">Book diagnostics with doorstep sample collection</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#5f6868]">
            Choose individual tests or full body health packages. Free home phlebotomy on eligible orders.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/book-home-collection" className="cta-btn text-center">
            {label}
          </Link>
          <Link href="/health-advisor" className="secondary-btn text-center">
            Talk to Advisor
          </Link>
        </div>
      </div>
    </div>
  );
}

export function HealthLibrary() {
  return (
    <section className="container-px pt-12 md:pt-14">
      <div className="section-wrap">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#FF6B00]">Health Library</p>
          <h2 className="mt-2 text-3xl font-bold text-[#0D0D0D] md:text-4xl">Learn before you book</h2>
          <p className="mt-3 text-sm leading-8 text-[#5f6868] md:text-base">
            Patient-friendly guides for common blood tests, report markers, preventive screening, and home diagnostics.
          </p>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Link href="/blogs/how-to-read-hba1c-report" className="rounded-[26px] border border-[#f1dfce] bg-white p-5 shadow-[0_16px_36px_rgba(16,24,40,0.05)] transition hover:-translate-y-1">
            <h3 className="text-xl font-bold text-[#0D0D0D]">How to Read HbA1c Report</h3>
            <p className="mt-2 text-sm leading-7 text-[#5f6868]">Understand average sugar markers and diabetes monitoring basics.</p>
          </Link>
          <Link href="/blogs/understand-lipid-profile" className="rounded-[26px] border border-[#f1dfce] bg-white p-5 shadow-[0_16px_36px_rgba(16,24,40,0.05)] transition hover:-translate-y-1">
            <h3 className="text-xl font-bold text-[#0D0D0D]">Understand Lipid Profile Report</h3>
            <p className="mt-2 text-sm leading-7 text-[#5f6868]">Learn what cholesterol, triglycerides, HDL, and LDL mean.</p>
          </Link>
        </div>
      </div>
    </section>
  );
}

export function SeoLandingTemplate({ page, children }: { page: SeoLandingPage; children?: React.ReactNode }) {
  // Check if we have dynamic AEO / clinical review in seo-service
  const dynamicSeo = getPublishedSeoPageBySlug(page.slug);
  const directAnswer = dynamicSeo?.aeoDirectAnswer || page.intro;
  const reviewer = dynamicSeo?.clinicalReview?.reviewedBy || page.reviewer || "Dr. Piyush Pathlab Clinical Team";
  const reviewerCreds = dynamicSeo?.clinicalReview?.reviewerCredentials || "MBBS, MD Pathology";
  const reviewDate = dynamicSeo?.clinicalReview?.reviewDate || page.lastUpdated || "2026-10-15";
  const citations = dynamicSeo?.medicalReferences;

  return (
    <section className="container-px py-8 md:py-12">
      <div className="section-wrap max-w-6xl">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: page.h1, href: page.canonicalPath }]} />

        {/* Hero Banner with Semantic H1 and Clear Diagnostic Scope */}
        <div className="mt-5 rounded-[30px] border border-[#f1dfce] bg-white p-6 shadow-[0_18px_42px_rgba(16,24,40,0.06)] md:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-[#FFF4E8] px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[#FF6B00]">
              {page.kind.replace("-", " ")}
            </span>
            <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>NABL Standard Quality</span>
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-black text-[#0D0D0D] md:text-5xl tracking-tight">
            {page.h1}
          </h1>

          <p className="mt-4 max-w-4xl text-sm leading-relaxed text-[#5f6868] md:text-base">
            {page.intro}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/book-home-collection" className="cta-btn w-full sm:w-auto text-center">
              {page.ctaLabel ?? "Book Home Collection"}
            </Link>
            <Link href="/health-advisor" className="secondary-btn w-full sm:w-auto text-center">
              Consult Diagnostic Advisor
            </Link>
          </div>
        </div>

        {/* AEO Direct Answer Box: prominent 40-60 word synthesis for Answer Engines */}
        <AeoDirectAnswerBox answer={directAnswer} title={page.h1} />

        <TrustSection />

        {children}

        {/* GEO Medical Citations and Clinical Review Sign-Off */}
        <ClinicalReviewCard
          reviewedBy={reviewer}
          reviewerCredentials={reviewerCreds}
          reviewDate={reviewDate}
          references={citations}
        />

        {/* Internal Linking Graph connecting Tests, Packages, Cities, Articles */}
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <PopularTests ids={page.relatedTests} />
          <PopularPackages ids={page.relatedPackages} />
          <RelatedCities cities={page.relatedCities} />
        </div>

        <div className="mt-4">
          <RelatedArticles slugs={page.relatedArticles} />
        </div>

        {/* AEO Structured FAQ with Schema Integration */}
        <FAQ items={page.faq} />

        <ReportCTA label={page.ctaLabel} />
      </div>
    </section>
  );
}
