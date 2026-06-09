import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const authorization = request.headers.get("authorization");
  if (!backendUrl) {
    return NextResponse.json({ message: "Backend URL is not configured." }, { status: 500 });
  }

  const response = await fetch(`${backendUrl.replace(/\/$/, "")}/booking/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authorization ? { Authorization: authorization } : {})
    },
    body: JSON.stringify(await request.json()),
    cache: "no-store"
  });

  return NextResponse.json(await response.json(), { status: response.status });
}
