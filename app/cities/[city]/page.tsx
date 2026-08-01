import type { Metadata } from "next";
import { SeoPageView } from "@/components/seo/seo-page-view";
import { getCityPage, getSeoCities, slugify } from "@/lib/seo-platform";
import { seoMetadata } from "@/lib/seo-metadata";

type PageProps = {
  params: Promise<{ city: string }>;
};

export async function generateStaticParams() {
  return getSeoCities().map((city) => ({ city: slugify(city) }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city } = await params;
  const page = { ...getCityPage(city), canonicalPath: `/cities/${city}` };
  return seoMetadata(page, `/cities/${city}`);
}

export default async function CityPage({ params }: PageProps) {
  const { city } = await params;
  return <SeoPageView page={{ ...getCityPage(city), canonicalPath: `/cities/${city}` }} />;
}
