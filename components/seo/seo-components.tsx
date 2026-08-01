import Link from "next/link";
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

export function Breadcrumb({ items }: { items: Array<{ label: string; href: string }> }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-[#5f6868]">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <li key={item.href} className="flex items-center gap-2">
            {index > 0 ? <span className="text-[#9aa9aa]">/</span> : null}
            <Link href={item.href} className="font-semibold text-[#F7931E] hover:text-[#F7931E]">
              {item.label}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function FAQ({ items }: { items: FaqItem[] }) {
  return (
    <section className="mt-8 rounded-[28px] border border-[#f1dfce] bg-white p-6 shadow-[0_16px_36px_rgba(16,24,40,0.05)]">
      <h2 className="text-2xl font-bold text-[#0D0D0D]">Frequently Asked Questions</h2>
      <div className="mt-5 grid gap-3">
        {items.map((item) => (
          <details key={item.question} className="rounded-2xl border border-[#f1dfce] bg-[#FFF8F2] p-4">
            <summary className="cursor-pointer text-sm font-bold text-[#0D0D0D]">{item.question}</summary>
            <p className="mt-3 text-sm leading-7 text-[#5f6868]">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function TrustSection() {
  const items = ["Digital Reports", "Home Sample Collection", "Quality Processes", "Dedicated Support"];
  return (
    <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item} className="rounded-[22px] border border-[#f1dfce] bg-white p-5 shadow-[0_12px_28px_rgba(16,24,40,0.05)]">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff3e5] text-[#F7931E]">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m5 12.5 4 4L19 6.5" />
            </svg>
          </span>
          <h3 className="mt-4 text-base font-bold text-[#0D0D0D]">{item}</h3>
        </div>
      ))}
    </section>
  );
}

export function PopularTests({ ids = testsData.slice(0, 6).map((item) => item.id) }: { ids?: string[] }) {
  const items = ids.map(findTestById).filter((item): item is NonNullable<typeof item> => Boolean(item));
  return (
    <RelatedPanel title="Popular Tests">
      {items.map((item) => (
        <Link key={item.id} href={`/${getTestSeoSlug(item)}`} className="related-link">
          {item.name}
        </Link>
      ))}
    </RelatedPanel>
  );
}

export function PopularPackages({ ids = packagesData.slice(0, 4).map((item) => item.id) }: { ids?: string[] }) {
  const items = ids.map(findPackageById).filter((item): item is NonNullable<typeof item> => Boolean(item));
  return (
    <RelatedPanel title="Popular Packages">
      {items.map((item) => (
        <Link key={item.id} href={`/${getPackageSeoSlug(item)}`} className="related-link">
          {item.name}
        </Link>
      ))}
    </RelatedPanel>
  );
}

export function RelatedCities({ cities = getSeoCities().slice(0, 8) }: { cities?: string[] }) {
  return (
    <RelatedPanel title="Popular Cities">
      {cities.map((city) => (
        <Link key={city} href={`/blood-test-in-${slugify(city)}`} className="related-link">
          Blood Test in {city}
        </Link>
      ))}
    </RelatedPanel>
  );
}

export function RelatedArticles({ slugs = ["how-to-read-hba1c-report", "understand-lipid-profile"] }: { slugs?: string[] }) {
  const labels: Record<string, string> = {
    "how-to-read-hba1c-report": "How to Read HbA1c Report",
    "understand-lipid-profile": "Understand Lipid Profile Report"
  };

  return (
    <RelatedPanel title="Health Library">
      {slugs.map((slug) => (
        <Link key={slug} href={`/blogs/${slug}`} className="related-link">
          {labels[slug] ?? slug}
        </Link>
      ))}
    </RelatedPanel>
  );
}

function RelatedPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[24px] border border-[#f1dfce] bg-white p-5 shadow-[0_12px_28px_rgba(16,24,40,0.05)]">
      <h2 className="text-lg font-bold text-[#0D0D0D]">{title}</h2>
      <div className="mt-4 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function ReportCTA({ label = "Book Home Collection" }: { label?: string }) {
  return (
    <div className="mt-8 rounded-[28px] border border-[#f1dfce] bg-white p-6 shadow-[0_16px_36px_rgba(16,24,40,0.05)] md:p-8">
      <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#F7931E]">ScopeX Diagnostics</p>
          <h2 className="mt-2 text-2xl font-bold text-[#0D0D0D]">Book diagnostics with home sample collection</h2>
          <p className="mt-3 text-sm leading-7 text-[#5f6868]">
            Choose tests, packages, or advisor support with transparent pricing and digital reports.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/book-home-collection" className="cta-btn">
            {label}
          </Link>
          <Link href="/health-advisor" className="secondary-btn">
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
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#F7931E]">Health Library</p>
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
  return (
    <section className="container-px py-10 md:py-14">
      <div className="section-wrap max-w-6xl">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: page.h1, href: page.canonicalPath }]} />

        <div className="mt-5 rounded-[30px] border border-[#f1dfce] bg-white p-6 shadow-[0_18px_42px_rgba(16,24,40,0.06)] md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#F7931E]">{page.kind.replace("-", " ")}</p>
          <h1 className="mt-2 text-3xl font-bold text-[#0D0D0D] md:text-5xl">{page.h1}</h1>
          <p className="mt-4 max-w-4xl text-sm leading-8 text-[#5f6868] md:text-lg">{page.intro}</p>
          {page.kind === "blog" ? (
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-[#5f6868]">
              <span className="rounded-full bg-[#FFF8F2] px-3 py-1.5">Author: {page.author}</span>
              <span className="rounded-full bg-[#FFF8F2] px-3 py-1.5">Reviewer: {page.reviewer}</span>
              <span className="rounded-full bg-[#FFF8F2] px-3 py-1.5">Last Updated: {page.lastUpdated}</span>
            </div>
          ) : null}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/book-home-collection" className="cta-btn w-full sm:w-auto">
              {page.ctaLabel ?? "Book Now"}
            </Link>
            <Link href="/health-advisor" className="secondary-btn w-full sm:w-auto">
              Talk to Advisor
            </Link>
          </div>
        </div>

        <TrustSection />

        {children}

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <PopularTests ids={page.relatedTests} />
          <PopularPackages ids={page.relatedPackages} />
          <RelatedCities cities={page.relatedCities} />
        </div>

        <div className="mt-4">
          <RelatedArticles slugs={page.relatedArticles} />
        </div>

        <FAQ items={page.faq} />
        <ReportCTA label={page.ctaLabel} />
      </div>
    </section>
  );
}
