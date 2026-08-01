import type { Metadata } from "next";
import Link from "next/link";
import { blogPages } from "@/lib/seo-platform";

export const metadata: Metadata = {
  title: "Health Library | ScopeX Diagnostics",
  description:
    "Read ScopeX Diagnostics health library articles about blood tests, report interpretation, preventive checkups, and diagnostic health education."
};

export default function BlogsIndexPage() {
  return (
    <section className="container-px py-14 md:py-16">
      <div className="section-wrap">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#F7931E]">Health Library</p>
          <h1 className="mt-2 text-3xl font-bold text-[#0D0D0D] md:text-4xl">Diagnostic health guides</h1>
          <p className="mt-4 text-sm leading-8 text-[#5f6868] md:text-base">
            Explore patient-friendly articles for understanding blood tests, preventive health markers, and reports.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {blogPages.map((page) => (
            <Link
              key={page.slug}
              href={`/blogs/${page.slug}`}
              className="rounded-[26px] border border-[#f1dfce] bg-white p-5 shadow-[0_16px_36px_rgba(16,24,40,0.05)] transition hover:-translate-y-1"
            >
              <h2 className="text-xl font-bold text-[#0D0D0D]">{page.h1}</h2>
              <p className="mt-2 text-sm leading-7 text-[#5f6868]">{page.description}</p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#F7931E]">Read Article</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
