import crypto from "crypto";
import { inMemoryBookings, inMemoryTests, inMemoryAuditLogs, logAuditAction } from "@/lib/backend-service";
import { inMemoryCollectionJobs, type CollectionJob } from "@/lib/phlebotomist-service";

// =============================================================================
// PHASE 1: PARTNER LAB & MULTI-CITY LOCATION CONTRACTS
// =============================================================================

export type PartnerLabStatus = "pending_verification" | "active" | "inactive";

export type PartnerLabLocationStatus = "active" | "inactive";

export type PartnerLabLocation = {
  id: string;
  partnerLabId: string;
  city: string;
  fullAddress: string;
  pincode: string;
  contactPerson: string;
  mobile: string;
  email: string;
  sampleReceivingTimings: string;
  operatingDays: string[];
  status: PartnerLabLocationStatus;
  createdAt: string;
  updatedAt: string;
};

export type PartnerLab = {
  id: string; // e.g. PLAB-001
  name: string;
  brandName: string;
  legalName?: string;
  registrationNumber: string;
  isNablAccredited: boolean;
  nablNumber?: string;
  gstin?: string;
  registeredAddress: string;
  primaryContactPerson: string;
  mobile: string;
  email: string;
  status: PartnerLabStatus;
  locations: PartnerLabLocation[];
  createdAt: string;
  updatedAt: string;
};

// =============================================================================
// PHASE 2: PARTNER LAB TEST MASTER CONTRACTS & FLEXIBLE CITY APPLICABILITY
// =============================================================================

export type RateApplicability = "pan_india" | "selected_cities" | "single_city";

export type PartnerTestMapping = {
  id: string;
  partnerLabId: string;
  applicability: RateApplicability;
  city?: string; // used when applicability === "single_city"
  applicableCities?: string[]; // list of cities when applicability === "selected_cities"
  locationId?: string; // Optional/legacy location reference
  scopexTestId: string;
  scopexTestName: string;
  partnerTestName: string;
  partnerTestCode?: string; // Optional! Blank code is explicitly supported
  category?: string;
  partnerProcessingRate: number; // Required non-negative
  sampleType?: string;
  tatHours?: string;
  effectiveFrom: string; // YYYY-MM-DD
  effectiveTo?: string; // YYYY-MM-DD
  version: number;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
};

export type DuplicateResolutionStrategy = "skip" | "update" | "new_version";

export type BulkMappingRowInput = {
  scopexTestIdentifier: string; // Test ID or Test Name
  partnerTestName: string;
  partnerTestCode?: string;
  category?: string;
  partnerProcessingRate: number | string;
  applicability?: RateApplicability;
  city?: string;
  applicableCities?: string[] | string;
  sampleType?: string;
  tatHours?: string;
  effectiveFrom: string;
  effectiveTo?: string;
  status?: string;
};

export type BulkMappingValidationResult = {
  rowNumber: number;
  isValid: boolean;
  input: BulkMappingRowInput;
  normalized?: Partial<PartnerTestMapping>;
  errors: string[];
  isDuplicate: boolean;
  existingMappingId?: string;
};

export type BulkUploadPreview = {
  partnerLabId: string;
  locationId?: string;
  totalRows: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  results: BulkMappingValidationResult[];
};

// =============================================================================
// PHASE 3 & 4: SAMPLE ASSIGNMENT, BARCODE TRACKING & 10-STEP STATUS
// =============================================================================

export type PartnerSampleStatus =
  | "Sample Collected"
  | "Assigned to Partner Lab"
  | "Ready for Handover"
  | "Dispatched"
  | "Received by Partner Lab"
  | "Processing"
  | "Completed"
  | "Report Pending"
  | "Report Uploaded"
  | "Exception / Rejected";

export const ALL_PARTNER_SAMPLE_STATUSES: PartnerSampleStatus[] = [
  "Sample Collected",
  "Assigned to Partner Lab",
  "Ready for Handover",
  "Dispatched",
  "Received by Partner Lab",
  "Processing",
  "Completed",
  "Report Pending",
  "Report Uploaded",
  "Exception / Rejected"
];

export type PartnerSampleStatusHistory = {
  id: string;
  previousStatus: PartnerSampleStatus;
  newStatus: PartnerSampleStatus;
  updatedBy: string;
  timestamp: string;
  remarks?: string;
};

export type PartnerSampleRecord = {
  id: string; // Sample Record ID
  bookingId: string;
  bookingNumber: string;
  scopexSampleId: string; // Original SCOPEX Sample ID (remains unchanged)
  partnerBarcode?: string; // Partner lab's accession / tube barcode
  barcodePhotoUrl?: string; // Uploaded photograph of labeled tube
  partnerLabId: string;
  partnerLabName: string;
  locationId: string;
  locationCity: string;
  patientName: string;
  patientPhone: string;
  testIds: string[];
  testNames: string[];
  // Historical rate snapshot saved at assignment
  applicableRateSnapshot: Array<{
    testId: string;
    testName: string;
    processingRate: number;
    mappingVersion: number;
    appliedScope?: RateApplicability;
    appliedScopeDescription?: string;
    appliedRateId?: string;
    appliedCityOrCities?: string;
  }>;
  totalProcessingCost: number;
  status: PartnerSampleStatus;
  statusHistory: PartnerSampleStatusHistory[];
  handoverConfirmedBy?: string;
  handoverConfirmedAt?: string;
  handoverGpsCoordinates?: { latitude: number; longitude: number };
  adminVerified: boolean;
  adminVerifiedBy?: string;
  adminVerifiedAt?: string;
  exceptionType?:
    | "Sample not received"
    | "Barcode mismatch"
    | "Wrong partner assignment"
    | "Missing barcode photo"
    | "Sample rejection"
    | "Delayed processing"
    | "Missing report";
  exceptionRemarks?: string;
  createdAt: string;
  updatedAt: string;
};

// =============================================================================
// PHASE 5: REPORT MANAGEMENT & PATIENT PUBLICATION
// =============================================================================

export type ReportPublicationStatus =
  | "Awaiting Report"
  | "Report Uploaded"
  | "Pending Verification"
  | "Verified"
  | "Published to Patient";

export type PartnerReportVersion = {
  version: number;
  fileUrl: string;
  fileName: string;
  uploadedBy: string;
  uploadedAt: string;
  remarks?: string;
};

export type PartnerLabReport = {
  id: string;
  bookingId: string;
  bookingNumber: string;
  scopexSampleId: string;
  partnerBarcode?: string;
  patientName: string;
  patientPhone: string;
  testNames: string[];
  partnerLabId: string;
  reportType: "individual" | "combined" | "revised";
  currentFileUrl: string;
  currentFileName: string;
  status: ReportPublicationStatus;
  versionHistory: PartnerReportVersion[];
  verifiedBy?: string;
  verifiedAt?: string;
  publishedAt?: string;
  rejectionRemarks?: string;
  createdAt: string;
  updatedAt: string;
};

// =============================================================================
// PHASE 6, 7 & 8: FINANCIAL CONTRACTS, INVOICES & PAYMENTS
// =============================================================================

export type PartnerInvoiceStatus =
  | "Pending"
  | "Under Review"
  | "Approved"
  | "Partially Approved"
  | "Partially Paid"
  | "Paid"
  | "Rejected"
  | "Disputed";

export type PartnerPaymentRecord = {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  partnerLabId: string;
  paymentAmount: number;
  paymentDate: string;
  paymentMode: "NEFT" | "RTGS" | "UPI" | "Cheque" | "Bank Transfer";
  transactionReference: string;
  receiptUrl?: string;
  remarks?: string;
  recordedBy: string;
  createdAt: string;
};

export type PartnerInvoiceDiscrepancy = {
  type:
    | "duplicate_invoice_number"
    | "duplicate_sample_charge"
    | "unassigned_sample"
    | "rate_mismatch"
    | "missing_sample"
    | "rejected_sample_charge"
    | "amount_mismatch";
  message: string;
  sampleId?: string;
  expectedAmount?: number;
  chargedAmount?: number;
};

export type PartnerInvoice = {
  id: string;
  partnerLabId: string;
  partnerLabName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  relatedBookingIds: string[];
  relatedSampleIds: string[];
  invoiceAmount: number;
  approvedAmount: number;
  rejectedAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: PartnerInvoiceStatus;
  invoicePdfUrl?: string;
  remarks?: string;
  discrepancies: PartnerInvoiceDiscrepancy[];
  payments: PartnerPaymentRecord[];
  createdAt: string;
  updatedAt: string;
};

export type RevenueAllocationMode = "proportional" | "equal" | "manual";

// =============================================================================
// IN-MEMORY STORES & SEED DATA
// =============================================================================

export const inMemoryPartnerLabs: Map<string, PartnerLab> = new Map();
export const inMemoryPartnerTestMappings: Map<string, PartnerTestMapping> = new Map();
export const inMemoryPartnerSamples: Map<string, PartnerSampleRecord> = new Map();
export const inMemoryPartnerReports: Map<string, PartnerLabReport> = new Map();
export const inMemoryPartnerInvoices: Map<string, PartnerInvoice> = new Map();
export const inMemoryPartnerPayments: PartnerPaymentRecord[] = [];

function nowIso(): string {
  return new Date().toISOString();
}

export function generatePartnerLabId(): string {
  const count = inMemoryPartnerLabs.size + 1;
  return `PLAB-${String(count).padStart(3, "0")}`;
}

export function generatePartnerLocationId(partnerLabId: string, city: string): string {
  const cleanCity = city.trim().slice(0, 3).toUpperCase();
  const count = (inMemoryPartnerLabs.get(partnerLabId)?.locations.length || 0) + 1;
  return `LOC-${cleanCity}-${String(count).padStart(2, "0")}`;
}

export function findScopexTest(identifier: string) {
  if (!identifier) return undefined;
  const raw = identifier.trim().toLowerCase();
  const q = raw.replace(/[^a-z0-9]/g, "");
  const all = Array.from(inMemoryTests.values());

  // 1. Exact match on ID or clean ID
  const exactId = all.find((t) => t.id.toLowerCase() === raw || t.id.replace(/[^a-z0-9]/g, "") === q);
  if (exactId) return exactId;

  // 2. Exact match on Name or clean Name
  const exactName = all.find((t) => t.name.toLowerCase() === raw || t.name.replace(/[^a-z0-9]/g, "") === q);
  if (exactName) return exactName;

  // 3. Match in searchAliases (exact or bidirectional inclusion)
  const aliasMatch = all.find((t) =>
    (t.searchAliases || []).some((a) => {
      const cleanA = a.toLowerCase().replace(/[^a-z0-9]/g, "");
      return (
        a.toLowerCase() === raw ||
        cleanA === q ||
        (cleanA.length >= 3 && q.includes(cleanA)) ||
        (q.length >= 3 && cleanA.includes(q))
      );
    })
  );
  if (aliasMatch) return aliasMatch;

  // 4. Substring contains on name or id
  const subMatch = all.find((t) => {
    const cleanName = t.name.replace(/[^a-z0-9]/g, "").toLowerCase();
    const cleanId = t.id.replace(/[^a-z0-9]/g, "").toLowerCase();
    return (
      (cleanName.length >= 4 && (cleanName.includes(q) || (q.length >= 4 && q.includes(cleanName)))) ||
      (cleanId.length >= 3 && (cleanId.includes(q) || (q.length >= 3 && q.includes(cleanId))))
    );
  });
  if (subMatch) return subMatch;

  // 5. Token-based word scoring (ignoring common stop words)
  const stopWords = new Set(["test", "tests", "panel", "profile", "checkup", "package", "and", "the", "for", "with"]);
  const tokens = (raw.match(/[a-z0-9]{3,}/g) || []).filter((tok) => !stopWords.has(tok));
  if (tokens.length > 0) {
    let bestMatch: (typeof all)[0] | undefined;
    let maxScore = 0;
    for (const t of all) {
      let score = 0;
      const haystack = `${t.id} ${t.name} ${(t.searchAliases || []).join(" ")}`.toLowerCase();
      for (const tok of tokens) {
        if (haystack.includes(tok)) score++;
      }
      if (score > maxScore) {
        maxScore = score;
        bestMatch = t;
      }
    }
    if (maxScore >= 1 && bestMatch) return bestMatch;
  }

  return undefined;
}

// -----------------------------------------------------------------------------
// SEED INITIAL DATA IF EMPTY
// -----------------------------------------------------------------------------
export function seedInitialPartnerLabDataIfEmpty() {
  if (inMemoryPartnerLabs.size > 0) return;

  const lab1: PartnerLab = {
    id: "PLAB-001",
    name: "Apex Central Pathology & Molecular Laboratory",
    brandName: "Apex Diagnostics",
    legalName: "Apex Healthcare & Clinical Diagnostics Pvt Ltd",
    registrationNumber: "REG-MP-2018-9921",
    isNablAccredited: true,
    nablNumber: "NABL-MC-3041",
    gstin: "23AABCA1234F1Z8",
    registeredAddress: "401-404, City Centre Tower, MG Road, Indore, MP 452001",
    primaryContactPerson: "Dr. Arvind Mehta (Lab Director)",
    mobile: "9826011223",
    email: "arvind.mehta@apexdiagnostics.in",
    status: "active",
    locations: [
      {
        id: "LOC-IND-01",
        partnerLabId: "PLAB-001",
        city: "Indore",
        fullAddress: "Plot 12, Scheme 54, PU-4 Commercial, Vijay Nagar, Indore 452010",
        pincode: "452010",
        contactPerson: "Dr. Arvind Mehta",
        mobile: "9826011223",
        email: "indore.ref@apexdiagnostics.in",
        sampleReceivingTimings: "07:00 AM - 10:00 PM",
        operatingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        status: "active",
        createdAt: nowIso(),
        updatedAt: nowIso()
      },
      {
        id: "LOC-BHP-01",
        partnerLabId: "PLAB-001",
        city: "Bhopal",
        fullAddress: "72, Zone II, Maharana Pratap Nagar, Bhopal 462011",
        pincode: "462011",
        contactPerson: "Rohan Saxena (Ops Manager)",
        mobile: "9826033445",
        email: "bhopal.ops@apexdiagnostics.in",
        sampleReceivingTimings: "08:00 AM - 08:00 PM",
        operatingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        status: "active",
        createdAt: nowIso(),
        updatedAt: nowIso()
      }
    ],
    createdAt: nowIso(),
    updatedAt: nowIso()
  };

  const lab2: PartnerLab = {
    id: "PLAB-002",
    name: "MedPrime Reference Diagnostics Laboratory",
    brandName: "MedPrime Labs",
    legalName: "MedPrime Diagnostic Services LLP",
    registrationNumber: "REG-UP-2020-8812",
    isNablAccredited: true,
    nablNumber: "NABL-MC-4112",
    gstin: "09AAACM5544K1Z2",
    registeredAddress: "Sector 14, Gomti Nagar, Lucknow, UP 226010",
    primaryContactPerson: "Dr. Suman Rastogi",
    mobile: "9839011992",
    email: "suman.rastogi@medprimelabs.com",
    status: "active",
    locations: [
      {
        id: "LOC-LKO-01",
        partnerLabId: "PLAB-002",
        city: "Lucknow",
        fullAddress: "Sector 14, Gomti Nagar, Lucknow, UP 226010",
        pincode: "226010",
        contactPerson: "Dr. Suman Rastogi",
        mobile: "9839011992",
        email: "lucknow@medprimelabs.com",
        sampleReceivingTimings: "07:30 AM - 09:30 PM",
        operatingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        status: "active",
        createdAt: nowIso(),
        updatedAt: nowIso()
      }
    ],
    createdAt: nowIso(),
    updatedAt: nowIso()
  };

  const lab3: PartnerLab = {
    id: "PLAB-003",
    name: "Agilus Diagnostics Limited",
    brandName: "Agilus Diagnostics",
    legalName: "Agilus Diagnostics Limited",
    registrationNumber: "REG-DL-2017-0091",
    isNablAccredited: true,
    nablNumber: "NABL-MC-2109",
    gstin: "07AAACA4411M1Z1",
    registeredAddress: "Fortis Complex, Okhla Road, New Delhi 110025",
    primaryContactPerson: "Dr. Rajesh Kaushik",
    mobile: "9811022334",
    email: "ops@agilusdiagnostics.com",
    status: "active",
    locations: [
      {
        id: "LOC-MUM-01",
        partnerLabId: "PLAB-003",
        city: "Mumbai",
        fullAddress: "Andheri East Central Hub, Mumbai 400069",
        pincode: "400069",
        contactPerson: "Pooja Hegde",
        mobile: "9820011445",
        email: "mumbai@agilusdiagnostics.com",
        sampleReceivingTimings: "24 Hours",
        operatingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        status: "active",
        createdAt: nowIso(),
        updatedAt: nowIso()
      },
      {
        id: "LOC-DEL-01",
        partnerLabId: "PLAB-003",
        city: "Delhi",
        fullAddress: "Okhla Phase 2, New Delhi 110020",
        pincode: "110020",
        contactPerson: "Dr. Rajesh Kaushik",
        mobile: "9811022334",
        email: "delhi@agilusdiagnostics.com",
        sampleReceivingTimings: "24 Hours",
        operatingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        status: "active",
        createdAt: nowIso(),
        updatedAt: nowIso()
      }
    ],
    createdAt: nowIso(),
    updatedAt: nowIso()
  };

  const lab4: PartnerLab = {
    id: "PLAB-004",
    name: "Dr. Lal PathLabs Limited",
    brandName: "Dr Lal PathLabs",
    legalName: "Dr. Lal PathLabs Limited",
    registrationNumber: "REG-DL-1995-1044",
    isNablAccredited: true,
    nablNumber: "NABL-MC-1011",
    gstin: "07AAACD1122J1Z8",
    registeredAddress: "Block E, Okhla Phase 2, New Delhi 110020",
    primaryContactPerson: "Suresh Narang",
    mobile: "9810011556",
    email: "partnerdesk@lalpathlabs.com",
    status: "active",
    locations: [
      {
        id: "LOC-LKO-02",
        partnerLabId: "PLAB-004",
        city: "Lucknow",
        fullAddress: "Hazratganj Central Desk, Lucknow 226001",
        pincode: "226001",
        contactPerson: "Virendra Sharma",
        mobile: "9839011778",
        email: "lucknow.hub@lalpathlabs.com",
        sampleReceivingTimings: "07:00 AM - 10:00 PM",
        operatingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        status: "active",
        createdAt: nowIso(),
        updatedAt: nowIso()
      }
    ],
    createdAt: nowIso(),
    updatedAt: nowIso()
  };

  const lab5: PartnerLab = {
    id: "PLAB-005",
    name: "Metropolis Healthcare Limited",
    brandName: "Metropolis Healthcare",
    legalName: "Metropolis Healthcare Limited",
    registrationNumber: "REG-MH-2006-5544",
    isNablAccredited: true,
    nablNumber: "NABL-MC-2099",
    gstin: "27AAACM3322H1Z5",
    registeredAddress: "Kohinoor City, Commercial 1, Kurla West, Mumbai 400070",
    primaryContactPerson: "Sunil Shinde",
    mobile: "9820033221",
    email: "tieups@metropolisindia.com",
    status: "active",
    locations: [
      {
        id: "LOC-IND-02",
        partnerLabId: "PLAB-005",
        city: "Indore",
        fullAddress: "MG Road, Treasure Island Mall Area, Indore 452001",
        pincode: "452001",
        contactPerson: "Amol Joshi",
        mobile: "9826077889",
        email: "indore@metropolisindia.com",
        sampleReceivingTimings: "08:00 AM - 09:00 PM",
        operatingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        status: "active",
        createdAt: nowIso(),
        updatedAt: nowIso()
      },
      {
        id: "LOC-BHP-02",
        partnerLabId: "PLAB-005",
        city: "Bhopal",
        fullAddress: "Arera Colony, Bhopal 462016",
        pincode: "462016",
        contactPerson: "Kavita Tiwari",
        mobile: "9826088990",
        email: "bhopal@metropolisindia.com",
        sampleReceivingTimings: "08:00 AM - 08:30 PM",
        operatingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        status: "active",
        createdAt: nowIso(),
        updatedAt: nowIso()
      },
      {
        id: "LOC-PUN-02",
        partnerLabId: "PLAB-005",
        city: "Pune",
        fullAddress: "FC Road, Shivaji Nagar, Pune 411005",
        pincode: "411005",
        contactPerson: "Ganesh Patil",
        mobile: "9822011223",
        email: "pune@metropolisindia.com",
        sampleReceivingTimings: "07:30 AM - 09:30 PM",
        operatingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        status: "active",
        createdAt: nowIso(),
        updatedAt: nowIso()
      }
    ],
    createdAt: nowIso(),
    updatedAt: nowIso()
  };

  inMemoryPartnerLabs.set(lab1.id, lab1);
  inMemoryPartnerLabs.set(lab2.id, lab2);
  inMemoryPartnerLabs.set(lab3.id, lab3);
  inMemoryPartnerLabs.set(lab4.id, lab4);
  inMemoryPartnerLabs.set(lab5.id, lab5);

  // Seed initial mappings illustrating:
  // 1. Pan-India common rate (Agilus CBC ₹130, Apex CBC ₹135)
  // 2. Selected Cities rate (Metropolis CBC ₹148 in Indore, Bhopal, Pune; Apex CBC ₹150 in Bhopal, Jabalpur)
  // 3. Single City rate (Lal PathLabs Lucknow ₹165, Apex CBC Indore ₹140)
  const initialMappings: Array<Partial<PartnerTestMapping> & { mappingKey?: string }> = [
    // PLAB-001 (Apex): Exact Single City Indore CBC ₹140 (Overrides broader rates)
    {
      mappingKey: "MAP-PLAB-001-LOC-IND-01-cbc",
      partnerLabId: "PLAB-001",
      locationId: "LOC-IND-01",
      applicability: "single_city",
      city: "Indore",
      scopexTestId: "cbc",
      scopexTestName: "Complete Blood Count (CBC)",
      partnerTestName: "Automated Hemogram (CBC + ESR)",
      partnerTestCode: "APX-HEM-01",
      category: "Hematology",
      partnerProcessingRate: 140,
      sampleType: "Whole Blood EDTA",
      tatHours: "6 Hours",
      effectiveFrom: "2026-01-01",
      status: "active"
    },
    // PLAB-001 (Apex): Selected Cities (Bhopal, Jabalpur) CBC ₹150
    {
      mappingKey: "MAP-PLAB-001-MULTI-cbc-bhp-jbp",
      partnerLabId: "PLAB-001",
      applicability: "selected_cities",
      applicableCities: ["Bhopal", "Jabalpur"],
      scopexTestId: "cbc",
      scopexTestName: "Complete Blood Count (CBC)",
      partnerTestName: "Automated Hemogram (CBC + ESR)",
      partnerTestCode: "APX-BHP-HEM",
      category: "Hematology",
      partnerProcessingRate: 150,
      sampleType: "Whole Blood EDTA",
      tatHours: "8 Hours",
      effectiveFrom: "2026-01-01",
      status: "active"
    },
    // PLAB-001 (Apex): Pan-India Common CBC ₹135
    {
      mappingKey: "MAP-PLAB-001-PANINDIA-cbc",
      partnerLabId: "PLAB-001",
      applicability: "pan_india",
      scopexTestId: "cbc",
      scopexTestName: "Complete Blood Count (CBC)",
      partnerTestName: "Apex Pan-India Hemogram (CBC)",
      partnerTestCode: "APX-PAN-CBC",
      category: "Hematology",
      partnerProcessingRate: 135,
      sampleType: "Whole Blood EDTA",
      tatHours: "8 Hours",
      effectiveFrom: "2026-01-01",
      status: "active"
    },
    // PLAB-001 (Apex): Backward compat mapping for LOC-BHP-01
    {
      mappingKey: "MAP-PLAB-001-LOC-BHP-01-cbc",
      partnerLabId: "PLAB-001",
      locationId: "LOC-BHP-01",
      applicability: "single_city",
      city: "Bhopal",
      scopexTestId: "cbc",
      scopexTestName: "Complete Blood Count (CBC)",
      partnerTestName: "Automated Hemogram (CBC + ESR)",
      partnerTestCode: "APX-BHP-HEM",
      category: "Hematology",
      partnerProcessingRate: 150,
      sampleType: "Whole Blood EDTA",
      tatHours: "8 Hours",
      effectiveFrom: "2026-01-01",
      status: "active"
    },
    // PLAB-001 (Apex): Lipid Profile Single City Indore ₹220
    {
      mappingKey: "MAP-PLAB-001-LOC-IND-01-lipid-profile",
      partnerLabId: "PLAB-001",
      locationId: "LOC-IND-01",
      applicability: "single_city",
      city: "Indore",
      scopexTestId: "lipid-profile",
      scopexTestName: "Lipid Profile",
      partnerTestName: "Serum Lipid Battery (Direct LDL/HDL)",
      partnerTestCode: "APX-BIO-09",
      category: "Biochemistry",
      partnerProcessingRate: 220,
      sampleType: "Serum",
      tatHours: "8 Hours",
      effectiveFrom: "2026-01-01",
      status: "active"
    },
    // PLAB-001 (Apex): Thyroid Profile Single City Indore ₹180
    {
      mappingKey: "MAP-PLAB-001-LOC-IND-01-thyroid-profile",
      partnerLabId: "PLAB-001",
      locationId: "LOC-IND-01",
      applicability: "single_city",
      city: "Indore",
      scopexTestId: "thyroid-profile",
      scopexTestName: "Thyroid Profile (Total T3, Total T4, TSH)",
      partnerTestName: "Chemiluminescence Thyroid Panel (T3, T4, Ultra TSH)",
      partnerTestCode: "",
      category: "Hormone",
      partnerProcessingRate: 180,
      sampleType: "Serum",
      tatHours: "12 Hours",
      effectiveFrom: "2026-01-01",
      status: "active"
    },
    // PLAB-002 (MedPrime): Single City Lucknow CBC ₹160
    {
      mappingKey: "MAP-PLAB-002-LOC-LKO-01-cbc",
      partnerLabId: "PLAB-002",
      locationId: "LOC-LKO-01",
      applicability: "single_city",
      city: "Lucknow",
      scopexTestId: "cbc",
      scopexTestName: "Complete Blood Count (CBC)",
      partnerTestName: "MedPrime Automated CBC",
      partnerTestCode: "MPR-CBC-01",
      category: "Hematology",
      partnerProcessingRate: 160,
      sampleType: "Whole Blood EDTA",
      tatHours: "6 Hours",
      effectiveFrom: "2026-01-01",
      status: "active"
    },
    // PLAB-002 (MedPrime): Pan-India CBC ₹155
    {
      mappingKey: "MAP-PLAB-002-PANINDIA-cbc",
      partnerLabId: "PLAB-002",
      applicability: "pan_india",
      scopexTestId: "cbc",
      scopexTestName: "Complete Blood Count (CBC)",
      partnerTestName: "MedPrime Pan-India CBC",
      partnerTestCode: "MPR-PAN-CBC",
      category: "Hematology",
      partnerProcessingRate: 155,
      sampleType: "Whole Blood EDTA",
      tatHours: "8 Hours",
      effectiveFrom: "2026-01-01",
      status: "active"
    },
    // PLAB-003 (Agilus): Pan-India rate CBC ₹130 (User Example 1)
    {
      mappingKey: "MAP-PLAB-003-PANINDIA-cbc",
      partnerLabId: "PLAB-003",
      applicability: "pan_india",
      scopexTestId: "cbc",
      scopexTestName: "Complete Blood Count (CBC)",
      partnerTestName: "Agilus Pan-India Automated CBC",
      partnerTestCode: "AGL-CBC-PAN",
      category: "Hematology",
      partnerProcessingRate: 130,
      sampleType: "Whole Blood EDTA",
      tatHours: "6 Hours",
      effectiveFrom: "2026-01-01",
      status: "active"
    },
    // PLAB-004 (Dr Lal PathLabs): Single City Lucknow only CBC ₹165 (User Example 2)
    {
      mappingKey: "MAP-PLAB-004-SINGLE-LUCKNOW-cbc",
      partnerLabId: "PLAB-004",
      applicability: "single_city",
      city: "Lucknow",
      locationId: "LOC-LKO-02",
      scopexTestId: "cbc",
      scopexTestName: "Complete Blood Count (CBC)",
      partnerTestName: "Lal PathLabs CBC Hemogram",
      partnerTestCode: "LAL-LKO-CBC",
      category: "Hematology",
      partnerProcessingRate: 165,
      sampleType: "Whole Blood EDTA",
      tatHours: "6 Hours",
      effectiveFrom: "2026-01-01",
      status: "active"
    },
    // PLAB-005 (Metropolis): Selected Cities (Indore, Bhopal, Pune) CBC ₹148 (User Example 3)
    {
      mappingKey: "MAP-PLAB-005-SELECTED-cbc",
      partnerLabId: "PLAB-005",
      applicability: "selected_cities",
      applicableCities: ["Indore", "Bhopal", "Pune"],
      scopexTestId: "cbc",
      scopexTestName: "Complete Blood Count (CBC)",
      partnerTestName: "Metropolis Multi-City CBC",
      partnerTestCode: "MTR-CBC-GRP",
      category: "Hematology",
      partnerProcessingRate: 148,
      sampleType: "Whole Blood EDTA",
      tatHours: "8 Hours",
      effectiveFrom: "2026-01-01",
      status: "active"
    }
  ];

  for (const m of initialMappings) {
    const matched = findScopexTest(m.scopexTestId!);
    const testId = matched ? matched.id : m.scopexTestId!;
    const testName = matched ? matched.name : m.scopexTestName!;
    const id = m.mappingKey || (m.locationId ? `MAP-${m.partnerLabId}-${m.locationId}-${testId}` : `MAP-${m.partnerLabId}-${m.applicability}-${testId}`);
    inMemoryPartnerTestMappings.set(id, {
      id,
      partnerLabId: m.partnerLabId!,
      applicability: m.applicability || (m.locationId ? "single_city" : "pan_india"),
      city: m.city || undefined,
      applicableCities: m.applicableCities || undefined,
      locationId: m.locationId || undefined,
      scopexTestId: testId,
      scopexTestName: testName,
      partnerTestName: m.partnerTestName!,
      partnerTestCode: m.partnerTestCode || undefined,
      category: m.category || "General",
      partnerProcessingRate: m.partnerProcessingRate!,
      sampleType: m.sampleType || "Blood",
      tatHours: m.tatHours || "12 Hours",
      effectiveFrom: m.effectiveFrom || "2026-01-01",
      version: 1,
      status: "active",
      createdAt: nowIso(),
      updatedAt: nowIso()
    });
  }
}

// =============================================================================
// PHASE 1: PARTNER REGISTRATION & LOCATION METHODS
// =============================================================================

export function listPartnerLabs(filters?: { status?: string; city?: string }) {
  seedInitialPartnerLabDataIfEmpty();
  let labs = Array.from(inMemoryPartnerLabs.values());

  if (filters?.status && filters.status !== "all") {
    labs = labs.filter((l) => l.status === filters.status);
  }

  if (filters?.city && filters.city !== "all") {
    const targetCity = filters.city.toLowerCase();
    labs = labs.filter((l) => l.locations.some((loc) => loc.city.toLowerCase() === targetCity && loc.status === "active"));
  }

  return labs;
}

export function getPartnerLabById(id: string): PartnerLab | undefined {
  seedInitialPartnerLabDataIfEmpty();
  return inMemoryPartnerLabs.get(id);
}

export function registerPartnerLab(
  input: {
    name: string;
    brandName: string;
    legalName?: string;
    registrationNumber: string;
    isNablAccredited: boolean;
    nablNumber?: string;
    gstin?: string;
    registeredAddress: string;
    primaryContactPerson: string;
    mobile: string;
    email: string;
    status?: PartnerLabStatus;
  },
  adminUser: { email?: string; userId?: string }
): PartnerLab {
  seedInitialPartnerLabDataIfEmpty();

  if (!input.name?.trim()) throw new Error("Laboratory Name is required.");
  if (!input.brandName?.trim()) throw new Error("Brand Name is required.");
  if (!input.registrationNumber?.trim()) throw new Error("Registration / Licence Number is required.");
  if (!input.primaryContactPerson?.trim()) throw new Error("Primary Contact Person is required.");
  if (!input.mobile?.trim()) throw new Error("Mobile Number is required.");
  if (!input.email?.trim()) throw new Error("Email Address is required.");

  const labId = generatePartnerLabId();
  const newLab: PartnerLab = {
    id: labId,
    name: input.name.trim(),
    brandName: input.brandName.trim(),
    legalName: input.legalName?.trim() || undefined,
    registrationNumber: input.registrationNumber.trim(),
    isNablAccredited: Boolean(input.isNablAccredited),
    nablNumber: input.nablNumber?.trim() || undefined,
    gstin: input.gstin?.trim() || undefined,
    registeredAddress: input.registeredAddress.trim(),
    primaryContactPerson: input.primaryContactPerson.trim(),
    mobile: input.mobile.trim(),
    email: input.email.trim().toLowerCase(),
    status: input.status || "active",
    locations: [],
    createdAt: nowIso(),
    updatedAt: nowIso()
  };

  inMemoryPartnerLabs.set(labId, newLab);

  logAuditAction({
    actorEmail: adminUser.email || adminUser.userId || "admin",
    action: "register_partner_lab",
    entityType: "partner_laboratory",
    entityId: labId,
    newVal: newLab
  });

  return newLab;
}

export function updatePartnerLab(
  id: string,
  patch: Partial<PartnerLab>,
  adminUser: { email?: string; userId?: string }
): PartnerLab {
  seedInitialPartnerLabDataIfEmpty();
  const lab = inMemoryPartnerLabs.get(id);
  if (!lab) throw new Error(`Partner Laboratory with ID "${id}" not found.`);

  const old = { ...lab };
  const updated: PartnerLab = {
    ...lab,
    ...patch,
    id: lab.id, // ID is immutable
    updatedAt: nowIso()
  };

  inMemoryPartnerLabs.set(id, updated);

  logAuditAction({
    actorEmail: adminUser.email || adminUser.userId || "admin",
    action: "update_partner_lab",
    entityType: "partner_laboratory",
    entityId: id,
    oldVal: old,
    newVal: updated
  });

  return updated;
}

export function addPartnerLabLocation(
  partnerLabId: string,
  input: {
    city: string;
    fullAddress: string;
    pincode: string;
    contactPerson: string;
    mobile: string;
    email: string;
    sampleReceivingTimings: string;
    operatingDays: string[];
    status?: PartnerLabLocationStatus;
  },
  adminUser: { email?: string; userId?: string }
): PartnerLabLocation {
  seedInitialPartnerLabDataIfEmpty();
  const lab = inMemoryPartnerLabs.get(partnerLabId);
  if (!lab) throw new Error(`Partner Laboratory with ID "${partnerLabId}" not found.`);

  if (!input.city?.trim()) throw new Error("City is required.");
  if (!input.fullAddress?.trim()) throw new Error("Full Address is required.");
  if (!input.pincode?.trim() || !/^\d{6}$/.test(input.pincode.trim())) {
    throw new Error("Valid 6-digit PIN Code is required.");
  }
  if (!input.contactPerson?.trim()) throw new Error("Contact Person is required.");
  if (!input.mobile?.trim()) throw new Error("Mobile Number is required.");

  const locId = generatePartnerLocationId(partnerLabId, input.city);
  const location: PartnerLabLocation = {
    id: locId,
    partnerLabId,
    city: input.city.trim(),
    fullAddress: input.fullAddress.trim(),
    pincode: input.pincode.trim(),
    contactPerson: input.contactPerson.trim(),
    mobile: input.mobile.trim(),
    email: input.email.trim().toLowerCase(),
    sampleReceivingTimings: input.sampleReceivingTimings?.trim() || "08:00 AM - 08:00 PM",
    operatingDays: input.operatingDays && input.operatingDays.length > 0
      ? input.operatingDays
      : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    status: input.status || "active",
    createdAt: nowIso(),
    updatedAt: nowIso()
  };

  lab.locations.push(location);
  lab.updatedAt = nowIso();

  logAuditAction({
    actorEmail: adminUser.email || adminUser.userId || "admin",
    action: "add_partner_location",
    entityType: "partner_laboratory_location",
    entityId: locId,
    newVal: location
  });

  return location;
}

export function updatePartnerLabLocation(
  partnerLabId: string,
  locationId: string,
  patch: Partial<PartnerLabLocation>,
  adminUser: { email?: string; userId?: string }
): PartnerLabLocation {
  seedInitialPartnerLabDataIfEmpty();
  const lab = inMemoryPartnerLabs.get(partnerLabId);
  if (!lab) throw new Error(`Partner Laboratory with ID "${partnerLabId}" not found.`);

  const locIndex = lab.locations.findIndex((l) => l.id === locationId);
  if (locIndex === -1) throw new Error(`Location ID "${locationId}" not found for partner ${partnerLabId}.`);

  const old = lab.locations[locIndex];
  const updated: PartnerLabLocation = {
    ...old,
    ...patch,
    id: old.id,
    partnerLabId: old.partnerLabId,
    updatedAt: nowIso()
  };

  lab.locations[locIndex] = updated;
  lab.updatedAt = nowIso();

  logAuditAction({
    actorEmail: adminUser.email || adminUser.userId || "admin",
    action: "update_partner_location",
    entityType: "partner_laboratory_location",
    entityId: locationId,
    oldVal: old,
    newVal: updated
  });

  return updated;
}

// =============================================================================
// PHASE 2: PARTNER LAB TEST MASTER METHODS & RATE APPLICABILITY RESOLUTION
// =============================================================================

export function listPartnerTestMappings(filters?: {
  partnerLabId?: string;
  locationId?: string;
  city?: string;
  applicability?: string;
  status?: string;
  search?: string;
}) {
  seedInitialPartnerLabDataIfEmpty();
  let list = Array.from(inMemoryPartnerTestMappings.values());

  if (filters?.partnerLabId && filters.partnerLabId !== "all") {
    list = list.filter((m) => m.partnerLabId === filters.partnerLabId);
  }
  if (filters?.locationId && filters.locationId !== "all") {
    list = list.filter((m) => m.locationId === filters.locationId);
  }
  if (filters?.applicability && filters.applicability !== "all") {
    list = list.filter((m) => m.applicability === filters.applicability);
  }
  if (filters?.status && filters.status !== "all") {
    list = list.filter((m) => m.status === filters.status);
  }
  if (filters?.city && filters.city !== "all") {
    const targetCity = filters.city.trim().toLowerCase();
    list = list.filter((m) => {
      if (m.applicability === "pan_india") return true;
      if (m.applicability === "single_city" && m.city?.trim().toLowerCase() === targetCity) return true;
      if (m.applicability === "selected_cities" && m.applicableCities?.some((c) => c.trim().toLowerCase() === targetCity)) return true;
      if (m.locationId) {
        const lab = inMemoryPartnerLabs.get(m.partnerLabId);
        const loc = lab?.locations.find((l) => l.id === m.locationId);
        return loc && loc.city.trim().toLowerCase() === targetCity;
      }
      return false;
    });
  }
  if (filters?.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    list = list.filter(
      (m) =>
        m.scopexTestName.toLowerCase().includes(q) ||
        m.partnerTestName.toLowerCase().includes(q) ||
        (m.partnerTestCode && m.partnerTestCode.toLowerCase().includes(q)) ||
        m.scopexTestId.toLowerCase().includes(q) ||
        (m.city && m.city.toLowerCase().includes(q)) ||
        (m.applicableCities && m.applicableCities.some((c) => c.toLowerCase().includes(q)))
    );
  }

  return list;
}

// -----------------------------------------------------------------------------
// RATE CONFLICT PREVENTION (SAME PARTNER, TEST, CITY/TIER, AND OVERLAPPING DATES)
// -----------------------------------------------------------------------------
export function checkRateConflict(params: {
  partnerLabId: string;
  scopexTestId: string;
  applicability: RateApplicability;
  city?: string;
  applicableCities?: string[];
  effectiveFrom: string;
  effectiveTo?: string;
  excludeMappingId?: string;
}): { hasConflict: boolean; conflictingMapping?: PartnerTestMapping; message?: string } {
  seedInitialPartnerLabDataIfEmpty();
  const matched = findScopexTest(params.scopexTestId);
  const targetId = matched ? matched.id : params.scopexTestId;
  const targetName = matched ? matched.name.toLowerCase() : params.scopexTestId.toLowerCase();

  const effFrom = params.effectiveFrom;
  const effTo = params.effectiveTo || "9999-12-31";

  for (const m of inMemoryPartnerTestMappings.values()) {
    if (m.partnerLabId !== params.partnerLabId) continue;
    if (m.status !== "active") continue;
    if (params.excludeMappingId && m.id === params.excludeMappingId) continue;

    const testMatch =
      m.scopexTestId === targetId ||
      m.scopexTestName.toLowerCase() === targetName ||
      (matched && m.scopexTestName.toLowerCase() === matched.name.toLowerCase());
    if (!testMatch) continue;

    // Check date range overlap
    const mFrom = m.effectiveFrom || "1970-01-01";
    const mTo = m.effectiveTo || "9999-12-31";
    const datesOverlap = effFrom <= mTo && effTo >= mFrom;
    if (!datesOverlap) continue;

    // 1. Conflict between two Single City rates for the same city
    if (params.applicability === "single_city" && m.applicability === "single_city") {
      const cityA = (params.city || "").trim().toLowerCase();
      const cityB = (m.city || "").trim().toLowerCase();
      if (cityA && cityB && cityA === cityB) {
        return {
          hasConflict: true,
          conflictingMapping: m,
          message: `Conflicting active Single City rate already exists for "${m.city}" (v${m.version || 1}, ₹${m.partnerProcessingRate}, effective from ${m.effectiveFrom}).`
        };
      }
    }

    // 2. Conflict between two Selected Cities rates overlapping on any city
    if (params.applicability === "selected_cities" && m.applicability === "selected_cities") {
      const citiesA = (params.applicableCities || []).map((c) => c.trim().toLowerCase());
      const citiesB = (m.applicableCities || []).map((c) => c.trim().toLowerCase());
      const overlappingCity = citiesA.find((c) => citiesB.includes(c));
      if (overlappingCity) {
        return {
          hasConflict: true,
          conflictingMapping: m,
          message: `Conflicting active Selected Cities rate already covers "${overlappingCity}" (v${m.version || 1}, ₹${m.partnerProcessingRate}, effective from ${m.effectiveFrom}).`
        };
      }
    }

    // 3. Conflict between two Pan-India rates
    if (params.applicability === "pan_india" && m.applicability === "pan_india") {
      return {
        hasConflict: true,
        conflictingMapping: m,
        message: `Conflicting active Pan-India rate already exists (v${m.version || 1}, ₹${m.partnerProcessingRate}, effective from ${m.effectiveFrom}).`
      };
    }
  }

  return { hasConflict: false };
}

// -----------------------------------------------------------------------------
// RATE SELECTION PRIORITY RESOLUTION
// Priority 1: Exact Single City -> Priority 2: Selected Cities -> Priority 3: Pan-India
// -----------------------------------------------------------------------------
export type ResolvedPartnerRate = {
  mapping: PartnerTestMapping;
  appliedScope: RateApplicability;
  rate: number;
  scopeDescription: string;
  priorityTier: 1 | 2 | 3;
};

export function resolveApplicablePartnerRate(params: {
  partnerLabId: string;
  city: string;
  scopexTestId: string;
  asOfDate?: string;
}): ResolvedPartnerRate | null {
  seedInitialPartnerLabDataIfEmpty();
  const normalizedCity = params.city.trim().toLowerCase();
  const dateStr = params.asOfDate || new Date().toISOString().split("T")[0];

  // Resolve target test ID and name
  const matched = findScopexTest(params.scopexTestId);
  const targetId = matched ? matched.id : params.scopexTestId;
  const targetName = matched ? matched.name.toLowerCase() : params.scopexTestId.toLowerCase();

  // Find all active candidate mappings for this partner and test within effective dates
  const candidates = Array.from(inMemoryPartnerTestMappings.values()).filter((m) => {
    if (m.partnerLabId !== params.partnerLabId) return false;
    if (m.status !== "active") return false;

    // Test match
    const testMatch =
      m.scopexTestId === targetId ||
      m.scopexTestId === params.scopexTestId ||
      m.scopexTestName.toLowerCase() === targetName ||
      (matched && m.scopexTestName.toLowerCase() === matched.name.toLowerCase());
    if (!testMatch) return false;

    // Date range check
    if (m.effectiveFrom && m.effectiveFrom > dateStr) return false;
    if (m.effectiveTo && m.effectiveTo < dateStr) return false;

    return true;
  });

  // Sort candidates by version descending so highest version takes precedence
  candidates.sort((a, b) => (b.version || 1) - (a.version || 1));

  // PRIORITY 1: Exact city-specific rate (Single City)
  const singleCityMatch = candidates.find((m) => {
    if (m.applicability === "single_city" && m.city && m.city.trim().toLowerCase() === normalizedCity) {
      return true;
    }
    if (m.locationId) {
      const lab = inMemoryPartnerLabs.get(m.partnerLabId);
      const loc = lab?.locations.find((l) => l.id === m.locationId);
      if (loc && loc.city.trim().toLowerCase() === normalizedCity) {
        return true;
      }
    }
    return false;
  });

  if (singleCityMatch) {
    return {
      mapping: singleCityMatch,
      appliedScope: "single_city",
      rate: singleCityMatch.partnerProcessingRate,
      scopeDescription: `Single City: ${singleCityMatch.city || params.city}`,
      priorityTier: 1
    };
  }

  // PRIORITY 2: Selected Cities rate that includes that city
  const selectedCitiesMatch = candidates.find((m) => {
    if (m.applicability === "selected_cities" && Array.isArray(m.applicableCities)) {
      return m.applicableCities.some((c) => c.trim().toLowerCase() === normalizedCity);
    }
    return false;
  });

  if (selectedCitiesMatch) {
    return {
      mapping: selectedCitiesMatch,
      appliedScope: "selected_cities",
      rate: selectedCitiesMatch.partnerProcessingRate,
      scopeDescription: `Selected Cities (${selectedCitiesMatch.applicableCities?.join(", ")})`,
      priorityTier: 2
    };
  }

  // PRIORITY 3: Active Pan-India common rate
  const panIndiaMatch = candidates.find((m) => {
    return m.applicability === "pan_india";
  });

  if (panIndiaMatch) {
    return {
      mapping: panIndiaMatch,
      appliedScope: "pan_india",
      rate: panIndiaMatch.partnerProcessingRate,
      scopeDescription: "Pan-India Common Rate",
      priorityTier: 3
    };
  }

  // PRIORITY 4: No applicable rate exists
  return null;
}

// -----------------------------------------------------------------------------
// RETRIEVE TESTS AND RATES FOR A PARTNER LOCATION
// -----------------------------------------------------------------------------
export function getPartnerLocationTestsAndRates(params: {
  partnerLabId: string;
  locationId: string;
  testIds: string[];
}): {
  allMapped: boolean;
  totalCost: number;
  tests: Array<{
    testId: string;
    testName: string;
    isMapped: boolean;
    rate?: number;
    appliedScope?: RateApplicability;
    appliedScopeDescription?: string;
    partnerTestName?: string;
    errorWarning?: string;
  }>;
} {
  seedInitialPartnerLabDataIfEmpty();
  const lab = inMemoryPartnerLabs.get(params.partnerLabId);
  const loc = lab?.locations.find((l) => l.id === params.locationId);
  const city = loc?.city || "Unknown City";

  let allMapped = true;
  let totalCost = 0;
  const tests: Array<{
    testId: string;
    testName: string;
    isMapped: boolean;
    rate?: number;
    appliedScope?: RateApplicability;
    appliedScopeDescription?: string;
    partnerTestName?: string;
    errorWarning?: string;
  }> = [];

  for (const tid of params.testIds) {
    const scopexTest = findScopexTest(tid);
    const resolvedId = scopexTest?.id || tid;
    const testName = scopexTest?.name || tid;

    const resolvedRate = resolveApplicablePartnerRate({
      partnerLabId: params.partnerLabId,
      city,
      scopexTestId: resolvedId
    });

    if (resolvedRate) {
      totalCost += resolvedRate.rate;
      tests.push({
        testId: resolvedId,
        testName,
        isMapped: true,
        rate: resolvedRate.rate,
        appliedScope: resolvedRate.appliedScope,
        appliedScopeDescription: resolvedRate.scopeDescription,
        partnerTestName: resolvedRate.mapping.partnerTestName
      });
    } else {
      allMapped = false;
      tests.push({
        testId: resolvedId,
        testName,
        isMapped: false,
        errorWarning: `No applicable rate configured for ${lab?.name || params.partnerLabId} in ${city} (checked Single City, Selected Cities, and Pan-India).`
      });
    }
  }

  return { allMapped, totalCost, tests };
}

// -----------------------------------------------------------------------------
// CREATE OR UPDATE MANUAL PARTNER TEST MAPPING
// -----------------------------------------------------------------------------
export function createOrUpdateManualPartnerTestMapping(
  input: {
    partnerLabId: string;
    applicability?: RateApplicability;
    city?: string;
    applicableCities?: string[];
    locationId?: string; // Optional/legacy location
    scopexTestId: string;
    partnerTestName: string;
    partnerTestCode?: string; // Optional!
    category?: string;
    partnerProcessingRate: number;
    sampleType?: string;
    tatHours?: string;
    effectiveFrom: string;
    effectiveTo?: string;
    status?: "active" | "inactive";
    resolutionStrategy?: DuplicateResolutionStrategy;
  },
  adminUser: { email?: string; userId?: string }
): PartnerTestMapping {
  seedInitialPartnerLabDataIfEmpty();

  const lab = inMemoryPartnerLabs.get(input.partnerLabId);
  if (!lab) throw new Error(`Partner Laboratory "${input.partnerLabId}" does not exist.`);

  let loc = input.locationId ? lab.locations.find((l) => l.id === input.locationId) : undefined;

  // Infer applicability if not explicitly passed
  let applicability: RateApplicability = input.applicability || "single_city";
  if (!input.applicability) {
    if (input.applicableCities && input.applicableCities.length > 0) {
      applicability = "selected_cities";
    } else if (input.city || input.locationId) {
      applicability = "single_city";
    } else {
      applicability = "pan_india";
    }
  }

  let singleCity = input.city?.trim();
  if (applicability === "single_city" && !singleCity && loc) {
    singleCity = loc.city;
  }
  if (applicability === "single_city" && !singleCity) {
    throw new Error("City is required when Rate Applicability is set to Single City.");
  }

  const selectedCities = (input.applicableCities || []).map((c) => c.trim()).filter(Boolean);
  if (applicability === "selected_cities" && selectedCities.length === 0) {
    throw new Error("At least one city must be selected when Rate Applicability is set to Selected Cities.");
  }

  // Match SCOPEX test from existing Test Master
  const test = findScopexTest(input.scopexTestId);
  if (!test) throw new Error(`SCOPEX Test ID "${input.scopexTestId}" does not exist in SCOPEX Test Master.`);

  if (!input.partnerTestName?.trim()) throw new Error("Partner Lab Test Name is required.");
  if (typeof input.partnerProcessingRate !== "number" || isNaN(input.partnerProcessingRate) || input.partnerProcessingRate < 0) {
    throw new Error("Partner Processing Rate must be a valid non-negative number.");
  }
  if (!input.effectiveFrom?.trim()) throw new Error("Effective From Date is required.");

  // Generate canonical mapping key
  let mappingKey: string;
  if (input.locationId) {
    mappingKey = `MAP-${input.partnerLabId}-${input.locationId}-${test.id}`;
  } else if (applicability === "single_city") {
    mappingKey = `MAP-${input.partnerLabId}-SINGLE-${singleCity!.toUpperCase().replace(/\s+/g, "_")}-${test.id}`;
  } else if (applicability === "selected_cities") {
    const sorted = [...selectedCities].sort().join("-").toUpperCase().replace(/\s+/g, "_");
    mappingKey = `MAP-${input.partnerLabId}-MULTI-${test.id}-${sorted}`;
  } else {
    mappingKey = `MAP-${input.partnerLabId}-PANINDIA-${test.id}`;
  }

  const existing = inMemoryPartnerTestMappings.get(mappingKey);
  const strategy = input.resolutionStrategy || "update";

  if (existing) {
    if (strategy === "skip") {
      return existing;
    }

    if (strategy === "new_version") {
      existing.effectiveTo = input.effectiveFrom;
      existing.updatedAt = nowIso();

      const newVersionNum = (existing.version || 1) + 1;
      const newMapping: PartnerTestMapping = {
        id: `${mappingKey}-v${newVersionNum}`,
        partnerLabId: input.partnerLabId,
        applicability,
        city: singleCity,
        applicableCities: applicability === "selected_cities" ? selectedCities : undefined,
        locationId: input.locationId,
        scopexTestId: test.id,
        scopexTestName: test.name,
        partnerTestName: input.partnerTestName.trim(),
        partnerTestCode: input.partnerTestCode?.trim() || undefined,
        category: input.category || test.category || "General",
        partnerProcessingRate: input.partnerProcessingRate,
        sampleType: input.sampleType || test.specimenType || "Blood",
        tatHours: input.tatHours || test.tat || "12 Hours",
        effectiveFrom: input.effectiveFrom.trim(),
        effectiveTo: input.effectiveTo?.trim() || undefined,
        version: newVersionNum,
        status: input.status || "active",
        createdAt: nowIso(),
        updatedAt: nowIso()
      };

      inMemoryPartnerTestMappings.set(mappingKey, newMapping);

      logAuditAction({
        actorEmail: adminUser.email || adminUser.userId || "admin",
        action: "create_new_rate_version_mapping",
        entityType: "partner_test_mapping",
        entityId: newMapping.id,
        oldVal: existing,
        newVal: newMapping
      });

      return newMapping;
    }

    // Default "update": Update existing record
    const updated: PartnerTestMapping = {
      ...existing,
      applicability,
      city: singleCity,
      applicableCities: applicability === "selected_cities" ? selectedCities : undefined,
      partnerTestName: input.partnerTestName.trim(),
      partnerTestCode: input.partnerTestCode?.trim() || undefined,
      category: input.category || existing.category,
      partnerProcessingRate: input.partnerProcessingRate,
      sampleType: input.sampleType || existing.sampleType,
      tatHours: input.tatHours || existing.tatHours,
      effectiveFrom: input.effectiveFrom.trim(),
      effectiveTo: input.effectiveTo?.trim() || undefined,
      status: input.status || existing.status,
      updatedAt: nowIso()
    };

    inMemoryPartnerTestMappings.set(mappingKey, updated);

    logAuditAction({
      actorEmail: adminUser.email || adminUser.userId || "admin",
      action: "update_partner_test_mapping",
      entityType: "partner_test_mapping",
      entityId: mappingKey,
      oldVal: existing,
      newVal: updated
    });

    return updated;
  }

  // Create brand new mapping
  const newMapping: PartnerTestMapping = {
    id: mappingKey,
    partnerLabId: input.partnerLabId,
    applicability,
    city: singleCity,
    applicableCities: applicability === "selected_cities" ? selectedCities : undefined,
    locationId: input.locationId,
    scopexTestId: test.id,
    scopexTestName: test.name,
    partnerTestName: input.partnerTestName.trim(),
    partnerTestCode: input.partnerTestCode?.trim() || undefined,
    category: input.category || test.category || "General",
    partnerProcessingRate: input.partnerProcessingRate,
    sampleType: input.sampleType || test.specimenType || "Blood",
    tatHours: input.tatHours || test.tat || "12 Hours",
    effectiveFrom: input.effectiveFrom.trim(),
    effectiveTo: input.effectiveTo?.trim() || undefined,
    version: 1,
    status: input.status || "active",
    createdAt: nowIso(),
    updatedAt: nowIso()
  };

  inMemoryPartnerTestMappings.set(mappingKey, newMapping);

  logAuditAction({
    actorEmail: adminUser.email || adminUser.userId || "admin",
    action: "create_partner_test_mapping",
    entityType: "partner_test_mapping",
    entityId: mappingKey,
    newVal: newMapping
  });

  return newMapping;
}

// -----------------------------------------------------------------------------
// BULK EXCEL / CSV VALIDATION & IMPORT ENGINE
// -----------------------------------------------------------------------------

export function generatePartnerTestExcelTemplate(): {
  headers: string[];
  sampleRows: string[][];
  csvContent: string;
} {
  const headers = [
    "SCOPEX Test ID or Test Name",
    "Partner Lab Test Name",
    "Partner Lab Test Code",
    "Test Category",
    "Partner Processing Rate",
    "Sample Type",
    "Reporting TAT",
    "Effective From Date",
    "Effective To Date",
    "Status"
  ];

  const sampleRows = [
    [
      "Complete Blood Count (CBC)",
      "Automated Hemogram (CBC + ESR)",
      "APX-HEM-01",
      "Hematology",
      "140",
      "Whole Blood EDTA",
      "6 Hours",
      "2026-01-01",
      "",
      "Active"
    ],
    [
      "Lipid Profile",
      "Serum Lipid Battery",
      "", // Blank code explicitly supported!
      "Biochemistry",
      "220",
      "Serum",
      "8 Hours",
      "2026-01-01",
      "",
      "Active"
    ],
    [
      "Thyroid Profile (Total T3, Total T4, TSH)",
      "CLIA Thyroid Panel",
      "APX-THY-02",
      "Hormone",
      "180",
      "Serum",
      "12 Hours",
      "2026-01-01",
      "",
      "Active"
    ]
  ];

  const csvContent = [headers.join(","), ...sampleRows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))].join("\n");

  return { headers, sampleRows, csvContent };
}

export function validateBulkPartnerTestUpload(params: {
  partnerLabId: string;
  locationId: string;
  rows: BulkMappingRowInput[];
}): BulkUploadPreview {
  seedInitialPartnerLabDataIfEmpty();

  const { partnerLabId, locationId, rows } = params;
  const lab = inMemoryPartnerLabs.get(partnerLabId);
  if (!lab) throw new Error(`Partner Laboratory with ID "${partnerLabId}" not found.`);
  const loc = lab.locations.find((l) => l.id === locationId);
  if (!loc) throw new Error(`Location "${locationId}" not found for partner "${partnerLabId}".`);

  const results: BulkMappingValidationResult[] = [];
  let validCount = 0;
  let invalidCount = 0;
  let duplicateCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const errors: string[] = [];

    // 1. SCOPEX Test ID or Test Name match
    const testIdent = String(row.scopexTestIdentifier || "").trim();
    if (!testIdent) {
      errors.push("Missing SCOPEX Test ID or Test Name.");
    }

    const matchedTest = testIdent ? findScopexTest(testIdent) : undefined;

    if (testIdent && !matchedTest) {
      errors.push(`SCOPEX Test "${testIdent}" does not exist in SCOPEX Test Master.`);
    }

    // 2. Partner Lab Test Name
    const partnerName = String(row.partnerTestName || "").trim();
    if (!partnerName) {
      errors.push("Partner Lab Test Name is required.");
    }

    // 3. Partner Processing Rate
    const rawRate = Number(row.partnerProcessingRate);
    if (isNaN(rawRate) || rawRate < 0) {
      errors.push("Partner Processing Rate must be a valid non-negative number.");
    }

    // 4. Effective From Date
    const effFrom = String(row.effectiveFrom || "").trim();
    if (!effFrom) {
      errors.push("Effective From Date is required (format YYYY-MM-DD).");
    } else if (isNaN(Date.parse(effFrom))) {
      errors.push("Invalid Effective From Date format.");
    }

    // 5. Effective To Date (Optional)
    const effTo = String(row.effectiveTo || "").trim();
    if (effTo && isNaN(Date.parse(effTo))) {
      errors.push("Invalid Effective To Date format.");
    }
    if (effFrom && effTo && new Date(effTo) < new Date(effFrom)) {
      errors.push("Effective To Date cannot be earlier than Effective From Date.");
    }

    // 6. Duplicate Detection
    let isDuplicate = false;
    let existingMappingId: string | undefined;

    if (matchedTest) {
      const mappingKey = `MAP-${partnerLabId}-${locationId}-${matchedTest.id}`;
      if (inMemoryPartnerTestMappings.has(mappingKey)) {
        isDuplicate = true;
        existingMappingId = mappingKey;
        duplicateCount++;
      }
    }

    const isValid = errors.length === 0;
    if (isValid) validCount++;
    else invalidCount++;

    results.push({
      rowNumber: i + 1,
      isValid,
      input: row,
      normalized: matchedTest
        ? {
            partnerLabId,
            locationId,
            scopexTestId: matchedTest.id,
            scopexTestName: matchedTest.name,
            partnerTestName: partnerName,
            partnerTestCode: row.partnerTestCode ? String(row.partnerTestCode).trim() : undefined,
            category: row.category ? String(row.category).trim() : matchedTest.category,
            partnerProcessingRate: rawRate,
            sampleType: row.sampleType ? String(row.sampleType).trim() : matchedTest.specimenType,
            tatHours: row.tatHours ? String(row.tatHours).trim() : matchedTest.tat,
            effectiveFrom: effFrom,
            effectiveTo: effTo || undefined,
            status: String(row.status || "").toLowerCase() === "inactive" ? "inactive" : "active"
          }
        : undefined,
      errors,
      isDuplicate,
      existingMappingId
    });
  }

  return {
    partnerLabId,
    locationId,
    totalRows: rows.length,
    validCount,
    invalidCount,
    duplicateCount,
    results
  };
}

export function commitBulkPartnerTestImport(params: {
  preview: BulkUploadPreview;
  duplicateStrategy: DuplicateResolutionStrategy;
  adminUser: { email?: string; userId?: string };
}): {
  importedCount: number;
  skippedCount: number;
  updatedCount: number;
  newVersionCount: number;
} {
  let importedCount = 0;
  let skippedCount = 0;
  let updatedCount = 0;
  let newVersionCount = 0;

  for (const item of params.preview.results) {
    if (!item.isValid || !item.normalized) continue;

    const norm = item.normalized;
    const mappingKey = `MAP-${norm.partnerLabId}-${norm.locationId}-${norm.scopexTestId}`;
    const existing = inMemoryPartnerTestMappings.get(mappingKey);

    if (existing) {
      if (params.duplicateStrategy === "skip") {
        skippedCount++;
        continue;
      }

      if (params.duplicateStrategy === "new_version") {
        existing.effectiveTo = norm.effectiveFrom;
        existing.updatedAt = nowIso();

        const newVersion = (existing.version || 1) + 1;
        const record: PartnerTestMapping = {
          id: `${mappingKey}-v${newVersion}`,
          partnerLabId: norm.partnerLabId!,
          locationId: norm.locationId!,
          scopexTestId: norm.scopexTestId!,
          scopexTestName: norm.scopexTestName!,
          partnerTestName: norm.partnerTestName!,
          partnerTestCode: norm.partnerTestCode,
          category: norm.category || "General",
          partnerProcessingRate: norm.partnerProcessingRate!,
          sampleType: norm.sampleType || "Blood",
          tatHours: norm.tatHours || "12 Hours",
          effectiveFrom: norm.effectiveFrom!,
          effectiveTo: norm.effectiveTo,
          version: newVersion,
          status: norm.status || "active",
          createdAt: nowIso(),
          updatedAt: nowIso()
        };

        inMemoryPartnerTestMappings.set(mappingKey, record);
        newVersionCount++;
        importedCount++;
        continue;
      }

      // "update"
      existing.partnerTestName = norm.partnerTestName!;
      existing.partnerTestCode = norm.partnerTestCode;
      existing.category = norm.category || existing.category;
      existing.partnerProcessingRate = norm.partnerProcessingRate!;
      existing.sampleType = norm.sampleType || existing.sampleType;
      existing.tatHours = norm.tatHours || existing.tatHours;
      existing.effectiveFrom = norm.effectiveFrom!;
      existing.effectiveTo = norm.effectiveTo;
      existing.status = norm.status || "active";
      existing.updatedAt = nowIso();

      updatedCount++;
      importedCount++;
      continue;
    }

    // New insertion
    const newRecord: PartnerTestMapping = {
      id: mappingKey,
      partnerLabId: norm.partnerLabId!,
      locationId: norm.locationId!,
      scopexTestId: norm.scopexTestId!,
      scopexTestName: norm.scopexTestName!,
      partnerTestName: norm.partnerTestName!,
      partnerTestCode: norm.partnerTestCode,
      category: norm.category || "General",
      partnerProcessingRate: norm.partnerProcessingRate!,
      sampleType: norm.sampleType || "Blood",
      tatHours: norm.tatHours || "12 Hours",
      effectiveFrom: norm.effectiveFrom!,
      effectiveTo: norm.effectiveTo,
      version: 1,
      status: norm.status || "active",
      createdAt: nowIso(),
      updatedAt: nowIso()
    };

    inMemoryPartnerTestMappings.set(mappingKey, newRecord);
    importedCount++;
  }

  logAuditAction({
    actorEmail: params.adminUser.email || params.adminUser.userId || "admin",
    action: "bulk_import_partner_test_mappings",
    entityType: "partner_test_mapping",
    entityId: `batch_${Date.now()}`,
    newVal: { importedCount, skippedCount, updatedCount, newVersionCount, strategy: params.duplicateStrategy }
  });

  return { importedCount, skippedCount, updatedCount, newVersionCount };
}

// =============================================================================
// PHASE 3 & 4: SAMPLE ASSIGNMENT, BARCODE HANDOVER & 10-STEP LIFECYCLE
// =============================================================================

export function assignSampleToPartnerLab(params: {
  bookingId: string;
  scopexSampleId?: string;
  partnerLabId: string;
  locationId: string;
  adminUser: { email?: string; userId?: string };
  remarks?: string;
}): PartnerSampleRecord {
  seedInitialPartnerLabDataIfEmpty();

  const lab = inMemoryPartnerLabs.get(params.partnerLabId);
  if (!lab) throw new Error(`Partner Laboratory "${params.partnerLabId}" not found.`);
  if (lab.status !== "active") {
    throw new Error(`Partner Laboratory "${lab.name}" is currently ${lab.status}. Only active partners can be assigned.`);
  }

  const loc = lab.locations.find((l) => l.id === params.locationId);
  if (!loc) throw new Error(`Location "${params.locationId}" not found under partner "${lab.name}".`);
  if (loc.status !== "active") {
    throw new Error(`Partner location in ${loc.city} is inactive. Please select an active location.`);
  }

  // Find booking
  const booking = inMemoryBookings.get(params.bookingId);
  if (!booking) throw new Error(`Booking "${params.bookingId}" not found.`);

  const bookingPatients = (booking.booking_patients as any[]) || [];
  const testIds: string[] = [];
  const testNames: string[] = [];

  for (const patient of bookingPatients) {
    for (const item of patient.items || []) {
      if (item.kind === "test") {
        testIds.push(item.id);
        testNames.push(item.name);
      } else if (item.kind === "package" && item.testIds) {
        for (const tid of item.testIds) {
          testIds.push(tid);
          testNames.push(tid);
        }
      }
    }
  }

  // Fallback to sample items if booking patients empty
  if (testIds.length === 0) {
    testIds.push("cbc");
    testNames.push("Complete Blood Count (CBC)");
  }

  // Validate that active test mappings exist for each test at this partner location
  const rateSnapshot: Array<{
    testId: string;
    testName: string;
    processingRate: number;
    mappingVersion: number;
    appliedScope?: RateApplicability;
    appliedScopeDescription?: string;
    appliedRateId?: string;
    appliedCityOrCities?: string;
  }> = [];
  let totalCost = 0;

  for (let i = 0; i < testIds.length; i++) {
    const tid = testIds[i];
    const tname = testNames[i] || tid;

    const resolved = findScopexTest(tid) || findScopexTest(tname);
    const resolvedId = resolved?.id || tid;

    // Apply Rate Priority: Single City -> Selected Cities -> Pan-India
    const resolvedRate = resolveApplicablePartnerRate({
      partnerLabId: params.partnerLabId,
      city: loc.city,
      scopexTestId: resolvedId
    });

    if (!resolvedRate) {
      throw new Error(
        `Cannot assign sample: Test "${tname}" has no active mapping or applicable rate configured for ${lab.name} in ${loc.city} (checked Single City, Selected Cities, and Pan-India). Please configure an active rate in Partner Test Master first.`
      );
    }

    const appliedCitiesStr =
      resolvedRate.appliedScope === "single_city"
        ? (resolvedRate.mapping.city || loc.city)
        : resolvedRate.appliedScope === "selected_cities"
        ? (resolvedRate.mapping.applicableCities || []).join(", ")
        : "Pan-India";

    rateSnapshot.push({
      testId: resolvedId,
      testName: resolvedRate.mapping.scopexTestName,
      processingRate: resolvedRate.rate,
      mappingVersion: resolvedRate.mapping.version || 1,
      appliedScope: resolvedRate.appliedScope,
      appliedScopeDescription: resolvedRate.scopeDescription,
      appliedRateId: resolvedRate.mapping.id,
      appliedCityOrCities: appliedCitiesStr
    });

    totalCost += resolvedRate.rate;
  }

  const sampleId = params.scopexSampleId || `SMP-${Date.now().toString().slice(-6)}`;
  const recordId = `PSMP-${params.bookingId}-${sampleId}`;

  const existingSample = inMemoryPartnerSamples.get(recordId);
  const previousStatus: PartnerSampleStatus = existingSample ? existingSample.status : "Sample Collected";
  const newStatus: PartnerSampleStatus = "Assigned to Partner Lab";

  const historyEntry: PartnerSampleStatusHistory = {
    id: crypto.randomUUID(),
    previousStatus,
    newStatus,
    updatedBy: params.adminUser.email || params.adminUser.userId || "Admin",
    timestamp: nowIso(),
    remarks: params.remarks || `Sample assigned to ${lab.name} (${loc.city})`
  };

  const sampleRecord: PartnerSampleRecord = {
    id: recordId,
    bookingId: params.bookingId,
    bookingNumber: String(booking.booking_number || params.bookingId),
    scopexSampleId: sampleId,
    partnerBarcode: existingSample?.partnerBarcode,
    barcodePhotoUrl: existingSample?.barcodePhotoUrl,
    partnerLabId: params.partnerLabId,
    partnerLabName: lab.name,
    locationId: params.locationId,
    locationCity: loc.city,
    patientName: String(booking.customer_name || "Patient"),
    patientPhone: String(booking.customer_phone || "9826000000"),
    testIds,
    testNames,
    applicableRateSnapshot: rateSnapshot,
    totalProcessingCost: totalCost,
    status: newStatus,
    statusHistory: existingSample ? [historyEntry, ...existingSample.statusHistory] : [historyEntry],
    adminVerified: false,
    createdAt: existingSample ? existingSample.createdAt : nowIso(),
    updatedAt: nowIso()
  };

  inMemoryPartnerSamples.set(recordId, sampleRecord);

  // Update booking record with assigned partner lab
  (booking as any).partner_lab_id = lab.id;
  (booking as any).partner_lab_name = lab.name;
  (booking as any).partner_location_id = loc.id;
  (booking as any).partner_location_city = loc.city;
  (booking as any).partner_assigned_at = nowIso();
  (booking as any).partner_sample_record_id = recordId;

  // Link to collection job if one exists
  for (const job of inMemoryCollectionJobs.values()) {
    if (job.bookingId === params.bookingId) {
      job.updatedAt = nowIso();
    }
  }

  logAuditAction({
    actorEmail: params.adminUser.email || params.adminUser.userId || "admin",
    action: "assign_sample_to_partner",
    entityType: "partner_sample",
    entityId: recordId,
    newVal: sampleRecord
  });

  return sampleRecord;
}

export function reassignPartnerSample(params: {
  sampleRecordId: string;
  newPartnerLabId: string;
  newLocationId: string;
  reason: string;
  adminUser: { email?: string; userId?: string };
}): PartnerSampleRecord {
  seedInitialPartnerLabDataIfEmpty();

  if (!params.reason?.trim()) {
    throw new Error("Reason for changing partner laboratory/location is required.");
  }

  const sample = inMemoryPartnerSamples.get(params.sampleRecordId);
  if (!sample) throw new Error(`Partner sample record "${params.sampleRecordId}" not found.`);

  if (sample.status === "Completed") {
    throw new Error("Cannot reassign a completed partner laboratory sample. Completed historical records are locked.");
  }

  const newLab = inMemoryPartnerLabs.get(params.newPartnerLabId);
  if (!newLab) throw new Error(`Partner Laboratory "${params.newPartnerLabId}" not found.`);
  if (newLab.status !== "active") {
    throw new Error(`Partner Laboratory "${newLab.name}" is currently ${newLab.status}. Only active partners can be selected.`);
  }

  const newLoc = newLab.locations.find((l) => l.id === params.newLocationId);
  if (!newLoc) throw new Error(`Location "${params.newLocationId}" not found under partner "${newLab.name}".`);
  if (newLoc.status !== "active") {
    throw new Error(`Partner location in ${newLoc.city} is inactive. Please select an active location.`);
  }

  // Preserve previous details for audit trail
  const previousPartnerLabId = sample.partnerLabId;
  const previousPartnerLabName = sample.partnerLabName;
  const previousLocationId = sample.locationId;
  const previousLocationCity = sample.locationCity;

  // Re-evaluate tests and rates for the new partner location
  const newRateSnapshot: Array<{
    testId: string;
    testName: string;
    processingRate: number;
    mappingVersion: number;
    appliedScope?: RateApplicability;
    appliedScopeDescription?: string;
    appliedRateId?: string;
    appliedCityOrCities?: string;
  }> = [];
  let newTotalCost = 0;

  for (let i = 0; i < sample.testIds.length; i++) {
    const tid = sample.testIds[i];
    const tname = sample.testNames[i] || tid;

    const resolved = findScopexTest(tid) || findScopexTest(tname);
    const resolvedId = resolved?.id || tid;

    const resolvedRate = resolveApplicablePartnerRate({
      partnerLabId: params.newPartnerLabId,
      city: newLoc.city,
      scopexTestId: resolvedId
    });

    if (!resolvedRate) {
      throw new Error(
        `Cannot reassign sample: Test "${tname}" has no applicable rate configured for ${newLab.name} in ${newLoc.city} (checked Single City, Selected Cities, and Pan-India). Please configure an active rate first.`
      );
    }

    const appliedCitiesStr =
      resolvedRate.appliedScope === "single_city"
        ? (resolvedRate.mapping.city || newLoc.city)
        : resolvedRate.appliedScope === "selected_cities"
        ? (resolvedRate.mapping.applicableCities || []).join(", ")
        : "Pan-India";

    newRateSnapshot.push({
      testId: resolvedId,
      testName: resolvedRate.mapping.scopexTestName,
      processingRate: resolvedRate.rate,
      mappingVersion: resolvedRate.mapping.version || 1,
      appliedScope: resolvedRate.appliedScope,
      appliedScopeDescription: resolvedRate.scopeDescription,
      appliedRateId: resolvedRate.mapping.id,
      appliedCityOrCities: appliedCitiesStr
    });

    newTotalCost += resolvedRate.rate;
  }

  // Update sample record
  sample.partnerLabId = newLab.id;
  sample.partnerLabName = newLab.name;
  sample.locationId = newLoc.id;
  sample.locationCity = newLoc.city;
  sample.applicableRateSnapshot = newRateSnapshot;
  sample.totalProcessingCost = newTotalCost;
  sample.updatedAt = nowIso();

  const historyEntry: PartnerSampleStatusHistory = {
    id: crypto.randomUUID(),
    previousStatus: sample.status,
    newStatus: sample.status,
    updatedBy: params.adminUser.email || params.adminUser.userId || "Admin",
    timestamp: nowIso(),
    remarks: `Reassigned from ${previousPartnerLabName} (${previousLocationCity}) to ${newLab.name} (${newLoc.city}). Reason: ${params.reason.trim()}`
  };
  sample.statusHistory.unshift(historyEntry);

  // Update associated booking
  const booking = inMemoryBookings.get(sample.bookingId);
  if (booking) {
    (booking as any).partner_lab_id = newLab.id;
    (booking as any).partner_lab_name = newLab.name;
    (booking as any).partner_location_id = newLoc.id;
    (booking as any).partner_location_city = newLoc.city;
    (booking as any).partner_reassigned_at = nowIso();
    (booking as any).partner_reassignment_reason = params.reason.trim();
  }

  logAuditAction({
    actorEmail: params.adminUser.email || params.adminUser.userId || "admin",
    action: "reassign_partner_sample",
    entityType: "partner_sample",
    entityId: sample.id,
    oldVal: {
      partnerLabId: previousPartnerLabId,
      partnerLabName: previousPartnerLabName,
      locationId: previousLocationId,
      locationCity: previousLocationCity
    },
    newVal: {
      partnerLabId: newLab.id,
      partnerLabName: newLab.name,
      locationId: newLoc.id,
      locationCity: newLoc.city,
      reason: params.reason.trim(),
      updatedBy: params.adminUser.email || params.adminUser.userId || "Admin"
    }
  });

  return sample;
}

export function recordPartnerLabBarcodeHandover(params: {
  sampleRecordId: string;
  partnerBarcode: string;
  barcodePhotoUrl?: string;
  handoverGpsCoordinates?: { latitude: number; longitude: number };
  performedBy: string;
  remarks?: string;
}): PartnerSampleRecord {
  seedInitialPartnerLabDataIfEmpty();

  const sample = inMemoryPartnerSamples.get(params.sampleRecordId);
  if (!sample) throw new Error(`Partner sample record "${params.sampleRecordId}" not found.`);

  const normBarcode = params.partnerBarcode.trim();
  if (!normBarcode) throw new Error("Partner laboratory barcode / accession number is required.");

  // Prevent duplicate barcode mapping
  for (const other of inMemoryPartnerSamples.values()) {
    if (other.id !== sample.id && other.partnerBarcode && other.partnerBarcode.toLowerCase() === normBarcode.toLowerCase()) {
      throw new Error(`Partner barcode "${normBarcode}" is already linked to SCOPEX Sample ${other.scopexSampleId} (Booking: ${other.bookingNumber}). Duplicate barcode prevented.`);
    }
  }

  const prevStatus = sample.status;
  const nextStatus: PartnerSampleStatus = "Ready for Handover";

  sample.partnerBarcode = normBarcode;
  if (params.barcodePhotoUrl) {
    sample.barcodePhotoUrl = params.barcodePhotoUrl;
  }
  sample.status = nextStatus;
  sample.handoverConfirmedBy = params.performedBy;
  sample.handoverConfirmedAt = nowIso();
  sample.handoverGpsCoordinates = params.handoverGpsCoordinates;
  sample.updatedAt = nowIso();

  sample.statusHistory.unshift({
    id: crypto.randomUUID(),
    previousStatus: prevStatus,
    newStatus: nextStatus,
    updatedBy: params.performedBy,
    timestamp: nowIso(),
    remarks: params.remarks || `Barcode photo uploaded. Partner accession #${normBarcode} registered.`
  });

  logAuditAction({
    actorEmail: params.performedBy,
    action: "record_partner_barcode_handover",
    entityType: "partner_sample",
    entityId: sample.id,
    newVal: { partnerBarcode: normBarcode, barcodePhotoUrl: params.barcodePhotoUrl }
  });

  return sample;
}

export function verifyPartnerSampleHandoverByAdmin(params: {
  sampleRecordId: string;
  correctedPartnerBarcode?: string;
  verified: boolean;
  remarks?: string;
  adminUser: { email?: string; userId?: string };
}): PartnerSampleRecord {
  seedInitialPartnerLabDataIfEmpty();

  const sample = inMemoryPartnerSamples.get(params.sampleRecordId);
  if (!sample) throw new Error(`Partner sample record "${params.sampleRecordId}" not found.`);

  const prevStatus = sample.status;
  const nextStatus: PartnerSampleStatus = params.verified ? "Received by Partner Lab" : "Exception / Rejected";

  if (params.correctedPartnerBarcode && params.correctedPartnerBarcode.trim()) {
    sample.partnerBarcode = params.correctedPartnerBarcode.trim();
  }

  sample.adminVerified = params.verified;
  sample.adminVerifiedBy = params.adminUser.email || params.adminUser.userId || "Admin";
  sample.adminVerifiedAt = nowIso();
  sample.status = nextStatus;
  sample.updatedAt = nowIso();

  if (!params.verified) {
    sample.exceptionType = "Barcode mismatch";
    sample.exceptionRemarks = params.remarks || "Sample handover rejected by Admin verification.";
  }

  sample.statusHistory.unshift({
    id: crypto.randomUUID(),
    previousStatus: prevStatus,
    newStatus: nextStatus,
    updatedBy: sample.adminVerifiedBy,
    timestamp: nowIso(),
    remarks: params.remarks || (params.verified ? "Admin verified partner barcode and sample receipt." : "Sample handover verification failed.")
  });

  return sample;
}

export function updatePartnerSampleStatus(params: {
  sampleRecordId: string;
  newStatus: PartnerSampleStatus;
  remarks?: string;
  exceptionType?: PartnerSampleRecord["exceptionType"];
  adminUser: { email?: string; userId?: string };
}): PartnerSampleRecord {
  seedInitialPartnerLabDataIfEmpty();

  const sample = inMemoryPartnerSamples.get(params.sampleRecordId);
  if (!sample) throw new Error(`Partner sample record "${params.sampleRecordId}" not found.`);

  const prevStatus = sample.status;
  sample.status = params.newStatus;
  sample.updatedAt = nowIso();

  if (params.newStatus === "Exception / Rejected") {
    sample.exceptionType = params.exceptionType || "Sample rejection";
    sample.exceptionRemarks = params.remarks;
  }

  sample.statusHistory.unshift({
    id: crypto.randomUUID(),
    previousStatus: prevStatus,
    newStatus: params.newStatus,
    updatedBy: params.adminUser.email || params.adminUser.userId || "Admin",
    timestamp: nowIso(),
    remarks: params.remarks || `Status transitioned to "${params.newStatus}"`
  });

  return sample;
}

// =============================================================================
// PHASE 5: ADMIN REPORT UPLOAD & PATIENT PUBLICATION
// =============================================================================

export function uploadPartnerLabReport(params: {
  bookingId: string;
  scopexSampleId: string;
  partnerBarcode?: string;
  testNames: string[];
  reportType: "individual" | "combined" | "revised";
  fileUrl: string;
  fileName: string;
  remarks?: string;
  adminUser: { email?: string; userId?: string };
}): PartnerLabReport {
  seedInitialPartnerLabDataIfEmpty();

  const booking = inMemoryBookings.get(params.bookingId);
  const sample = Array.from(inMemoryPartnerSamples.values()).find(
    (s) => s.bookingId === params.bookingId && s.scopexSampleId === params.scopexSampleId
  );

  const reportId = `REP-${params.bookingId}-${params.scopexSampleId}`;
  const existingReport = inMemoryPartnerReports.get(reportId);

  const uploader = params.adminUser.email || params.adminUser.userId || "Admin";
  const timestamp = nowIso();

  if (existingReport) {
    const newVersionNum = existingReport.versionHistory.length + 1;
    existingReport.versionHistory.unshift({
      version: newVersionNum,
      fileUrl: params.fileUrl,
      fileName: params.fileName,
      uploadedBy: uploader,
      uploadedAt: timestamp,
      remarks: params.remarks || `Revised report v${newVersionNum} uploaded.`
    });

    existingReport.currentFileUrl = params.fileUrl;
    existingReport.currentFileName = params.fileName;
    existingReport.status = "Pending Verification";
    existingReport.reportType = "revised";
    existingReport.updatedAt = timestamp;

    if (sample) {
      updatePartnerSampleStatus({
        sampleRecordId: sample.id,
        newStatus: "Report Uploaded",
        remarks: `Revised PDF Report v${newVersionNum} uploaded.`,
        adminUser: params.adminUser
      });
    }

    return existingReport;
  }

  const newReport: PartnerLabReport = {
    id: reportId,
    bookingId: params.bookingId,
    bookingNumber: booking ? String(booking.booking_number) : params.bookingId,
    scopexSampleId: params.scopexSampleId,
    partnerBarcode: params.partnerBarcode || sample?.partnerBarcode,
    patientName: booking ? String(booking.customer_name) : "Patient",
    patientPhone: booking ? String(booking.customer_phone) : "9826000000",
    testNames: params.testNames,
    partnerLabId: sample?.partnerLabId || "PLAB-001",
    reportType: params.reportType,
    currentFileUrl: params.fileUrl,
    currentFileName: params.fileName,
    status: "Pending Verification",
    versionHistory: [
      {
        version: 1,
        fileUrl: params.fileUrl,
        fileName: params.fileName,
        uploadedBy: uploader,
        uploadedAt: timestamp,
        remarks: params.remarks || "Initial report PDF uploaded."
      }
    ],
    createdAt: timestamp,
    updatedAt: timestamp
  };

  inMemoryPartnerReports.set(reportId, newReport);

  if (sample) {
    updatePartnerSampleStatus({
      sampleRecordId: sample.id,
      newStatus: "Report Uploaded",
      remarks: "Diagnostic report uploaded by Admin.",
      adminUser: params.adminUser
    });
  }

  return newReport;
}

export function verifyAndPublishPartnerReport(params: {
  reportId: string;
  action: "verify" | "reject" | "publish";
  remarks?: string;
  adminUser: { email?: string; userId?: string };
}): PartnerLabReport {
  seedInitialPartnerLabDataIfEmpty();

  const report = inMemoryPartnerReports.get(params.reportId);
  if (!report) throw new Error(`Report "${params.reportId}" not found.`);

  const actor = params.adminUser.email || params.adminUser.userId || "Admin";
  const timestamp = nowIso();

  if (params.action === "verify") {
    report.status = "Verified";
    report.verifiedBy = actor;
    report.verifiedAt = timestamp;
  } else if (params.action === "publish") {
    if (report.status !== "Verified" && report.status !== "Pending Verification") {
      throw new Error(`Cannot publish report in "${report.status}" status. Report must be verified first.`);
    }
    report.status = "Published to Patient";
    report.verifiedBy = report.verifiedBy || actor;
    report.verifiedAt = report.verifiedAt || timestamp;
    report.publishedAt = timestamp;

    // Update booking report state
    const booking = inMemoryBookings.get(report.bookingId);
    if (booking) {
      booking.booking_status = "completed";
      booking.updated_at = timestamp;
    }
  } else if (params.action === "reject") {
    report.status = "Awaiting Report";
    report.rejectionRemarks = params.remarks || "Report rejected by verification team.";
  }

  report.updatedAt = timestamp;
  return report;
}

// =============================================================================
// PHASE 6: FINANCIAL RECONCILIATION & DASHBOARD FORMULAS
// =============================================================================

export function calculatePartnerFinancialMetrics(params?: {
  partnerLabId?: string;
  city?: string;
  startDate?: string;
  endDate?: string;
  allocationMode?: RevenueAllocationMode;
}) {
  seedInitialPartnerLabDataIfEmpty();

  const samples = Array.from(inMemoryPartnerSamples.values()).filter((s) => {
    if (params?.partnerLabId && params.partnerLabId !== "all" && s.partnerLabId !== params.partnerLabId) return false;
    if (params?.city && params.city !== "all" && s.locationCity.toLowerCase() !== params.city.toLowerCase()) return false;
    if (params?.startDate && new Date(s.createdAt) < new Date(params.startDate)) return false;
    if (params?.endDate && new Date(s.createdAt) > new Date(params.endDate)) return false;
    return true;
  });

  const totalAssigned = samples.length;
  const totalReceived = samples.filter((s) => !["Sample Collected", "Assigned to Partner Lab"].includes(s.status)).length;
  const totalProcessed = samples.filter((s) => ["Processing", "Completed", "Report Uploaded"].includes(s.status)).length;

  // Partner Processing Cost using applicable historical rates saved at assignment
  const totalPartnerCost = samples.reduce((sum, s) => sum + (s.totalProcessingCost || 0), 0);

  // Net Patient Revenue: Actual collected patient payments − refunds (excluding unpaid/failed)
  let grossSellingValue = 0;
  let totalDiscounts = 0;
  let totalRefunds = 0;
  let netPatientRevenue = 0;

  const countedBookingIds = new Set<string>();

  for (const s of samples) {
    if (countedBookingIds.has(s.bookingId)) continue;
    countedBookingIds.add(s.bookingId);

    const booking = inMemoryBookings.get(s.bookingId);
    if (!booking) continue;

    // Only count confirmed & paid or cod completed bookings
    const isPaid = booking.payment_status === "paid" || (booking.payment_method === "cod" && booking.booking_status === "completed");
    if (!isPaid) continue;

    const payable = Number(booking.payable_amount || 0);
    const subtotal = Number(booking.subtotal || payable);
    const discount = Number(booking.bundle_discount || 0);

    grossSellingValue += subtotal;
    totalDiscounts += discount;
    netPatientRevenue += payable;
  }

  // Invoice & Payment totals
  const invoices = Array.from(inMemoryPartnerInvoices.values()).filter((inv) => {
    if (params?.partnerLabId && params.partnerLabId !== "all" && inv.partnerLabId !== params.partnerLabId) return false;
    return true;
  });

  const totalPartnerPayable = invoices.reduce((sum, inv) => sum + (inv.approvedAmount || 0), 0);
  const totalPaymentsMade = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  const outstandingPayable = totalPartnerPayable - totalPaymentsMade;

  // Formula: Gross Profit = Net Patient Revenue − Partner Lab Processing Cost
  const grossProfit = netPatientRevenue - totalPartnerCost;
  const grossMarginPercent = netPatientRevenue > 0 ? Math.round((grossProfit / netPatientRevenue) * 1000) / 10 : 0;

  return {
    kpis: {
      totalSamplesAssigned: totalAssigned,
      totalSamplesReceived: totalReceived,
      totalTestsProcessed: totalProcessed,
      grossSellingValue,
      totalDiscounts,
      totalRefunds,
      netPatientRevenue,
      totalPartnerCost,
      totalPartnerPayable,
      totalPaymentsMade,
      outstandingPayable,
      grossProfit,
      grossMarginPercent: netPatientRevenue > 0 ? grossMarginPercent : "N/A"
    },
    samplesCount: samples.length,
    invoicesCount: invoices.length
  };
}

// -----------------------------------------------------------------------------
// PACKAGE REVENUE PROPORTIONAL ALLOCATION
// -----------------------------------------------------------------------------
export function allocatePackageRevenueProportionally(
  netPackageRevenue: number,
  tests: Array<{ testId: string; sellingPrice: number }>
): Array<{ testId: string; allocatedRevenue: number }> {
  if (!tests || tests.length === 0) return [];

  const totalIndividualSelling = tests.reduce((sum, t) => sum + t.sellingPrice, 0);

  if (totalIndividualSelling === 0) {
    const equalShare = Math.round((netPackageRevenue / tests.length) * 100) / 100;
    return tests.map((t) => ({ testId: t.testId, allocatedRevenue: equalShare }));
  }

  let runningSum = 0;
  const allocations = tests.map((t, idx) => {
    if (idx === tests.length - 1) {
      // Last test absorbs rounding difference so sum equals netPackageRevenue exactly
      return { testId: t.testId, allocatedRevenue: Math.round((netPackageRevenue - runningSum) * 100) / 100 };
    }
    const share = Math.round((netPackageRevenue * (t.sellingPrice / totalIndividualSelling)) * 100) / 100;
    runningSum += share;
    return { testId: t.testId, allocatedRevenue: share };
  });

  return allocations;
}

// =============================================================================
// PHASE 7 & 8: PARTNER INVOICE AND PAYMENT MANAGEMENT
// =============================================================================

export function recordPartnerInvoice(
  input: {
    partnerLabId: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate?: string;
    relatedBookingIds?: string[];
    relatedSampleIds?: string[];
    invoiceAmount: number;
    remarks?: string;
    invoicePdfUrl?: string;
  },
  adminUser: { email?: string; userId?: string }
): PartnerInvoice {
  seedInitialPartnerLabDataIfEmpty();

  const lab = inMemoryPartnerLabs.get(input.partnerLabId);
  if (!lab) throw new Error(`Partner Laboratory "${input.partnerLabId}" not found.`);

  const normInvoiceNum = input.invoiceNumber.trim();
  if (!normInvoiceNum) throw new Error("Invoice Number is required.");

  // Validation: Check for duplicate invoice numbers
  for (const inv of inMemoryPartnerInvoices.values()) {
    if (inv.partnerLabId === input.partnerLabId && inv.invoiceNumber.toLowerCase() === normInvoiceNum.toLowerCase()) {
      throw new Error(`Duplicate Invoice Number: Invoice "${normInvoiceNum}" already exists for ${lab.name}.`);
    }
  }

  const discrepancies: PartnerInvoiceDiscrepancy[] = [];
  let calculatedExpectedCost = 0;

  // Reconcile against related samples & configured rates
  if (input.relatedSampleIds && input.relatedSampleIds.length > 0) {
    for (const sid of input.relatedSampleIds) {
      const sample = Array.from(inMemoryPartnerSamples.values()).find(
        (s) => s.scopexSampleId === sid || s.id === sid
      );

      if (!sample) {
        discrepancies.push({
          type: "missing_sample",
          message: `Sample ID "${sid}" is listed on invoice but does not exist in SCOPEX sample records.`,
          sampleId: sid
        });
      } else if (sample.partnerLabId !== input.partnerLabId) {
        discrepancies.push({
          type: "unassigned_sample",
          message: `Sample ID "${sid}" was assigned to ${sample.partnerLabName}, not to ${lab.name}.`,
          sampleId: sid
        });
      } else if (sample.status === "Exception / Rejected") {
        discrepancies.push({
          type: "rejected_sample_charge",
          message: `Sample ID "${sid}" was rejected/cancelled; partner processing fee is not payable.`,
          sampleId: sid
        });
      } else {
        calculatedExpectedCost += sample.totalProcessingCost;
      }
    }

    if (calculatedExpectedCost > 0 && Math.abs(calculatedExpectedCost - input.invoiceAmount) > 2) {
      discrepancies.push({
        type: "amount_mismatch",
        message: `Invoice amount ₹${input.invoiceAmount} does not match expected historical rate total ₹${calculatedExpectedCost}.`,
        expectedAmount: calculatedExpectedCost,
        chargedAmount: input.invoiceAmount
      });
    }
  }

  const invoiceId = `INV-${input.partnerLabId}-${Date.now().toString().slice(-6)}`;
  const approvedAmount = discrepancies.length === 0 ? input.invoiceAmount : 0;
  const initialStatus: PartnerInvoiceStatus = discrepancies.length > 0 ? "Under Review" : "Approved";

  const newInvoice: PartnerInvoice = {
    id: invoiceId,
    partnerLabId: input.partnerLabId,
    partnerLabName: lab.name,
    invoiceNumber: normInvoiceNum,
    invoiceDate: input.invoiceDate,
    dueDate: input.dueDate || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split("T")[0],
    relatedBookingIds: input.relatedBookingIds || [],
    relatedSampleIds: input.relatedSampleIds || [],
    invoiceAmount: input.invoiceAmount,
    approvedAmount,
    rejectedAmount: discrepancies.length > 0 ? input.invoiceAmount : 0,
    paidAmount: 0,
    outstandingAmount: approvedAmount,
    status: initialStatus,
    invoicePdfUrl: input.invoicePdfUrl,
    remarks: input.remarks,
    discrepancies,
    payments: [],
    createdAt: nowIso(),
    updatedAt: nowIso()
  };

  inMemoryPartnerInvoices.set(invoiceId, newInvoice);

  logAuditAction({
    actorEmail: adminUser.email || adminUser.userId || "admin",
    action: "create_partner_invoice",
    entityType: "partner_invoice",
    entityId: invoiceId,
    newVal: newInvoice
  });

  return newInvoice;
}

export function recordPartnerPayment(
  input: {
    invoiceId: string;
    paymentAmount: number;
    paymentDate: string;
    paymentMode: PartnerPaymentRecord["paymentMode"];
    transactionReference: string;
    receiptUrl?: string;
    remarks?: string;
  },
  adminUser: { email?: string; userId?: string }
): PartnerPaymentRecord {
  seedInitialPartnerLabDataIfEmpty();

  const invoice = inMemoryPartnerInvoices.get(input.invoiceId);
  if (!invoice) throw new Error(`Invoice with ID "${input.invoiceId}" not found.`);

  if (input.paymentAmount <= 0) {
    throw new Error("Payment Amount must be greater than zero.");
  }

  // Prevent duplicate payment transaction references
  for (const pay of invoice.payments) {
    if (pay.transactionReference.trim().toLowerCase() === input.paymentMode.toLowerCase()) {
      throw new Error(`Transaction reference "${input.transactionReference}" is already recorded.`);
    }
  }

  const paymentId = `PAY-${Date.now().toString().slice(-6)}`;
  const payment: PartnerPaymentRecord = {
    id: paymentId,
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    partnerLabId: invoice.partnerLabId,
    paymentAmount: input.paymentAmount,
    paymentDate: input.paymentDate,
    paymentMode: input.paymentMode,
    transactionReference: input.transactionReference.trim(),
    receiptUrl: input.receiptUrl,
    remarks: input.remarks,
    recordedBy: adminUser.email || adminUser.userId || "Finance",
    createdAt: nowIso()
  };

  invoice.payments.unshift(payment);
  inMemoryPartnerPayments.unshift(payment);

  invoice.paidAmount += input.paymentAmount;
  invoice.outstandingAmount = Math.max(0, invoice.approvedAmount - invoice.paidAmount);

  if (invoice.outstandingAmount === 0 && invoice.approvedAmount > 0) {
    invoice.status = "Paid";
  } else if (invoice.paidAmount > 0) {
    invoice.status = "Partially Paid";
  }

  invoice.updatedAt = nowIso();

  logAuditAction({
    actorEmail: adminUser.email || adminUser.userId || "Finance",
    action: "record_partner_payment",
    entityType: "partner_payment",
    entityId: paymentId,
    newVal: payment
  });

  return payment;
}
