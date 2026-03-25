import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPackageById, packagesData } from "@/lib/data";

type PackagePageProps = {
  params: {
    packageId: string;
  };
};

export async function generateStaticParams() {
  return packagesData.map((item) => ({
    packageId: item.id
  }));
}

export async function generateMetadata({ params }: PackagePageProps): Promise<Metadata> {
  const item = getPackageById(params.packageId);

  if (!item) {
    return {
      title: "Package Not Found"
    };
  }

  return {
    title: `${item.name} Package`,
    description: `${item.name} by SCOPEX Diagnostics. ${item.tagline}. Book home collection with clear pricing and trusted processing.`
  };
}

export default function PackageDetailPage({ params }: PackagePageProps) {
  const item = getPackageById(params.packageId);

  if (!item) {
    notFound();
  }

  return (
    <section className="container-px py-10 md:py-14">
      <div className="section-wrap max-w-5xl">
        <Link href="/packages" className="mb-5 inline-flex text-sm font-semibold text-[#0f8f7c]">
          ← Back to Packages
        </Link>

        <div className="rounded-[30px] border border-[#deece9] bg-white p-6 shadow-[0_18px_42px_rgba(16,24,40,0.06)] md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0f8f7c]">{item.section}</p>
              <h1 className="mt-2 text-3xl font-bold text-[#102a2d] md:text-5xl">{item.name}</h1>
              <p className="mt-3 text-base leading-8 text-[#5a7273] md:text-lg">{item.tagline}</p>
            </div>
            <div className="rounded-[24px] border border-[#deece9] bg-[#f7fbfa] px-5 py-4">
              <p className="text-4xl font-extrabold text-[#f37021]">₹{new Intl.NumberFormat("en-IN").format(item.price)}</p>
              <p className="mt-1 text-sm text-[#7c8f90] line-through">MRP ₹{new Intl.NumberFormat("en-IN").format(item.mrp)}</p>
              <p className="mt-1 text-sm font-semibold text-[#0f8f7c]">{item.discount}% OFF</p>
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <div className="rounded-[24px] border border-[#deece9] bg-[#f8fbfb] p-5">
              <h2 className="text-lg font-bold text-[#102a2d]">Test Overview</h2>
              <ul className="mt-4 grid gap-2 text-sm leading-7 text-[#4f6b6d] sm:grid-cols-2">
                {item.overview.map((test) => (
                  <li key={test}>• {test}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-5">
              <div className="rounded-[24px] border border-[#deece9] bg-[#f8fbfb] p-5">
                <h2 className="text-lg font-bold text-[#102a2d]">Why this package?</h2>
                <ul className="mt-4 space-y-2 text-sm leading-7 text-[#4f6b6d]">
                  {item.whyPackage.map((point) => (
                    <li key={point} className="flex gap-2">
                      <span className="text-[#f37021]">?</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[24px] border border-[#deece9] bg-[#f8fbfb] p-5">
                <h2 className="text-lg font-bold text-[#102a2d]">Best For</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.bestFor.map((value) => (
                    <span key={value} className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-[#35595b]">
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
            <Link href="/packages" className="text-sm font-medium text-[#7c8f90] underline-offset-4 transition hover:text-[#0f8f7c] hover:underline">
              View all other packages
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

