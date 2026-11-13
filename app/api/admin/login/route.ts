import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse } from "../../_utils/errors";
import { authenticateAdmin } from "@/lib/backend-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = z.object({ email: z.string().email(), password: z.string().min(6) }).parse(body);
    const result = await authenticateAdmin(parsed.email, parsed.password);

    return NextResponse.json({
      success: true,
      token: result.token,
      user: {
        id: result.admin.id,
        email: result.admin.email,
        role: result.admin.role,
        name: result.admin.name
      }
    });
  } catch (error) {
    return apiErrorResponse(error, "Unable to login.");
  }
}
