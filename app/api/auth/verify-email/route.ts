import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || "";
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || "http://localhost:4000";
  const fallback = new URL("/patient/dashboard?email=verification-failed", request.url);

  if (!token) return NextResponse.redirect(fallback);

  try {
    const response = await fetch(`${backend}/auth/verify-email?token=${encodeURIComponent(token)}`, { redirect: "manual" });
    const location = response.headers.get("location");
    if (location) return NextResponse.redirect(location);
    return NextResponse.redirect(new URL(response.ok ? "/patient/dashboard?email=verified" : "/patient/dashboard?email=verification-failed", request.url));
  } catch {
    return NextResponse.redirect(fallback);
  }
}
