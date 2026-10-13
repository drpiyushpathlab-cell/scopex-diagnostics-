import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: "Use the server-validated Supabase booking payment verification endpoint."
    },
    { status: 410 }
  );
}
