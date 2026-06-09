import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse } from "../../_utils/errors";
import { signAppToken } from "@/backend/src/lib/jwt";
import { authenticateAdmin } from "@/backend/src/services/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = z.object({ email: z.string().email(), password: z.string().min(6) }).parse(body);
    const admin = await authenticateAdmin(parsed.email, parsed.password);
    const token = signAppToken({
      userId: admin.id,
      email: admin.email,
      role: admin.role === "super-admin" ? "super_admin" : admin.role
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: admin.id,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    return apiErrorResponse(error, "Unable to login.");
  }
}
