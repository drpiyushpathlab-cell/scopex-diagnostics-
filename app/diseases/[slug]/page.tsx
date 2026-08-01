import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeoPageView } from "@/components/seo/seo-page-view";
import { diseasePages } from "@/lib/seo-platform";
import { seoMetadata } from "@/lib/seo-metadata";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return diseasePages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = diseasePages.find((item) => item.slug === slug);
  return page ? seoMetadata({ ...page, canonicalPath: `/diseases/${slug}` }, `/diseases/${slug}`) : { title: "Disease Page Not Found" };
}

export default async function DiseasePage({ params }: PageProps) {
  const { slug } = await params;
  const page = diseasePages.find((item) => item.slug === slug);
  if (!page) notFound();
  return <SeoPageView page={{ ...page, canonicalPath: `/diseases/${slug}` }} />;
}
