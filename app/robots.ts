import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.scopexdiagnostics.in";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/*",
          "/api/admin",
          "/api/admin/*",
          "/api/payments",
          "/checkout/confirmation"
        ]
      },
      // Explicit Generative Engine & AI Discovery crawler rules
      {
        userAgent: [
          "GPTBot",
          "PerplexityBot",
          "ClaudeBot",
          "Google-Extended",
          "Applebot-Extended",
          "CCBot",
          "cohere-ai"
        ],
        allow: [
          "/",
          "/tests/*",
          "/packages/*",
          "/blogs/*",
          "/diseases/*",
          "/cities/*",
          "/blood-test-in-*"
        ],
        disallow: ["/admin", "/admin/*", "/api/*"]
      }
    ],
    sitemap: [
      `${siteUrl}/sitemap.xml`
    ],
    host: siteUrl
  };
}
