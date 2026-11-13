import { NextRequest, NextResponse } from "next/server";
import {
  listRedirects,
  addRedirect,
  deleteRedirect,
  matchRedirect
} from "@/lib/seo-service";

export async function GET() {
  try {
    const rules = listRedirects();
    return NextResponse.json({
      success: true,
      count: rules.length,
      data: rules
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch redirects" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rule = addRedirect(body);

    return NextResponse.json({
      success: true,
      message: "Redirect rule registered successfully",
      data: rule
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create redirect" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
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
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete redirect" },
      { status: 500 }
    );
  }
}
