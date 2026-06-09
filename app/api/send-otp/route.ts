import { NextResponse } from "next/server";
import { getBackendBaseUrl, missingBackendUrlResponse } from "../_utils/backend";

export async function POST(request: Request) {
  const backendUrl = getBackendBaseUrl();
  if (!backendUrl) return missingBackendUrlResponse();

  const response = await fetch(`${backendUrl}/auth/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(await request.json()),
    cache: "no-store"
  });

  return NextResponse.json(await response.json(), { status: response.status });
}
