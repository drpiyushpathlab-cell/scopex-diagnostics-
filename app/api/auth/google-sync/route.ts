import { NextResponse } from "next/server";
import { createClient } from "@insforge/sdk";
import { z } from "zod";
import { apiErrorResponse } from "../../_utils/errors";
import { backendEnv } from "@/backend/src/config/env";
import { signAppToken } from "@/backend/src/lib/jwt";
import { HttpError } from "@/backend/src/lib/http-error";
import { upsertGooglePatientUser } from "@/backend/src/services/users";

const syncSchema = z.object({
  accessToken: z.string().min(20)
});

function getUserField(user: any, keys: string[]) {
  for (const key of keys) {
    const value = key.split(".").reduce((current, part) => current?.[part], user);
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = syncSchema.parse(body);

    if (!backendEnv.INSFORGE_BASE_URL || !backendEnv.INSFORGE_ANON_KEY) {
      throw new HttpError(500, "InsForge authentication is not configured.");
    }

    const insforgeAuth = createClient({
      baseUrl: backendEnv.INSFORGE_BASE_URL,
      anonKey: backendEnv.INSFORGE_ANON_KEY,
      edgeFunctionToken: parsed.accessToken,
      isServerMode: true
    });

    const { data, error } = await insforgeAuth.auth.getCurrentUser();
    if (error) throw new HttpError(error.statusCode || 401, error.message || "Unable to verify Google session.");
    if (!data?.user) throw new HttpError(401, "Google session is invalid or expired.");

    const authUser = data.user as any;
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
