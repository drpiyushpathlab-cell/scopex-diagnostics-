import { NextResponse } from "next/server";
import { appendLeadToGoogleSheet } from "@/lib/google-sheets";
import { sendLeadNotification } from "@/lib/email";
import { storeLeadInSupabase } from "@/lib/supabase-leads";
import { validateLeadPayload } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = validateLeadPayload(body);
    if (!validated.valid) {
      return NextResponse.json({ message: validated.error }, { status: 400 });
    }

    const crmResult = await storeLeadInSupabase(validated.data);
    const warnings: string[] = [];

    if (!crmResult.duplicate) {
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
    }

    return NextResponse.json(
      {
        success: true,
        duplicate: crmResult.duplicate,
        message: crmResult.duplicate
          ? "We have updated your previous request. Our customer-care specialist will contact you shortly."
          : warnings.length > 0
          ? "Lead saved successfully. Internal notification is delayed."
          : "Lead submitted successfully. Our team will contact you shortly.",
        leadId: crmResult.lead?.id,
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
