import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { HttpError } from "@/backend/src/lib/http-error";

export function apiErrorResponse(error: unknown, fallback = "Unexpected server error.") {
  if (error instanceof HttpError) {
    return NextResponse.json({ success: false, message: error.message }, { status: error.statusCode });
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { success: false, message: error.issues[0]?.message || "Invalid request payload." },
      { status: 400 }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json({ success: false, message: error.message || fallback }, { status: 500 });
  }

  return NextResponse.json({ success: false, message: fallback }, { status: 500 });
}

