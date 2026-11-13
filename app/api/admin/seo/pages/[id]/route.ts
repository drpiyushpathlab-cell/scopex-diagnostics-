import { NextRequest, NextResponse } from "next/server";
import {
  getSeoPageById,
  createOrUpdateSeoPage,
  deleteSeoPage,
  submitForReview,
  approveClinicalReview,
  publishSeoPage,
  type ContentStatus
} from "@/lib/seo-service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const page = getSeoPageById(id);

    if (!page) {
      return NextResponse.json(
        { success: false, message: `SEO page not found with ID ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: page
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch page" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Clinical review action
    if (body.action === "clinical_review") {
      const page = approveClinicalReview(id, {
        reviewedBy: body.reviewedBy || body.clinicalReview?.reviewedBy,
        reviewerCredentials: body.reviewerCredentials || body.clinicalReview?.reviewerCredentials,
        clinicalNotes: body.clinicalNotes || body.clinicalReview?.clinicalNotes
      });

      if (body.publishImmediately) {
        publishSeoPage(id);
      }

      return NextResponse.json({
        success: true,
        message: "Clinical review approved successfully",
        data: getSeoPageById(id)
      });
    }

    // Submit for review action
    if (body.action === "submit_review") {
      const page = submitForReview(id);
      return NextResponse.json({
        success: true,
        message: "Page submitted for clinical review",
        data: page
      });
    }

    // Publish action
    if (body.action === "publish") {
      const page = publishSeoPage(id);
      return NextResponse.json({
        success: true,
        message: "Page published successfully",
        data: page
      });
    }

    // General update
    const existing = getSeoPageById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, message: `SEO page not found with ID ${id}` },
        { status: 404 }
      );
    }

    const merged = { ...existing, ...body, id };
    const saved = createOrUpdateSeoPage(merged);

    return NextResponse.json({
      success: true,
      message: "SEO Page updated successfully",
      data: saved
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update page" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = deleteSeoPage(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: `SEO page not found with ID ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "SEO page deleted successfully"
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete page" },
      { status: 500 }
    );
  }
}
