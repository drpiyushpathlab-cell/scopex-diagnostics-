import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse } from "@/app/api/_utils/errors";
import { authorizeSeoRoute } from "@/lib/seo-route-auth";
import {
  listRedirects,
  addRedirect,
  deleteRedirect,
  matchRedirect
} from "@/lib/seo-service";

export async function GET(request: NextRequest) {
  try {
    await authorizeSeoRoute(request);
    const rules = listRedirects();
    return NextResponse.json({
      success: true,
      count: rules.length,
      data: rules
    });
  } catch (error: any) {
    return apiErrorResponse(error, "Failed to fetch redirects");
  }
}

export async function POST(request: NextRequest) {
  try {
    await authorizeSeoRoute(request);
    const body = await request.json();
    const rule = addRedirect(body);

    return NextResponse.json({
      success: true,
      message: "Redirect rule registered successfully",
      data: rule
    });
  } catch (error: any) {
    return apiErrorResponse(error, "Failed to create redirect");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await authorizeSeoRoute(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Redirect rule ID is required" },
        { status: 400 }
      );
    }

    const deleted = deleteRedirect(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Redirect rule not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Redirect rule deleted successfully"
    });
  } catch (error: any) {
    return apiErrorResponse(error, "Failed to delete redirect");
  }
}
