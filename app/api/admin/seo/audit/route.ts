import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { apiErrorResponse } from "@/app/api/_utils/errors";
import { authorizeSeoRoute } from "@/lib/seo-route-auth";
import {
  runSeoAudit,
  listSeoPages,
  listRedirects
} from "@/lib/seo-service";

export async function GET(request: NextRequest) {
  try {
    await authorizeSeoRoute(request);
    const auditReport = runSeoAudit();
    const allPages = listSeoPages();
    const redirects = listRedirects();

    const statusCounts = {
      draft: allPages.filter((p) => p.status === "draft").length,
      in_review: allPages.filter((p) => p.status === "in_review").length,
      approved: allPages.filter((p) => p.status === "approved").length,
      published: allPages.filter((p) => p.status === "published").length,
      total: allPages.length
    };

    const kindCounts = allPages.reduce((acc, p) => {
      acc[p.kind] = (acc[p.kind] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: statusCounts,
      kindBreakdown: kindCounts,
      redirectsCount: redirects.length,
      audit: auditReport
    });
  } catch (error: any) {
    return apiErrorResponse(error, "Failed to run audit");
  }
}
