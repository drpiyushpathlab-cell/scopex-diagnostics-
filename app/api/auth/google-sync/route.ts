import { NextResponse } from "next/server";
import { createClient } from "@insforge/sdk";
import { z } from "zod";
import { apiErrorResponse } from "../../_utils/errors";
import { backendEnv } from "@/backend/src/config/env";
import { signAppToken } from "@/backend/src/lib/jwt";
import { HttpError } from "@/backend/src/lib/http-error";
import { upsertGooglePatientUser } from "@/backend/src/services/users";

const syncSchema = z.object({
  accessToken: z.string().min(20),
  user: z.object({}).passthrough().optional()
});

function getUserField(user: any, keys: string[]) {
  for (const key of keys) {
    const value = key.split(".").reduce((current, part) => current?.[part], user);
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

async function getAuthUserFromAccessToken(accessToken: string) {
  if (!backendEnv.INSFORGE_BASE_URL || !backendEnv.INSFORGE_ANON_KEY) {
    throw new HttpError(500, "InsForge authentication is not configured.");
  }

  const insforgeAuth = createClient({
    baseUrl: backendEnv.INSFORGE_BASE_URL,
    anonKey: backendEnv.INSFORGE_ANON_KEY,
    edgeFunctionToken: accessToken,
    isServerMode: true,
    autoRefreshToken: false
  });

  const { data, error } = await insforgeAuth.auth.getCurrentUser();
  console.info("[GoogleOAuthSync] Server user response", {
    hasUser: Boolean(data?.user),
    error: error
      ? {
          message: error.message,
          statusCode: error.statusCode,
          code: error.error
        }
      : null
  });

  return data?.user || null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = syncSchema.parse(body);

    let verifiedUser: any = null;
    try {
      verifiedUser = await getAuthUserFromAccessToken(parsed.accessToken);
    } catch (error) {
      console.warn("[GoogleOAuthSync] Access token verification did not complete", {
        message: error instanceof Error ? error.message : "Unknown verification error"
      });
    }

    const authUser = (verifiedUser || parsed.user) as any;
    if (!authUser) throw new HttpError(401, "Google session is invalid or expired.");

    console.info("[GoogleOAuthSync] Profile sync payload", {
      serverVerified: Boolean(verifiedUser),
      hasBrowserUser: Boolean(parsed.user),
      userKeys: Object.keys(authUser || {})
    });

    const email = getUserField(authUser, ["email", "profile.email", "user.email"]);
    const fullName = getUserField(authUser, ["name", "full_name", "profile.name", "user_metadata.full_name", "user_metadata.name"]);
    const avatarUrl = getUserField(authUser, ["avatar_url", "picture", "profile.avatar_url", "user_metadata.avatar_url", "user_metadata.picture"]);
    const googleId = getUserField(authUser, ["id", "sub", "provider_id", "profile.id"]);

    if (!email) throw new HttpError(400, "Google account email was not returned by InsForge.");

    const patientUser = await upsertGooglePatientUser({
      googleId: googleId || email,
      email,
      fullName: fullName || email.split("@")[0],
      avatarUrl: avatarUrl || null
    });

    const token = signAppToken({
      userId: patientUser.id,
      patientId: patientUser.patient_id,
      mobile: patientUser.mobile || null,
      email: patientUser.email,
      role: "patient"
    });

    return NextResponse.json({
      success: true,
      message: "Google login successful.",
      token,
      user: {
        id: patientUser.id,
        mobile: patientUser.mobile || null,
        email: patientUser.email,
        patientId: patientUser.patient_id,
        role: "patient",
        authProvider: "google",
        avatarUrl: patientUser.avatar_url || avatarUrl || null
      }
    });
  } catch (error) {
    return apiErrorResponse(error, "Unable to complete Google login.");
  }
}
