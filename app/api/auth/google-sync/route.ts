import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: "Google login is disabled. Please use mobile OTP."
    },
    { status: 410 }
  );
}
