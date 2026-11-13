import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo-platform";
import { listSeoPages } from "@/lib/seo-service";

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

const staticRoutes = [
  { path: "/", frequency: "daily", priority: 1.0 },
  { path: "/tests", frequency: "daily", priority: 0.9 },
  { path: "/packages", frequency: "daily", priority: 0.9 },
  { path: "/blogs", frequency: "weekly", priority: 0.8 },
  { path: "/cities", frequency: "weekly", priority: 0.8 },
  { path: "/diseases", frequency: "weekly", priority: 0.8 },
  { path: "/book-home-collection", frequency: "weekly", priority: 0.9 },
  { path: "/growth-partners", frequency: "monthly", priority: 0.7 },
  { path: "/about", frequency: "monthly", priority: 0.6 },
  { path: "/contact", frequency: "monthly", priority: 0.6 },
  { path: "/medical-advisory-board", frequency: "monthly", priority: 0.6 },
  { path: "/quality-assurance", frequency: "monthly", priority: 0.6 },
  { path: "/nabl", frequency: "monthly", priority: 0.6 },
  { path: "/partner-with-us", frequency: "monthly", priority: 0.6 },
  { path: "/corporate", frequency: "monthly", priority: 0.6 },
  { path: "/government-projects", frequency: "monthly", priority: 0.5 },
  { path: "/privacy-policy", frequency: "yearly", priority: 0.3 },
  { path: "/terms-and-conditions", frequency: "yearly", priority: 0.3 },
  { path: "/refund-policy", frequency: "yearly", priority: 0.3 }
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // 1. Static routes
  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: now,
    changeFrequency: route.frequency as ChangeFrequency,
    priority: route.priority
  }));

  // 2. Dynamic published SEO pages from SEO service
  // Respects index/no-index and published status
  const publishedSeoPages = listSeoPages({ status: "published" }).filter(
    (page) => !page.robots.includes("noindex")
  );

  const dynamicEntries: MetadataRoute.Sitemap = publishedSeoPages.map((page) => ({
    url: page.canonicalUrl || absoluteUrl(page.canonicalPath),
    lastModified: page.updatedAt ? new Date(page.updatedAt) : now,
    changeFrequency: (page.changeFrequency || "weekly") as ChangeFrequency,
    priority: page.priority || 0.7
  }));

  // Ensure unique URLs
  const unique = new Map<string, MetadataRoute.Sitemap[number]>();
  [...staticEntries, ...dynamicEntries].forEach((entry) => unique.set(entry.url, entry));
  return Array.from(unique.values());
}
