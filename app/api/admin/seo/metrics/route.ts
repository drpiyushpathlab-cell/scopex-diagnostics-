import { NextResponse } from "next/server";
import { getSearchIntegrationStatus } from "@/lib/seo-service";

export async function GET() {
  try {
    const status = getSearchIntegrationStatus();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: status
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to retrieve search metrics" },
      { status: 500 }
    );
  }
}
