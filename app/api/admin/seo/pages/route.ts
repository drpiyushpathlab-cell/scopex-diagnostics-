import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse } from "@/app/api/_utils/errors";
import { authorizeSeoRoute } from "@/lib/seo-route-auth";
import {
  listSeoPages,
  createOrUpdateSeoPage,
  type SeoEntityKind,
  type ContentStatus
} from "@/lib/seo-service";

export async function GET(request: NextRequest) {
  try {
    await authorizeSeoRoute(request);
    const { searchParams } = new URL(request.url);
    const kind = (searchParams.get("kind") as SeoEntityKind) || undefined;
    const status = (searchParams.get("status") as ContentStatus) || undefined;
    const search = searchParams.get("search") || undefined;

    const pages = listSeoPages({ kind, status, search });
    return NextResponse.json({
      success: true,
      count: pages.length,
      data: pages
    });
  } catch (error: any) {
    return apiErrorResponse(error, "Failed to fetch SEO pages");
  }
}

export async function POST(request: NextRequest) {
  try {
    await authorizeSeoRoute(request);
    const body = await request.json();
    const page = createOrUpdateSeoPage(body);

    return NextResponse.json({
      success: true,
      message: "SEO Page saved successfully",
      data: page
    });
  } catch (error: any) {
    return apiErrorResponse(error, "Failed to save SEO page");
  }
}
