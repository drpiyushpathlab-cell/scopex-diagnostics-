export type LeadType = "home_collection" | "health_advisor" | "growth_partner";
export type AdvisorPurpose = "before_test" | "after_test";
export type GenderType = "male" | "female" | "other";
export type GrowthPartnerBusinessType =
  | "Insurance Company"
  | "TPA"
  | "Corporate"
  | "Hospital"
  | "Clinic"
  | "Healthcare Platform"
  | "Diagnostic Centre"
  | "Franchise"
  | "Collection Centre"
  | "Other";

export type LeadPayload = {
  leadType: LeadType;
  name: string;
  mobileNumber: string;
  age?: number;
  gender?: GenderType;
  collectionDate?: string;
  appointmentDate?: string;
  familyMembers?: string;
  city?: string;
  address?: string;
  preferredTime?: string;
  purpose?: AdvisorPurpose;
  companyName?: string;
  contactPerson?: string;
  designation?: string;
  officialEmail?: string;
  companyWebsite?: string;
  state?: string;
  businessType?: GrowthPartnerBusinessType;
  expectedMonthlyVolume?: string;
  message?: string;
  consent?: boolean;
};

export const homeCollectionTimeSlots = [
  "6:00 AM - 7:00 AM",
  "7:00 AM - 8:00 AM",
  "8:00 AM - 9:00 AM",
  "9:00 AM - 10:00 AM",
  "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM",
  "12:00 PM - 1:00 PM",
  "1:00 PM - 2:00 PM",
  "2:00 PM - 3:00 PM"
] as const;

const mobileRegex = /^[6-9]\d{9}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const growthPartnerBusinessTypes = [
  "Insurance Company",
  "TPA",
  "Corporate",
  "Hospital",
  "Clinic",
  "Healthcare Platform",
  "Diagnostic Centre",
  "Franchise",
  "Collection Centre",
  "Other"
] as const;

export function normalizeMobile(value: string): string {
  const cleaned = value.replace(/[^\d]/g, "");
  if (cleaned.length === 10) return cleaned;
  if (cleaned.length === 12 && cleaned.startsWith("91")) return cleaned.slice(2);
  return cleaned;
}

export function validateLeadPayload(raw: unknown): { valid: true; data: LeadPayload } | { valid: false; error: string } {
  if (!raw || typeof raw !== "object") return { valid: false, error: "Invalid payload." };
  const input = raw as Record<string, unknown>;
  const leadType = input.leadType;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const mobileNumber = typeof input.mobileNumber === "string" ? normalizeMobile(input.mobileNumber) : "";

  if (leadType !== "home_collection" && leadType !== "health_advisor" && leadType !== "growth_partner") {
    return { valid: false, error: "Invalid lead type." };
  }
  if (!mobileRegex.test(mobileNumber)) return { valid: false, error: "Enter a valid Indian mobile number." };

  if (leadType === "growth_partner") {
    const companyName = typeof input.companyName === "string" ? input.companyName.trim() : "";
    const contactPerson = typeof input.contactPerson === "string" ? input.contactPerson.trim() : name;
    const designation = typeof input.designation === "string" ? input.designation.trim() : "";
    const officialEmail = typeof input.officialEmail === "string" ? input.officialEmail.trim().toLowerCase() : "";
    const companyWebsite = typeof input.companyWebsite === "string" ? input.companyWebsite.trim() : "";
    const city = typeof input.city === "string" ? input.city.trim() : "";
    const state = typeof input.state === "string" ? input.state.trim() : "";
    const businessType = typeof input.businessType === "string" ? input.businessType.trim() : "";
    const expectedMonthlyVolume = typeof input.expectedMonthlyVolume === "string" ? input.expectedMonthlyVolume.trim() : "";
    const message = typeof input.message === "string" ? input.message.trim() : "";
    const consent = input.consent === true;

    if (companyName.length < 2) return { valid: false, error: "Enter a valid company name." };
    if (contactPerson.length < 2) return { valid: false, error: "Enter a valid contact person." };
    if (designation.length < 2) return { valid: false, error: "Enter a valid designation." };
    if (!emailRegex.test(officialEmail)) return { valid: false, error: "Enter a valid official email." };
    if (city.length < 2) return { valid: false, error: "Enter a valid city." };
    if (state.length < 2) return { valid: false, error: "Enter a valid state." };
    if (!growthPartnerBusinessTypes.includes(businessType as GrowthPartnerBusinessType)) {
      return { valid: false, error: "Select a valid business type." };
    }
    if (expectedMonthlyVolume.length < 1) return { valid: false, error: "Enter expected monthly volume." };
    if (message.length < 10) return { valid: false, error: "Message must be at least 10 characters." };
    if (!consent) return { valid: false, error: "Please agree to be contacted." };

    return {
      valid: true,
      data: {
        leadType,
        name: contactPerson,
        mobileNumber,
        companyName,
        contactPerson,
        designation,
        officialEmail,
        companyWebsite,
        city,
        state,
        businessType: businessType as GrowthPartnerBusinessType,
        expectedMonthlyVolume,
        message,
        consent
      }
    };
  }

  if (name.length < 2) return { valid: false, error: "Name must be at least 2 characters." };

  if (leadType === "home_collection") {
    const age = Number(input.age);
    const city = typeof input.city === "string" ? input.city.trim() : "";
    const address = typeof input.address === "string" ? input.address.trim() : "";
    const preferredTime = typeof input.preferredTime === "string" ? input.preferredTime.trim() : "";
    const collectionDate = typeof input.collectionDate === "string" ? input.collectionDate.trim() : "";
    const familyMembers = typeof input.familyMembers === "string" ? input.familyMembers.trim() : "Self only";
    if (!Number.isInteger(age) || age < 1 || age > 120) return { valid: false, error: "Enter a valid age." };
    if (city.length < 2) return { valid: false, error: "Enter a valid city." };
    if (address.length < 5) return { valid: false, error: "Enter a valid address." };
    if (!collectionDate) return { valid: false, error: "Select a collection date." };
    if (!homeCollectionTimeSlots.includes(preferredTime as (typeof homeCollectionTimeSlots)[number])) {
      return { valid: false, error: "Select a valid preferred time slot." };
    }
    return {
      valid: true,
      data: {
        leadType,
        name,
        mobileNumber,
        age,
        collectionDate,
        familyMembers,
        city,
        address,
        preferredTime
      }
    };
  }

  const purpose = input.purpose;
  const age = Number(input.age);
  const gender = typeof input.gender === "string" ? input.gender : "";
  const appointmentDate = typeof input.appointmentDate === "string" ? input.appointmentDate.trim() : "";
  if (purpose !== "before_test" && purpose !== "after_test") {
    return { valid: false, error: "Select consultation type." };
  }
  if (!Number.isInteger(age) || age < 1 || age > 120) return { valid: false, error: "Enter a valid age." };
  if (!appointmentDate) return { valid: false, error: "Select an appointment date." };
  if (gender !== "male" && gender !== "female" && gender !== "other") {
    return { valid: false, error: "Select gender." };
  }

  return {
    valid: true,
    data: {
      leadType,
      name,
      mobileNumber,
      age,
      gender,
      appointmentDate,
      purpose
    }
  };
}
