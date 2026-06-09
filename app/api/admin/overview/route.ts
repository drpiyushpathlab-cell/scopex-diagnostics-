import { NextResponse } from "next/server";
import { getBackendBaseUrl, missingBackendUrlResponse } from "../../_utils/backend";

export async function GET(request: Request) {
  const backendUrl = getBackendBaseUrl();
  const authorization = request.headers.get("authorization");
  if (!backendUrl) return missingBackendUrlResponse();

  const response = await fetch(`${backendUrl}/admin/dashboard`, {
    headers: {
      ...(authorization ? { Authorization: authorization } : {})
    },
    cache: "no-store"
  });

  return NextResponse.json(await response.json(), { status: response.status });
}
