import { NextRequest, NextResponse } from "next/server";
import {
  listSeoPages,
  createOrUpdateSeoPage,
  type SeoEntityKind,
  type ContentStatus
} from "@/lib/seo-service";

export async function GET(request: NextRequest) {
  try {
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
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch SEO pages" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const page = createOrUpdateSeoPage(body);

    return NextResponse.json({
      success: true,
      message: "SEO Page saved successfully",
      data: page
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to save SEO page" },
      { status: 400 }
    );
  }
}
