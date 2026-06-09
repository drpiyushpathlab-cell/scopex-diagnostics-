import { google } from "googleapis";
import type { LeadPayload } from "@/lib/validation";

const sheetsId = process.env.GOOGLE_SHEETS_ID;
const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY;
const sheetTab = process.env.GOOGLE_SHEETS_TAB ?? "Leads";

export async function appendLeadToGoogleSheet(payload: LeadPayload) {
  if (!sheetsId || !serviceEmail || !privateKey) {
    throw new Error("Missing Google Sheets credentials.");
  }

  const auth = new google.auth.JWT({
    email: serviceEmail,
    key: privateKey.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });

  const sheets = google.sheets({ version: "v4", auth });
  const now = new Date().toISOString();

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetsId,
    range: `${sheetTab}!A:N`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          now,
          payload.leadType,
          payload.name,
          payload.age ?? "",
          payload.gender ?? "",
          payload.mobileNumber,
          payload.collectionDate ?? payload.appointmentDate ?? "",
          payload.familyMembers ?? "",
          payload.city ?? "",
          payload.address ?? "",
          payload.preferredTime ?? "",
          payload.purpose ?? "",
          "website"
        ]
      ]
    }
  });
}
