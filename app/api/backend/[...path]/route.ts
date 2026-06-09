import { NextRequest, NextResponse } from "next/server";
import { getBackendBaseUrl, missingBackendUrlResponse } from "../../_utils/backend";

type Context = {
  params: Promise<{ path?: string[] }>;
};

const METHODS_WITHOUT_BODY = new Set(["GET", "HEAD"]);

async function proxyBackend(request: NextRequest, context: Context) {
  const backendUrl = getBackendBaseUrl();
  if (!backendUrl) return missingBackendUrlResponse();

  const { path = [] } = await context.params;
  const targetUrl = new URL(`/${path.join("/")}`, backendUrl);
  targetUrl.search = request.nextUrl.search;

  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  const contentType = request.headers.get("content-type");

  if (authorization) headers.set("authorization", authorization);
  if (contentType) headers.set("content-type", contentType);

  const backendResponse = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: METHODS_WITHOUT_BODY.has(request.method) ? undefined : await request.arrayBuffer(),
    cache: "no-store"
  });

  return new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    headers: {
      "content-type": backendResponse.headers.get("content-type") || "application/json"
    }
  });
}

export const GET = proxyBackend;
export const POST = proxyBackend;
export const PATCH = proxyBackend;
export const PUT = proxyBackend;
export const DELETE = proxyBackend;

