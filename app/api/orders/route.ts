import { NextResponse } from "next/server";
import { getBackendBaseUrl, missingBackendUrlResponse } from "../_utils/backend";

export async function POST(request: Request) {
  const backendUrl = getBackendBaseUrl();
  const authorization = request.headers.get("authorization");
  if (!backendUrl) return missingBackendUrlResponse();

  const response = await fetch(`${backendUrl}/booking/create`, {
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
