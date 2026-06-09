import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const authorization = request.headers.get("authorization");
  if (!backendUrl) {
    return NextResponse.json({ message: "Backend URL is not configured." }, { status: 500 });
  }

  const response = await fetch(`${backendUrl.replace(/\/$/, "")}/admin/dashboard`, {
    headers: {
      ...(authorization ? { Authorization: authorization } : {})
    },
    cache: "no-store"
  });

  return NextResponse.json(await response.json(), { status: response.status });
}
