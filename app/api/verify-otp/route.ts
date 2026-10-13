import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse } from "../_utils/errors";
import { normalizeIndianMobile } from "@/backend/src/lib/msg91";
import { OTP_CHALLENGE_COOKIE, verifyOtpChallengeToken, verifyPersistedOtp } from "@/backend/src/lib/otp";
import { signAppToken } from "@/backend/src/lib/jwt";
import { normalizePatientUser, upsertPatientUser } from "@/lib/supabase-patient";
import { HttpError } from "@/backend/src/lib/http-error";

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new HttpError(504, message)), timeoutMs);
    })
  ]);
}

function getCookie(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : "";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = z.object({ mobile: z.string().min(10), otp: z.string().length(6) }).parse(body);
    const mobile = normalizeIndianMobile(parsed.mobile);
    if (!mobile) {
      return NextResponse.json({ success: false, message: "Enter a valid 10-digit mobile number." }, { status: 400 });
    }

    const challengeToken = getCookie(request, OTP_CHALLENGE_COOKIE);
    if (challengeToken) {
      verifyOtpChallengeToken(challengeToken, mobile, parsed.otp);
    } else {
      await withTimeout(verifyPersistedOtp(mobile, parsed.otp), 12000, "OTP verification service timed out. Please try again.");
    }

    const user = normalizePatientUser(
      await withTimeout(upsertPatientUser(mobile), 12000, "Patient login service timed out. Please try again."),
      mobile
    );
    const token = signAppToken({
      userId: user.id,
      patientId: user.patient_id,
      mobile: user.mobile,
      role: "patient"
    });

    const response = NextResponse.json({
      success: true,
      message: "OTP verified successfully.",
      token,
      user: {
        id: user.id,
        mobile: user.mobile,
        patientId: user.patient_id,
        role: user.role
      }
    });
    response.cookies.set(OTP_CHALLENGE_COOKIE, "", { path: "/", maxAge: 0 });
    return response;
  } catch (error) {
    return apiErrorResponse(error, "Unable to verify OTP.");
  }
}
