import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse } from "@/app/api/_utils/errors";
import { authorizeSeoRoute } from "@/lib/seo-route-auth";
import { getSearchIntegrationStatus } from "@/lib/seo-service";

export async function GET(request: NextRequest) {
  try {
    await authorizeSeoRoute(request);
    const status = getSearchIntegrationStatus();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: status
    });
  } catch (error: any) {
    return apiErrorResponse(error, "Failed to retrieve search metrics");
  }
}
