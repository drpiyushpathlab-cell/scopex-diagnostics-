import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse } from "../_utils/errors";
import {
  createOtpChallengeToken,
  generateOtp,
  getOtpChallengeMaxAgeSeconds,
  OTP_CHALLENGE_COOKIE,
  assertOtpSecurityConfigured,
  persistOtpRequest
} from "@/backend/src/lib/otp";
import { normalizeIndianMobile, sendMsg91Otp } from "@/backend/src/lib/msg91";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = z.object({ mobile: z.string().min(10) }).parse(body);
    const mobile = normalizeIndianMobile(parsed.mobile);
    if (!mobile) {
      return NextResponse.json({ success: false, message: "Enter a valid 10-digit mobile number." }, { status: 400 });
    }

    assertOtpSecurityConfigured();
    const otp = generateOtp();
    const providerResponse = await sendMsg91Otp(mobile, otp);
    try {
      await persistOtpRequest({ mobile, otp, providerResponse });
    } catch {
      // The signed, HttpOnly challenge remains the verification source when OTP storage is unavailable.
      // Do not log provider payloads, phone numbers, or OTP-related data here.
    }

    const response = NextResponse.json({
      success: true,
      message: "OTP sent successfully.",
      mobile
    });

    response.cookies.set(OTP_CHALLENGE_COOKIE, createOtpChallengeToken(mobile, otp), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: getOtpChallengeMaxAgeSeconds()
    });

    return response;
  } catch (error) {
    return apiErrorResponse(error, "Unable to send OTP.");
  }
}
