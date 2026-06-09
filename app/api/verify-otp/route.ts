import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse } from "../_utils/errors";
import { normalizeIndianMobile } from "@/backend/src/lib/msg91";
import { verifyPersistedOtp } from "@/backend/src/lib/otp";
import { signAppToken } from "@/backend/src/lib/jwt";
import { upsertPatientUser } from "@/backend/src/services/users";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = z.object({ mobile: z.string().min(10), otp: z.string().length(6) }).parse(body);
    const mobile = normalizeIndianMobile(parsed.mobile);
    if (!mobile) {
      return NextResponse.json({ success: false, message: "Enter a valid 10-digit mobile number." }, { status: 400 });
    }

    await verifyPersistedOtp(mobile, parsed.otp);
    const user = await upsertPatientUser(mobile);
    const token = signAppToken({
      userId: user.id,
      patientId: user.patient_id,
      mobile: user.mobile,
      role: "patient"
    });

    return NextResponse.json({
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
  } catch (error) {
    return apiErrorResponse(error, "Unable to verify OTP.");
  }
}
