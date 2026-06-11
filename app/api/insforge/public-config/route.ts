import { NextResponse } from "next/server";
import { backendEnv } from "@/backend/src/config/env";

export async function GET() {
  if (!backendEnv.INSFORGE_BASE_URL || !backendEnv.INSFORGE_ANON_KEY) {
    return NextResponse.json(
      { success: false, message: "InsForge authentication is not configured." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    baseUrl: backendEnv.INSFORGE_BASE_URL,
    anonKey: backendEnv.INSFORGE_ANON_KEY
  });
}
