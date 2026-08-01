import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeoPageView } from "@/components/seo/seo-page-view";
import { seoTests, getSeoTestPage } from "@/lib/seo-platform";
import { seoMetadata } from "@/lib/seo-metadata";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return seoTests.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getSeoTestPage(slug);
  return page ? seoMetadata({ ...page, canonicalPath: `/tests/${slug}` }, `/tests/${slug}`) : { title: "Test Not Found" };
}

export default async function TestSeoPage({ params }: PageProps) {
  const { slug } = await params;
  const page = getSeoTestPage(slug);
  if (!page) notFound();
  return <SeoPageView page={{ ...page, canonicalPath: `/tests/${slug}` }} />;
}
