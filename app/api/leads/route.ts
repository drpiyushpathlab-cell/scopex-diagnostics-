import { NextResponse } from "next/server";
import { appendLeadToGoogleSheet } from "@/lib/google-sheets";
import { sendLeadNotification } from "@/lib/email";
import { storeLeadInInsForge } from "@/lib/insforge-leads";
import { validateLeadPayload } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = validateLeadPayload(body);
    if (!validated.valid) {
      return NextResponse.json({ message: validated.error }, { status: 400 });
    }

    const insforgeResult = await storeLeadInInsForge(validated.data);
    if (insforgeResult.duplicate) {
      return NextResponse.json({ message: "You already submitted this request today." }, { status: 409 });
    }

    const warnings: string[] = [];
    try {
      await appendLeadToGoogleSheet(validated.data);
    } catch {
      warnings.push("Google Sheets sync failed");
    }

    try {
      await sendLeadNotification(validated.data);
    } catch {
      warnings.push("Email notification failed");
    }

    return NextResponse.json(
      {
        success: true,
        message:
          warnings.length > 0
            ? "Lead saved successfully. Internal notification is delayed."
            : "Lead submitted successfully.",
        warnings
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Unexpected server error."
      },
      { status: 500 }
    );
  }
}
