import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendUrl) {
    return NextResponse.json({ success: false, message: "Backend URL is not configured." }, { status: 500 });
  }

  const response = await fetch(`${backendUrl.replace(/\/$/, "")}/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(await request.json()),
    cache: "no-store"
  });

  return NextResponse.json(await response.json(), { status: response.status });
}
