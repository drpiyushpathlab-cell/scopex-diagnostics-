import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendUrl) {
    return NextResponse.json({ success: false, message: "Backend URL is not configured." }, { status: 500 });
  }

  try {
    const response = await fetch(`${backendUrl.replace(/\/$/, "")}/auth/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(await request.json()),
      cache: "no-store"
    });
    const data = await response.json().catch(() => ({ success: false, message: "Invalid backend response." }));

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Unable to reach backend login service." },
      { status: 502 }
    );
  }
}
