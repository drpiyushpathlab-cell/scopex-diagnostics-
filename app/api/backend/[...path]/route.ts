import { NextRequest, NextResponse } from "next/server";
import { getBackendBaseUrl, missingBackendUrlResponse } from "../../_utils/backend";
import { apiErrorResponse } from "../../_utils/errors";
import {
  addFamilyMember,
  deleteFamilyMember,
  getPatientProfile,
  listFamilyMembers,
  makeDefaultFamilyMember,
  requirePatientAuth,
  updateFamilyMember,
  updatePatientProfile
} from "@/lib/supabase-patient";

type Context = {
  params: Promise<{ path?: string[] }>;
};

const METHODS_WITHOUT_BODY = new Set(["GET", "HEAD"]);

async function jsonBody(request: Request) {
  return request.json().catch(() => ({}));
}

async function supabaseFallback(request: Request, path: string[]) {
  try {
    const joined = `/${path.join("/")}`;
    const auth = requirePatientAuth(request);

    if (request.method === "GET" && joined === "/user/profile") {
      return NextResponse.json({ profile: await getPatientProfile(auth) });
    }

    if (request.method === "PATCH" && joined === "/user/profile") {
      return NextResponse.json({ success: true, profile: await updatePatientProfile(auth, await jsonBody(request)) });
    }

    if (request.method === "GET" && joined === "/family/list") {
      return NextResponse.json({ familyMembers: await listFamilyMembers(auth) });
    }

    if (request.method === "POST" && joined === "/family/add") {
      return NextResponse.json({ success: true, familyMember: await addFamilyMember(auth, await jsonBody(request)) }, { status: 201 });
    }

    const familyMatch = joined.match(/^\/family\/([^/]+)(?:\/default)?$/);
    if (familyMatch) {
      const id = familyMatch[1];
      if (request.method === "PATCH" && !joined.endsWith("/default")) {
        return NextResponse.json({ success: true, familyMember: await updateFamilyMember(auth, id, await jsonBody(request)) });
      }
      if (request.method === "DELETE" && !joined.endsWith("/default")) {
        await deleteFamilyMember(auth, id);
        return NextResponse.json({ success: true });
      }
      if (request.method === "POST" && joined.endsWith("/default")) {
        return NextResponse.json({ success: true, familyMember: await makeDefaultFamilyMember(auth, id) });
      }
    }

    if (request.method === "POST" && joined === "/auth/logout") {
      return NextResponse.json({ success: true });
    }

    if (request.method === "GET" && (joined === "/booking/history" || joined === "/reports/user")) {
      return NextResponse.json(joined === "/booking/history" ? { bookings: [] } : { reports: [] });
    }

    return missingBackendUrlResponse();
  } catch (error) {
    return apiErrorResponse(error, "Backend request failed.");
  }
}

async function proxyBackend(request: NextRequest, context: Context) {
  const backendUrl = getBackendBaseUrl();
  const { path = [] } = await context.params;
  if (!backendUrl) return supabaseFallback(request, path);

  const targetUrl = new URL(`/${path.join("/")}`, backendUrl);
  targetUrl.search = request.nextUrl.search;
  const fallbackRequest = request.clone();

  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  const contentType = request.headers.get("content-type");

  if (authorization) headers.set("authorization", authorization);
  if (contentType) headers.set("content-type", contentType);

  let backendResponse: Response;
  try {
    backendResponse = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: METHODS_WITHOUT_BODY.has(request.method) ? undefined : await request.arrayBuffer(),
      cache: "no-store"
    });
  } catch {
    return supabaseFallback(fallbackRequest, path);
  }

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

