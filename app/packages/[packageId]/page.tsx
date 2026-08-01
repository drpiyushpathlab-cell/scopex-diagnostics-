import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPackageById, packagesData } from "@/lib/data";
import { getPackageSeoSlug, getSeoPackagePage } from "@/lib/seo-platform";
import { seoMetadata } from "@/lib/seo-metadata";

type PackagePageProps = {
  params: Promise<{
    packageId: string;
  }>;
};

export async function generateStaticParams() {
  return packagesData.flatMap((item) => [
    { packageId: item.id },
    { packageId: getPackageSeoSlug(item) }
  ]);
}

export async function generateMetadata({ params }: PackagePageProps): Promise<Metadata> {
  const { packageId } = await params;
  const seoPage = getSeoPackagePage(packageId);
  const item = getPackageById(packageId) ?? packagesData.find((pkg) => getPackageSeoSlug(pkg) === packageId);

  if (!item) {
    return {
      title: "Package Not Found"
    };
  }

  return seoPage ? seoMetadata({ ...seoPage, canonicalPath: `/packages/${packageId}` }, `/packages/${packageId}`) : {
    title: `${item.name} Package`,
    description: `${item.name} by SCOPEX Diagnostics. ${item.tagline}. Book home collection with clear pricing and trusted processing.`
  };
}

export default async function PackageDetailPage({ params }: PackagePageProps) {
  const { packageId } = await params;
  const item = getPackageById(packageId) ?? packagesData.find((pkg) => getPackageSeoSlug(pkg) === packageId);

  if (!item) {
    notFound();
  }

  return (
    <section className="container-px py-10 md:py-14">
      <div className="section-wrap max-w-5xl">
        <Link href="/packages" className="mb-5 inline-flex text-sm font-semibold text-[#F7931E]">
          ← Back to Packages
        </Link>

        <div className="rounded-[30px] border border-[#f1dfce] bg-white p-6 shadow-[0_18px_42px_rgba(16,24,40,0.06)] md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#F7931E]">{item.section}</p>
              <h1 className="mt-2 text-3xl font-bold text-[#0D0D0D] md:text-5xl">{item.name}</h1>
              <p className="mt-3 text-base leading-8 text-[#5f6868] md:text-lg">{item.tagline}</p>
            </div>
            <div className="rounded-[24px] border border-[#f1dfce] bg-[#FFF8F2] px-5 py-4">
              <p className="text-4xl font-extrabold text-[#F7931E]">₹{new Intl.NumberFormat("en-IN").format(item.price)}</p>
              <p className="mt-1 text-sm text-[#7c8f90] line-through">MRP ₹{new Intl.NumberFormat("en-IN").format(item.mrp)}</p>
              <p className="mt-1 text-sm font-semibold text-[#F7931E]">{item.discount}% OFF</p>
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <div className="rounded-[24px] border border-[#f1dfce] bg-[#f8fbfb] p-5">
              <h2 className="text-lg font-bold text-[#0D0D0D]">Test Overview</h2>
              <ul className="mt-4 grid gap-2 text-sm leading-7 text-[#5f6868] sm:grid-cols-2">
                {item.overview.map((test) => (
                  <li key={test}>• {test}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-5">
              <div className="rounded-[24px] border border-[#f1dfce] bg-[#f8fbfb] p-5">
                <h2 className="text-lg font-bold text-[#0D0D0D]">Why this package?</h2>
                <ul className="mt-4 space-y-2 text-sm leading-7 text-[#5f6868]">
                  {item.whyPackage.map((point) => (
                    <li key={point} className="flex gap-2">
                      <span className="text-[#F7931E]">?</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[24px] border border-[#f1dfce] bg-[#f8fbfb] p-5">
                <h2 className="text-lg font-bold text-[#0D0D0D]">Best For</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.bestFor.map((value) => (
                    <span key={value} className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-[#5f6868]">
                      {value}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={`/book-home-collection?package=${encodeURIComponent(item.name)}`} className="cta-btn w-full sm:w-auto">
              Book Home Collection
            </Link>
            <Link href="/health-advisor" className="secondary-btn w-full sm:w-auto">
              Talk to Advisor
            </Link>
          </div>

          <div className="mt-5">
            <Link href="/packages" className="text-sm font-medium text-[#7c8f90] underline-offset-4 transition hover:text-[#F7931E] hover:underline">
              View all other packages
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

