import type { MetadataRoute } from "next";
import { absoluteUrl, getAllSeoPages, seoPackages } from "@/lib/seo-platform";

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

const staticRoutes = [
  { path: "/", frequency: "daily", priority: 1 },
  { path: "/tests", frequency: "weekly", priority: 0.8 },
  { path: "/packages", frequency: "weekly", priority: 0.8 },
  { path: "/blogs", frequency: "weekly", priority: 0.7 },
  { path: "/cities", frequency: "weekly", priority: 0.7 },
  { path: "/diseases", frequency: "weekly", priority: 0.7 },
  { path: "/book-home-collection", frequency: "weekly", priority: 0.8 },
  { path: "/growth-partners", frequency: "monthly", priority: 0.7 },
  { path: "/about", frequency: "monthly", priority: 0.6 },
  { path: "/contact", frequency: "monthly", priority: 0.6 },
  { path: "/medical-advisory-board", frequency: "monthly", priority: 0.5 },
  { path: "/quality-assurance", frequency: "monthly", priority: 0.5 },
  { path: "/nabl", frequency: "monthly", priority: 0.5 },
  { path: "/careers", frequency: "monthly", priority: 0.4 },
  { path: "/partner-with-us", frequency: "monthly", priority: 0.6 },
  { path: "/corporate", frequency: "monthly", priority: 0.6 },
  { path: "/government-projects", frequency: "monthly", priority: 0.6 },
  { path: "/privacy-policy", frequency: "yearly", priority: 0.3 },
  { path: "/terms-and-conditions", frequency: "yearly", priority: 0.3 },
  { path: "/refund-policy", frequency: "yearly", priority: 0.3 }
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: now,
    changeFrequency: route.frequency as ChangeFrequency,
    priority: route.priority
  }));

  const seoEntries: MetadataRoute.Sitemap = getAllSeoPages().flatMap((page) => {
    const entries: MetadataRoute.Sitemap = [
      {
        url: absoluteUrl(page.canonicalPath),
        lastModified: now,
        changeFrequency: page.kind === "blog" ? "monthly" : "weekly",
        priority: page.kind === "city" ? 0.75 : 0.7
      }
    ];

    if (page.kind === "test") entries.push({ url: absoluteUrl(`/tests/${page.slug}`), lastModified: now, changeFrequency: "weekly", priority: 0.65 });
    if (page.kind === "disease") entries.push({ url: absoluteUrl(`/diseases/${page.slug}`), lastModified: now, changeFrequency: "weekly", priority: 0.65 });
    if (page.kind === "city") entries.push({ url: absoluteUrl(`/cities/${page.slug}`), lastModified: now, changeFrequency: "weekly", priority: 0.65 });
    if (page.kind === "corporate") entries.push({ url: absoluteUrl(`/corporate/${page.slug}`), lastModified: now, changeFrequency: "monthly", priority: 0.65 });

    return entries;
  });

  const packageEntries: MetadataRoute.Sitemap = seoPackages.map((entry) => ({
    url: absoluteUrl(`/packages/${entry.slug}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.65
  }));

  const unique = new Map<string, MetadataRoute.Sitemap[number]>();
  [...staticEntries, ...seoEntries, ...packageEntries].forEach((entry) => unique.set(entry.url, entry));
  return Array.from(unique.values());
}


