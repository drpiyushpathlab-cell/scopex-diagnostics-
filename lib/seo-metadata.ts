import type { Metadata } from "next";
import { absoluteUrl, type SeoLandingPage } from "@/lib/seo-platform";

export function seoMetadata(page: SeoLandingPage, canonicalPath = page.canonicalPath): Metadata {
  return {
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    alternates: {
      canonical: canonicalPath
    },
    openGraph: {
      title: page.title,
      description: page.description,
      url: absoluteUrl(canonicalPath),
      siteName: "SCOPEX DIAGNOSTICS",
      type: page.kind === "blog" ? "article" : "website",
      images: [{ url: absoluteUrl("/brand/weblogo.png"), width: 1200, height: 630, alt: "ScopeX Diagnostics" }]
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: [absoluteUrl("/brand/weblogo.png")]
    }
  };
}
