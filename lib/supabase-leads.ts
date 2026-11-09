import { getSupabaseServiceClient, hasSupabasePublicConfig } from "@/lib/supabase";
import type { LeadPayload } from "@/lib/validation";
import { createCrmLead, type InterestedItem } from "@/lib/crm-service";

function leadEmail(payload: LeadPayload) {
  return payload.officialEmail || undefined;
}

export async function storeLeadInSupabase(payload: LeadPayload) {
  const phone = payload.mobileNumber;
  const email = leadEmail(payload);

  // Extract interested items based on lead type and payload fields
  const interestedItems: InterestedItem[] = [];
  if (payload.leadType === "home_collection") {
    interestedItems.push({
      id: "home_collection_request",
      name: `Home Sample Collection (${payload.familyMembers || "Self"})`,
      kind: "general"
    });
  } else if (payload.leadType === "health_advisor") {
    interestedItems.push({
      id: "health_advisor_consult",
      name: `Doctor Consultation (${payload.purpose === "after_test" ? "Report Discussion" : "Pre-Test Guidance"})`,
      kind: "general"
    });
  } else if (payload.leadType === "growth_partner") {
    interestedItems.push({
      id: "growth_partner_enquiry",
      name: `Corporate Partnership (${payload.businessType || payload.companyName})`,
      kind: "general"
    });
  }

  // Check if specific test or package was passed in raw payload or URL
  const rawAny = payload as Record<string, unknown>;
  if (typeof rawAny.testName === "string" && rawAny.testName) {
    interestedItems.unshift({
      id: String(rawAny.testId || "test_enquiry"),
      name: rawAny.testName,
      kind: "test",
      price: typeof rawAny.testPrice === "number" ? rawAny.testPrice : undefined
    });
  } else if (typeof rawAny.packageName === "string" && rawAny.packageName) {
    interestedItems.unshift({
      id: String(rawAny.packageId || "pkg_enquiry"),
      name: rawAny.packageName,
      kind: "package",
      price: typeof rawAny.packagePrice === "number" ? rawAny.packagePrice : undefined
    });
  }

  // Feed into central CRM engine
  const crmResult = await createCrmLead({
    name: payload.name,
    phone,
    email,
    location: payload.address,
    city: payload.city,
    pincode: typeof rawAny.pincode === "string" ? rawAny.pincode : undefined,
    interestedItems,
    source: payload.leadType,
    campaign: typeof rawAny.campaign === "string" ? rawAny.campaign : undefined,
    utmSource: typeof rawAny.utm_source === "string" ? rawAny.utm_source : undefined,
    utmMedium: typeof rawAny.utm_medium === "string" ? rawAny.utm_medium : undefined,
    utmCampaign: typeof rawAny.utm_campaign === "string" ? rawAny.utm_campaign : undefined,
    consent: payload.consent ?? true,
    contactPreferences: {
      phone: true,
      whatsapp: true,
      email: Boolean(email),
      preferredTimeSlot: payload.preferredTime
    },
    notes: payload.message || (payload.address ? `Address: ${payload.address}` : undefined),
    priority: payload.leadType === "growth_partner" ? "High" : "Medium",
    autoAssign: true,
    performedBy: "Website Form"
  });

  return {
    duplicate: crmResult.isDuplicate,
    lead: crmResult.lead,
    message: crmResult.duplicateMessage
  };
}
