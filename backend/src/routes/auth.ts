import { Router } from "express";
import { z } from "zod";
import { asyncRoute } from "@/backend/src/lib/async-route";
import { generateOtp, persistOtpRequest, verifyPersistedOtp } from "@/backend/src/lib/otp";
import { normalizeIndianMobile, sendMsg91Otp } from "@/backend/src/lib/msg91";
import { revokeAppToken, signAppToken } from "@/backend/src/lib/jwt";
import { normalizePatientUser, upsertPatientUser } from "@/backend/src/services/users";
import { authenticateAdmin } from "@/backend/src/services/admin";
import { HttpError } from "@/backend/src/lib/http-error";
import { logLogin } from "@/backend/src/services/activity";
import { insforge } from "@/backend/src/lib/insforge";

const sendOtpSchema = z.object({
  mobile: z.string().min(10)
});

const verifyOtpSchema = z.object({
  mobile: z.string().min(10),
  otp: z.string().length(6)
});

const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const authRouter = Router();

authRouter.post(
  "/send-otp",
  asyncRoute(async (request, response) => {
    const parsed = sendOtpSchema.parse(request.body);
    const mobile = normalizeIndianMobile(parsed.mobile);
    if (!mobile) {
      throw new HttpError(400, "Enter a valid 10-digit mobile number.");
    }

    const otp = generateOtp();
    const providerResponse = await sendMsg91Otp(mobile, otp);
    await persistOtpRequest({ mobile, otp, providerResponse });

    response.json({
      success: true,
      message: "OTP sent successfully.",
      mobile,
      ...(process.env.ALLOW_DEBUG_OTP === "true" ? { debugOtp: otp } : {})
    });
  })
);

authRouter.get(
  "/verify-email",
  asyncRoute(async (request, response) => {
    const token = String(request.query.token || "").trim();
    if (!token) throw new HttpError(400, "Verification token is required.");

    const { data, error } = await insforge.database
      .from("email_verifications")
      .select("id, user_id, email, expires_at, status")
      .eq("token", token)
      .maybeSingle();

    if (error) throw new HttpError(500, error.message || "Unable to verify email.");
    if (!data) throw new HttpError(404, "Verification link is invalid.");
    const row = data as { id: string; user_id?: string | null; email: string; expires_at?: string; status?: string };
    if (row.status === "verified") {
      response.redirect(`${process.env.FRONTEND_ORIGIN || "http://localhost:3000"}/patient/dashboard?email=verified`);
      return;
    }
    if (new Date(row.expires_at || 0).getTime() < Date.now()) throw new HttpError(400, "Verification link has expired.");

    await insforge.database
      .from("email_verifications")
      .update({ status: "verified", verified_at: new Date().toISOString() })
      .eq("id", row.id);

    if (row.user_id) {
      await insforge.database
        .from("user_profiles")
        .update({ email_verified_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("user_id", row.user_id)
        .eq("email", row.email);
    }

    response.redirect(`${process.env.FRONTEND_ORIGIN || "http://localhost:3000"}/patient/dashboard?email=verified`);
  })
);

authRouter.post(
  "/verify-otp",
  asyncRoute(async (request, response) => {
    const parsed = verifyOtpSchema.parse(request.body);
    const mobile = normalizeIndianMobile(parsed.mobile);
    if (!mobile) {
      throw new HttpError(400, "Enter a valid 10-digit mobile number.");
    }

    await verifyPersistedOtp(mobile, parsed.otp);
    const user = normalizePatientUser(await upsertPatientUser(mobile), mobile);
    const token = signAppToken({
      userId: user.id,
      patientId: user.patient_id,
      mobile: user.mobile,
      role: "patient"
    });
    void logLogin({ userId: user.id, role: "patient", event: "login", request });

    response.json({
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
  })
);

authRouter.post(
  "/logout",
  asyncRoute(async (request, response) => {
    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (token) revokeAppToken(token);

    response.clearCookie("scopex_patient_session", { path: "/" });
    response.clearCookie("scopex_auth_token", { path: "/" });
    response.json({ success: true, message: "Logged out successfully." });
  })
);

authRouter.post(
  "/admin/login",
  asyncRoute(async (request, response) => {
    const parsed = adminLoginSchema.parse(request.body);
    const admin = await authenticateAdmin(parsed.email, parsed.password);
    const token = signAppToken({
      userId: admin.id,
      email: admin.email,
      role: admin.role === "super-admin" ? "super_admin" : admin.role
    });
    void logLogin({ adminId: admin.id, role: admin.role, event: "login", request });

    response.json({
      success: true,
      token,
      user: {
        id: admin.id,
        email: admin.email,
        role: admin.role
      }
    });
  })
);
