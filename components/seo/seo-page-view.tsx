import { SeoLandingTemplate } from "@/components/seo/seo-components";
import { StructuredData } from "@/components/seo/structured-data";
import { packagesData, testsData } from "@/lib/data";
import { breadcrumbSchema, faqSchema, medicalTestSchema, organizationSchemas, productSchema, serviceSchema } from "@/lib/seo-schemas";
import { getPackageSeoSlug, getTestSeoSlug, type SeoLandingPage } from "@/lib/seo-platform";

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
        {page.kind === "blog" ? <BlogBody page={page} /> : <SeoBody page={page} />}
      </SeoLandingTemplate>
    </>
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
