import { NextRequest, NextResponse } from "next/server";
import {
  getSeoPageById,
  getSeoPageBySlug,
  runAiDiscoveryCheck,
  buildPageStructuredData,
  siteUrl,
  absoluteUrl
} from "@/lib/seo-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const query = (body.query || body.slug || body.url || "").trim();

    if (!query) {
      return NextResponse.json(
        { success: false, message: "URL slug or page ID is required for validation" },
        { status: 400 }
      );
    }

    const page = getSeoPageById(query) || getSeoPageBySlug(query);

    if (!page) {
      return NextResponse.json(
        {
          success: false,
          message: `No registered SEO page matched "${query}". Please check the slug or create an entry in the SEO Content Editor.`
        },
        { status: 404 }
      );
    }

    const aiCheck = runAiDiscoveryCheck(page);
    const structuredData = buildPageStructuredData(page);

    // Metadata validation checks
    const titleLength = page.title.length;
    const descLength = page.metaDescription.length;
    const titleValid = titleLength >= 30 && titleLength <= 65;
    const descValid = descLength >= 120 && descLength <= 165;
    const canonicalValid = page.canonicalUrl.startsWith(siteUrl) && !page.canonicalUrl.endsWith("//");

    const issues: string[] = [];
    if (!titleValid) {
      issues.push(`Title length is ${titleLength} chars (recommended: 30-65 chars).`);
    }
    if (!descValid) {
      issues.push(`Meta description is ${descLength} chars (recommended: 120-165 chars).`);
    }
    if (!canonicalValid) {
      issues.push(`Canonical URL (${page.canonicalUrl}) must match site origin ${siteUrl}.`);
    }
    if (!page.aeoDirectAnswer || page.aeoDirectAnswer.length < 30) {
      issues.push("AEO Direct Answer missing or too short for answer engines.");
    }
    if (!page.clinicalReview?.approved) {
      issues.push("Clinical review sign-off is missing or not approved.");
    }

    return NextResponse.json({
      success: true,
      page: {
        id: page.id,
        slug: page.slug,
        title: page.title,
        h1: page.h1,
        metaDescription: page.metaDescription,
        canonicalPath: page.canonicalPath,
        canonicalUrl: page.canonicalUrl,
        robots: page.robots,
        status: page.status,
        kind: page.kind
      },
      validation: {
        titleValid,
        titleLength,
        descValid,
        descLength,
        canonicalValid,
        isIndexable: page.robots.includes("index") && !page.robots.includes("noindex"),
        isFollowable: page.robots.includes("follow") && !page.robots.includes("nofollow"),
        issues
      },
      serpPreview: {
        title: page.title,
        displayUrl: page.canonicalUrl,
        snippet: page.metaDescription
      },
      openGraphPreview: {
        title: page.title,
        description: page.metaDescription,
        url: page.canonicalUrl,
        siteName: "ScopeX Diagnostics",
        locale: "en_IN",
        type: "website"
      },
      aiDiscovery: aiCheck,
      structuredData
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to validate metadata" },
      { status: 500 }
    );
  }
}
