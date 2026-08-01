import { absoluteUrl, getAllSeoPages } from "@/lib/seo-platform";

export const dynamic = "force-static";

export function GET() {
  const imageUrl = absoluteUrl("/brand/weblogo.png");
  const urls = ["/", ...getAllSeoPages().map((page) => page.canonicalPath)];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls
  .map(
    (path) => `  <url>
    <loc>${absoluteUrl(path)}</loc>
    <image:image>
      <image:loc>${imageUrl}</image:loc>
      <image:title>ScopeX Diagnostics</image:title>
    </image:image>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400"
    }
  });
}
