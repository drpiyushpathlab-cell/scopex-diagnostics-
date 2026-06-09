import { NextResponse } from "next/server";

const BACKEND_ENV_KEYS = [
  "NEXT_PUBLIC_BACKEND_URL",
  "BACKEND_URL",
  "INSFORGE_BACKEND_URL",
  "INSFORGE_BASE_URL",
  "API_BASE_URL"
] as const;

export function getBackendBaseUrl() {
  const value = BACKEND_ENV_KEYS.map((key) => process.env[key]?.trim()).find(Boolean);
  return value?.replace(/\/$/, "") || "";
}

export function missingBackendUrlResponse() {
  return NextResponse.json(
    {
      success: false,
      message:
        "Backend URL is not configured. Add NEXT_PUBLIC_BACKEND_URL or BACKEND_URL in Vercel environment variables."
    },
    { status: 500 }
  );
}

