import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeoPageView } from "@/components/seo/seo-page-view";
import { getAllSeoPages, getSeoPageBySlug } from "@/lib/seo-platform";
import { seoMetadata } from "@/lib/seo-metadata";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllSeoPages()
    .filter((page) => page.kind !== "blog")
    .map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getSeoPageBySlug(slug);
  return page ? seoMetadata(page) : { title: "Page Not Found" };
}

export default async function SeoSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const page = getSeoPageBySlug(slug);

  if (!page) notFound();

  return <SeoPageView page={page} />;
}
