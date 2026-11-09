import crypto from "crypto";
import { inMemoryBookings, inMemoryPhlebotomists as rawPhlebList } from "@/lib/backend-service";
import { inMemoryLeads, type LeadRecord } from "@/lib/crm-service";

// =============================================================================
// 1. TYPES & DATA CONTRACTS
// =============================================================================

export type PhlebotomistShift = "morning" | "evening" | "full_day";

export type PhlebotomistSkill =
  | "venipuncture"
  | "pediatric_venipuncture"
  | "geriatric_care"
  | "fasting_metabolic"
  | "swab_collection"
  | "vacutainer_handling"
  | "cold_chain";

export type PhlebotomistStatus = "available" | "busy" | "on_leave" | "offline";

export type PhlebotomistProfile = {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  pincodes: string[];
  serviceAreas: string[];
  status: PhlebotomistStatus;
  shift: PhlebotomistShift;
  skills: PhlebotomistSkill[];
  maxDailySlots: number;
  assignedCount: number;
  rating: number;
  vehicleType: "two_wheeler" | "four_wheeler" | "transit";
  active: boolean;
};

export type CollectionJobStatus =
  | "Assigned"
  | "Accepted"
  | "En Route"
  | "Arrived"
  | "Collected"
  | "Completed"
  | "Exception";

export const ALL_COLLECTION_STATUSES: CollectionJobStatus[] = [
  "Assigned",
  "Accepted",
  "En Route",
  "Arrived",
  "Collected",
  "Completed",
  "Exception"
];

export type SampleVialRecord = {
  tubeType: "EDTA (Purple)" | "SST / Serum (Yellow/Red)" | "Fluoride (Grey)" | "Citrate (Blue)" | "Urine Container";
  count: number;
  barcode: string;
  testName: string;
};

export type JobStatusHistoryEntry = {
  status: CollectionJobStatus;
  timestamp: string;
  performedBy: string;
  notes?: string;
  metadata?: Record<string, unknown>;
};

export type CollectionJob = {
  id: string;
  bookingId: string;
  bookingNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  patientName: string;
  patientPhone: string;
  patientAge?: string | number;
  patientGender?: string;
  patientRelation?: string;
  address: string;
  pincode: string;
  city: string;
  scheduledDate: string;
  scheduledTime: string;
  slotWindow: "morning" | "evening" | "any";
  requiredSkills: PhlebotomistSkill[];
  sampleRequirements: Array<{
    name: string;
    sampleType: string;
    fastingRequired: boolean;
    containerType: string;
  }>;
  specialInstructions?: string;
  phlebotomistId: string | null;
  phlebotomistName: string | null;
  phlebotomistPhone: string | null;
  status: CollectionJobStatus;
  statusHistory: JobStatusHistoryEntry[];
  // Timestamps
  assignedAt?: string | null;
  acceptedAt?: string | null;
  enRouteAt?: string | null;
  arrivedAt?: string | null;
  collectedAt?: string | null;
  completedAt?: string | null;
  exceptionAt?: string | null;
  // Execution notes and diagnostics
  declineReason?: string | null;
  exceptionReason?: string | null;
  collectionNotes?: string | null;
  barcodes?: string[];
  vialsCollected?: SampleVialRecord[];
  temperatureVerified?: boolean;
  fastingStatusVerified?: boolean;
  fastingHoursReported?: number;
  // Allocation metadata
  allocationMode: "auto" | "manual" | "unassigned";
  inExceptionQueue: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * Restricted Patient Info View for Phlebotomist
 * PRIVACY RULE: Exposes only patient clinical & visit logistics.
 * Excludes billing numbers, profit margins, coupon codes, and internal admin data.
 */
export type PhlebotomistRestrictedPatientView = {
  jobId: string;
  bookingNumber: string;
  status: CollectionJobStatus;
  patientName: string;
  patientPhone: string;
  patientAge?: string | number;
  patientGender?: string;
  address: string;
  pincode: string;
  city: string;
  scheduledDate: string;
  scheduledTime: string;
  requiredSkills: PhlebotomistSkill[];
  sampleRequirements: Array<{
    name: string;
    sampleType: string;
    fastingRequired: boolean;
    containerType: string;
  }>;
  specialInstructions?: string;
  assignedAt?: string | null;
  acceptedAt?: string | null;
  enRouteAt?: string | null;
  arrivedAt?: string | null;
  collectedAt?: string | null;
  completedAt?: string | null;
  exceptionAt?: string | null;
  collectionNotes?: string | null;
  barcodes?: string[];
  fastingStatusVerified?: boolean;
  temperatureVerified?: boolean;
};

export type CustomerCareCallRecord = {
  id: string;
  targetId: string; // leadId or bookingId
  targetKind: "lead" | "booking";
  callType: "outbound" | "inbound";
  outcome: "connected_interested" | "connected_rescheduled" | "connected_query" | "busy" | "not_reachable" | "wrong_number";
  durationSeconds: number;
  notes: string;
  scheduledFollowUpDate?: string;
  performedBy: string;
  createdAt: string;
};

export type CustomerCareMessageRecord = {
  id: string;
  targetId: string;
  targetKind: "lead" | "booking";
  channel: "whatsapp" | "sms" | "email";
  templateTitle: string;
  messageContent: string;
  deliveryStatus: "sent" | "delivered" | "failed";
  performedBy: string;
  createdAt: string;
};

// =============================================================================
// 2. IN-MEMORY STORES (SEEDED WITH EXPERIENCED PHLEBOTOMISTS)
// =============================================================================

export const inMemoryPhlebotomistTeam: Map<string, PhlebotomistProfile> = new Map([
  [
    "phleb-001",
    {
      id: "phleb-001",
      name: "Ramesh Sharma",
      phone: "9876543210",
      email: "ramesh.phleb@scopexdiagnostics.in",
      city: "Indore",
      pincodes: ["452001", "452010", "452011", "452012"],
      serviceAreas: ["Vijay Nagar", "Palasia", "MG Road"],
      status: "available",
      shift: "morning", // 06:00 - 14:00
      skills: ["venipuncture", "pediatric_venipuncture", "geriatric_care", "fasting_metabolic", "cold_chain"],
      maxDailySlots: 15,
      assignedCount: 3,
      rating: 4.95,
      vehicleType: "two_wheeler",
      active: true
    }
  ],
  [
    "phleb-002",
    {
      id: "phleb-002",
      name: "Anil Verma",
      phone: "9876543211",
      email: "anil.phleb@scopexdiagnostics.in",
      city: "Indore",
      pincodes: ["452001", "452003", "452016"],
      serviceAreas: ["Old Palasia", "Bhawarkua", "Rau"],
      status: "available",
      shift: "evening", // 13:00 - 21:00
      skills: ["venipuncture", "geriatric_care", "vacutainer_handling", "swab_collection"],
      maxDailySlots: 12,
      assignedCount: 2,
      rating: 4.88,
      vehicleType: "two_wheeler",
      active: true
    }
  ],
  [
    "phleb-003",
    {
      id: "phleb-003",
      name: "Sunita Patel",
      phone: "9876543212",
      email: "sunita.phleb@scopexdiagnostics.in",
      city: "Indore",
      pincodes: ["452001", "452010", "452011", "452018"],
      serviceAreas: ["AB Road", "Geeta Bhawan", "Vijay Nagar", "MG Road"],
      status: "available",
      shift: "full_day", // 06:00 - 20:00
      skills: ["venipuncture", "pediatric_venipuncture", "fasting_metabolic", "cold_chain", "swab_collection"],
      maxDailySlots: 18,
      assignedCount: 4,
      rating: 4.98,
      vehicleType: "two_wheeler",
      active: true
    }
  ],
  [
    "phleb-004",
    {
      id: "phleb-004",
      name: "Vikas Joshi",
      phone: "9876543213",
      email: "vikas.phleb@scopexdiagnostics.in",
      city: "Bhopal",
      pincodes: ["462001", "462016", "462022"],
      serviceAreas: ["MP Nagar", "Arera Colony", "Kolar Road"],
      status: "available",
      shift: "morning",
      skills: ["venipuncture", "geriatric_care", "fasting_metabolic", "cold_chain"],
      maxDailySlots: 14,
      assignedCount: 2,
      rating: 4.9,
      vehicleType: "two_wheeler",
      active: true
    }
  ],
  [
    "phleb-005",
    {
      id: "phleb-005",
      name: "Pooja Trivedi",
      phone: "9876543214",
      email: "pooja.phleb@scopexdiagnostics.in",
      city: "Lucknow",
      pincodes: ["226001", "226010", "226024"],
      serviceAreas: ["Hazratganj", "Gomti Nagar", "Aliganj"],
      status: "available",
      shift: "full_day",
      skills: ["venipuncture", "pediatric_venipuncture", "swab_collection", "cold_chain"],
      maxDailySlots: 15,
      assignedCount: 3,
      rating: 4.92,
      vehicleType: "two_wheeler",
      active: true
    }
  ],
  [
    "phleb-006",
    {
      id: "phleb-006",
      name: "Devendra Rao (On Leave)",
      phone: "9876543215",
      email: "devendra.phleb@scopexdiagnostics.in",
      city: "Indore",
      pincodes: ["452001", "452010"],
      serviceAreas: ["Vijay Nagar"],
      status: "on_leave",
      shift: "morning",
      skills: ["venipuncture", "pediatric_venipuncture"],
      maxDailySlots: 10,
      assignedCount: 0,
      rating: 4.7,
      vehicleType: "two_wheeler",
      active: true
    }
  ]
]);

export const inMemoryCollectionJobs: Map<string, CollectionJob> = new Map();
export const inMemoryCustomerCareCalls: CustomerCareCallRecord[] = [];
export const inMemoryCustomerCareMessages: CustomerCareMessageRecord[] = [];

function nowIso(): string {
  return new Date().toISOString();
}

// =============================================================================
// 3. SEEDING & HELPER UTILITIES
// =============================================================================

export function deriveSlotWindow(timeSlotStr: string): "morning" | "evening" | "any" {
  if (!timeSlotStr) return "morning";
  const s = timeSlotStr.toLowerCase();
  if (s.includes("am") || s.includes("06:") || s.includes("07:") || s.includes("08:") || s.includes("09:") || s.includes("10:") || s.includes("11:")) {
    return "morning";
  }
  if (s.includes("pm") || s.includes("13:") || s.includes("14:") || s.includes("15:") || s.includes("16:") || s.includes("17:") || s.includes("18:") || s.includes("19:")) {
    return "evening";
  }
  return "any";
}

export function deriveRequiredSkills(params: {
  patientAge?: string | number;
  testNames?: string[];
  fastingRequired?: boolean;
}): PhlebotomistSkill[] {
  const skills: Set<PhlebotomistSkill> = new Set(["venipuncture"]);

  const ageNum = Number(params.patientAge);
  if (!isNaN(ageNum)) {
    if (ageNum < 14) {
      skills.add("pediatric_venipuncture");
    } else if (ageNum >= 70) {
      skills.add("geriatric_care");
    }
  }

  if (params.fastingRequired) {
    skills.add("fasting_metabolic");
  }

  if (params.testNames && params.testNames.length > 0) {
    for (const name of params.testNames) {
      const lower = name.toLowerCase();
      if (lower.includes("covid") || lower.includes("rt-pcr") || lower.includes("swab") || lower.includes("culture")) {
        skills.add("swab_collection");
      }
      if (lower.includes("glucose") || lower.includes("lipid") || lower.includes("insulin") || lower.includes("thyroid")) {
        skills.add("fasting_metabolic");
      }
      if (lower.includes("cbc") || lower.includes("profile") || lower.includes("panel")) {
        skills.add("cold_chain");
      }
    }
  }

  return Array.from(skills);
}

export function seedInitialJobsIfEmpty() {
  if (inMemoryCollectionJobs.size > 0) return;

  const sampleJobs: Partial<CollectionJob>[] = [
    {
      bookingNumber: "SCX-2026-881234",
      customerName: "Kavita Singhal",
      customerPhone: "9826012345",
      patientName: "Kavita Singhal",
      patientPhone: "9826012345",
      patientAge: 42,
      patientGender: "Female",
      address: "House 24, Scheme 54, Near Meghdoot Garden, Vijay Nagar",
      pincode: "452010",
      city: "Indore",
      scheduledDate: new Date().toISOString().split("T")[0],
      scheduledTime: "07:30 AM - 08:30 AM",
      slotWindow: "morning",
      requiredSkills: ["venipuncture", "fasting_metabolic", "cold_chain"],
      sampleRequirements: [
        { name: "Complete Blood Count (CBC)", sampleType: "Whole Blood (EDTA)", fastingRequired: false, containerType: "EDTA (Purple)" },
        { name: "Fasting Blood Sugar (FBS)", sampleType: "Fluoride Plasma", fastingRequired: true, containerType: "Fluoride (Grey)" },
        { name: "Lipid Profile", sampleType: "Serum", fastingRequired: true, containerType: "SST / Serum (Yellow/Red)" }
      ],
      specialInstructions: "Patient has 12 hours fasting. Ring the front doorbell once.",
      phlebotomistId: "phleb-001",
      phlebotomistName: "Ramesh Sharma",
      phlebotomistPhone: "9876543210",
      status: "Assigned",
      allocationMode: "auto",
      inExceptionQueue: false
    },
    {
      bookingNumber: "SCX-2026-904321",
      customerName: "Rajesh Malhotra",
      customerPhone: "9826099887",
      patientName: "Aarav Malhotra (Child)",
      patientPhone: "9826099887",
      patientAge: 6,
      patientGender: "Male",
      address: "Flat 402, Royal Residency, Palasia",
      pincode: "452001",
      city: "Indore",
      scheduledDate: new Date().toISOString().split("T")[0],
      scheduledTime: "08:00 AM - 09:00 AM",
      slotWindow: "morning",
      requiredSkills: ["venipuncture", "pediatric_venipuncture", "cold_chain"],
      sampleRequirements: [
        { name: "Pediatric CBC & Peripheral Smear", sampleType: "Whole Blood", fastingRequired: false, containerType: "EDTA (Purple)" }
      ],
      specialInstructions: "Pediatric draw. Please use butterfly needle (23G).",
      phlebotomistId: "phleb-001",
      phlebotomistName: "Ramesh Sharma",
      phlebotomistPhone: "9876543210",
      status: "Accepted",
      allocationMode: "manual",
      inExceptionQueue: false
    },
    {
      bookingNumber: "SCX-2026-663219",
      customerName: "Vimla Devi",
      customerPhone: "9826055443",
      patientName: "Vimla Devi (Senior Citizen)",
      patientPhone: "9826055443",
      patientAge: 78,
      patientGender: "Female",
      address: "B-12, Old Town, Jawahar Marg",
      pincode: "452003",
      city: "Indore",
      scheduledDate: new Date().toISOString().split("T")[0],
      scheduledTime: "02:30 PM - 03:30 PM",
      slotWindow: "evening",
      requiredSkills: ["venipuncture", "geriatric_care", "cold_chain"],
      sampleRequirements: [
        { name: "Kidney Function Test (KFT)", sampleType: "Serum", fastingRequired: false, containerType: "SST / Serum (Yellow/Red)" },
        { name: "Electrolytes Panel", sampleType: "Serum", fastingRequired: false, containerType: "SST / Serum (Yellow/Red)" }
      ],
      specialInstructions: "Senior patient bedridden, ground floor room.",
      phlebotomistId: "phleb-002",
      phlebotomistName: "Anil Verma",
      phlebotomistPhone: "9876543211",
      status: "En Route",
      allocationMode: "auto",
      inExceptionQueue: false
    }
  ];

  for (const s of sampleJobs) {
    const id = crypto.randomUUID();
    const timestamp = nowIso();
    const job: CollectionJob = {
      id,
      bookingId: crypto.randomUUID(),
      bookingNumber: s.bookingNumber || `SCX-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      customerName: s.customerName || "Customer",
      customerPhone: s.customerPhone || "9826000000",
      customerEmail: s.customerEmail || null,
      patientName: s.patientName || s.customerName || "Patient",
      patientPhone: s.patientPhone || s.customerPhone || "9826000000",
      patientAge: s.patientAge,
      patientGender: s.patientGender,
      patientRelation: s.patientRelation || "Self",
      address: s.address || "Main Street",
      pincode: s.pincode || "452001",
      city: s.city || "Indore",
      scheduledDate: s.scheduledDate || new Date().toISOString().split("T")[0],
      scheduledTime: s.scheduledTime || "08:00 AM - 09:00 AM",
      slotWindow: s.slotWindow || "morning",
      requiredSkills: s.requiredSkills || ["venipuncture"],
      sampleRequirements: s.sampleRequirements || [],
      specialInstructions: s.specialInstructions,
      phlebotomistId: s.phlebotomistId || null,
      phlebotomistName: s.phlebotomistName || null,
      phlebotomistPhone: s.phlebotomistPhone || null,
      status: (s.status as CollectionJobStatus) || "Assigned",
      statusHistory: [
        {
          status: (s.status as CollectionJobStatus) || "Assigned",
          timestamp,
          performedBy: "System Dispatcher",
          notes: "Initial collection job scheduled"
        }
      ],
      assignedAt: timestamp,
      acceptedAt: s.status === "Accepted" || s.status === "En Route" ? timestamp : null,
      enRouteAt: s.status === "En Route" ? timestamp : null,
      allocationMode: s.allocationMode || "auto",
      inExceptionQueue: Boolean(s.inExceptionQueue),
      createdAt: timestamp,
      updatedAt: timestamp
    };

    inMemoryCollectionJobs.set(id, job);
  }
}

// =============================================================================
// 4. RESTRICTED PRIVACY VIEW FOR PHLEBOTOMIST
// =============================================================================

export function getPhlebotomistJobView(job: CollectionJob): PhlebotomistRestrictedPatientView {
  return {
    jobId: job.id,
    bookingNumber: job.bookingNumber,
    status: job.status,
    patientName: job.patientName,
    patientPhone: job.patientPhone,
    patientAge: job.patientAge,
    patientGender: job.patientGender,
    address: job.address,
    pincode: job.pincode,
    city: job.city,
    scheduledDate: job.scheduledDate,
    scheduledTime: job.scheduledTime,
    requiredSkills: job.requiredSkills,
    sampleRequirements: job.sampleRequirements,
    specialInstructions: job.specialInstructions,
    assignedAt: job.assignedAt,
    acceptedAt: job.acceptedAt,
    enRouteAt: job.enRouteAt,
    arrivedAt: job.arrivedAt,
    collectedAt: job.collectedAt,
    completedAt: job.completedAt,
    exceptionAt: job.exceptionAt,
    collectionNotes: job.collectionNotes,
    barcodes: job.barcodes,
    fastingStatusVerified: job.fastingStatusVerified,
    temperatureVerified: job.temperatureVerified
  };
}

// =============================================================================
// 5. AUTOMATIC ALLOCATION ENGINE
// =============================================================================

export type AllocationResult = {
  success: boolean;
  assignedPhlebotomist: PhlebotomistProfile | null;
  allocationMode: "auto" | "manual" | "unassigned";
  ruleEvaluations: {
    serviceAreaAndPincodeMatched: boolean;
    collectionSlotAndShiftMatched: boolean;
    staffAvailabilityPassed: boolean;
    skillsVerificationPassed: boolean;
    workloadLimitPassed: boolean;
    duplicateCheckPassed: boolean;
  };
  reason: string;
};

export function runAutomaticAllocation(params: {
  city: string;
  pincode: string;
  scheduledTime: string;
  slotWindow?: "morning" | "evening" | "any";
  requiredSkills?: PhlebotomistSkill[];
  excludePhlebotomistId?: string; // e.g. after a decline
  currentJobId?: string;
}): AllocationResult {
  const normCity = params.city.trim().toLowerCase();
  const normPin = params.pincode.trim();
  const slotWindow = params.slotWindow || deriveSlotWindow(params.scheduledTime);
  const requiredSkills = params.requiredSkills || ["venipuncture"];

  const allPhlebs = Array.from(inMemoryPhlebotomistTeam.values());

  // Collect candidate evaluations
  const evaluations: Array<{
    phleb: PhlebotomistProfile;
    passedPin: boolean;
    passedShift: boolean;
    passedAvailability: boolean;
    passedSkills: boolean;
    passedWorkload: boolean;
    score: number;
  }> = [];

  for (const phleb of allPhlebs) {
    if (!phleb.active) continue;
    if (params.excludePhlebotomistId && phleb.id === params.excludePhlebotomistId) continue;

    // 1. Service Area & PIN Code Match
    const cityMatches = phleb.city.toLowerCase() === normCity;
    const pinMatches = phleb.pincodes.includes(normPin);
    const passedPin = cityMatches && (pinMatches || phleb.pincodes.length === 0);

    // 2. Collection Slot & Shift Match
    // morning shift covers morning slots (06:00 - 14:00)
    // evening shift covers evening slots (13:00 - 21:00)
    // full_day covers all slots
    const passedShift =
      slotWindow === "any" ||
      phleb.shift === "full_day" ||
      phleb.shift === slotWindow;

    // 3. Staff Availability
    const passedAvailability = phleb.status === "available";

    // 4. Skills Verification (Must have all required skills)
    const passedSkills = requiredSkills.every((reqSkill) => phleb.skills.includes(reqSkill));

    // 5. Workload Limit
    const passedWorkload = phleb.assignedCount < phleb.maxDailySlots;

    let score = 0;
    if (pinMatches) score += 50; // exact PIN match priority
    if (cityMatches) score += 20;
    if (passedShift) score += 20;
    if (passedAvailability) score += 30;
    if (passedSkills) score += 40;
    if (passedWorkload) score += 20 - phleb.assignedCount; // workload balancing

    evaluations.push({
      phleb,
      passedPin,
      passedShift,
      passedAvailability,
      passedSkills,
      passedWorkload,
      score
    });
  }

  // Filter candidates who satisfy all constraints
  const eligibleCandidates = evaluations.filter(
    (e) =>
      e.passedPin &&
      e.passedShift &&
      e.passedAvailability &&
      e.passedSkills &&
      e.passedWorkload
  );

  if (eligibleCandidates.length > 0) {
    // Sort by best score (exact PIN code first, then lowest workload)
    eligibleCandidates.sort((a, b) => b.score - a.score || a.phleb.assignedCount - b.phleb.assignedCount);
    const chosen = eligibleCandidates[0].phleb;

    chosen.assignedCount += 1;

    return {
      success: true,
      assignedPhlebotomist: chosen,
      allocationMode: "auto",
      ruleEvaluations: {
        serviceAreaAndPincodeMatched: true,
        collectionSlotAndShiftMatched: true,
        staffAvailabilityPassed: true,
        skillsVerificationPassed: true,
        workloadLimitPassed: true,
        duplicateCheckPassed: true
      },
      reason: `Auto-allocated to ${chosen.name} (${chosen.shift} shift). Matched PIN [${normPin}], required skills [${requiredSkills.join(", ")}], workload capacity (${chosen.assignedCount}/${chosen.maxDailySlots}).`
    };
  }

  // Diagnostic failure reason generation for the Exception Queue
  let failureReason = "Exception: No eligible phlebotomist met all allocation criteria.";
  const pinMatchCandidates = evaluations.filter((e) => e.passedPin);

  if (pinMatchCandidates.length === 0) {
    failureReason = `Exception: Service Area / PIN code [${normPin}] in ${params.city} is not covered by any active phlebotomist. Routed to Exception Queue.`;
  } else {
    const shiftMatch = pinMatchCandidates.filter((e) => e.passedShift);
    if (shiftMatch.length === 0) {
      failureReason = `Exception: No phlebotomist covering PIN [${normPin}] has an active shift matching [${slotWindow} slot]. Routed to Exception Queue.`;
    } else {
      const availMatch = shiftMatch.filter((e) => e.passedAvailability);
      if (availMatch.length === 0) {
        failureReason = `Exception: All covering phlebotomists for PIN [${normPin}] are currently marked On Leave or Offline. Routed to Exception Queue.`;
      } else {
        const skillMatch = availMatch.filter((e) => e.passedSkills);
        if (skillMatch.length === 0) {
          failureReason = `Exception: Staff available in PIN [${normPin}] lack mandatory specialized skills [${requiredSkills.join(", ")}]. Routed to Exception Queue.`;
        } else {
          failureReason = `Exception: All qualified phlebotomists in PIN [${normPin}] have reached their daily workload ceiling. Routed to Exception Queue.`;
        }
      }
    }
  }

  return {
    success: false,
    assignedPhlebotomist: null,
    allocationMode: "unassigned",
    ruleEvaluations: {
      serviceAreaAndPincodeMatched: pinMatchCandidates.length > 0,
      collectionSlotAndShiftMatched: evaluations.some((e) => e.passedShift),
      staffAvailabilityPassed: evaluations.some((e) => e.passedAvailability),
      skillsVerificationPassed: evaluations.some((e) => e.passedSkills),
      workloadLimitPassed: evaluations.some((e) => e.passedWorkload),
      duplicateCheckPassed: true
    },
    reason: failureReason
  };
}

// =============================================================================
// 6. PHLEBOTOMIST STATE TRANSITIONS & CONFIGURED RULES
// =============================================================================

export type PhlebotomistAction =
  | "accept"
  | "decline"
  | "en_route"
  | "arrived"
  | "collected"
  | "completed"
  | "exception";

export const ALLOWED_DECLINE_REASONS = [
  "Vehicle Breakdown / Accident",
  "Severe Traffic Gridlock",
  "Medical / Family Emergency",
  "Patient Unreachable / Wrong Address",
  "Outside Accessible Radius",
  "Shift Overrun / Slot Conflict"
] as const;

export function updateCollectionJobStatus(
  jobId: string,
  action: PhlebotomistAction,
  params: {
    performedBy: string;
    declineReason?: string;
    exceptionReason?: string;
    collectionNotes?: string;
    barcodes?: string[];
    vialsCollected?: SampleVialRecord[];
    temperatureVerified?: boolean;
    fastingStatusVerified?: boolean;
    fastingHoursReported?: number;
    destinationLab?: string;
  }
): CollectionJob {
  seedInitialJobsIfEmpty();
  const job = inMemoryCollectionJobs.get(jobId);
  if (!job) throw new Error(`Collection job ${jobId} not found.`);

  const oldStatus = job.status;
  const timestamp = nowIso();

  // Validate state machine flow & configured rules
  switch (action) {
    case "accept": {
      if (oldStatus !== "Assigned") {
        throw new Error(`Cannot accept job from status "${oldStatus}". Must be in "Assigned" status.`);
      }
      job.status = "Accepted";
      job.acceptedAt = timestamp;
      job.updatedAt = timestamp;
      job.statusHistory.unshift({
        status: "Accepted",
        timestamp,
        performedBy: params.performedBy,
        notes: "Phlebotomist accepted collection job within configured shift window."
      });
      break;
    }

    case "decline": {
      if (oldStatus !== "Assigned") {
        throw new Error(`Cannot decline job from status "${oldStatus}". Only "Assigned" jobs can be declined.`);
      }
      if (!params.declineReason || !params.declineReason.trim()) {
        throw new Error("A valid authorized decline reason is required to decline a collection job.");
      }

      // Decrement workload on declining phlebotomist
      if (job.phlebotomistId) {
        const phleb = inMemoryPhlebotomistTeam.get(job.phlebotomistId);
        if (phleb && phleb.assignedCount > 0) {
          phleb.assignedCount -= 1;
        }
      }

      job.status = "Exception";
      job.inExceptionQueue = true;
      job.declineReason = params.declineReason.trim();
      job.exceptionReason = `Phlebotomist declined: ${params.declineReason.trim()}`;
      job.exceptionAt = timestamp;
      job.phlebotomistId = null;
      job.phlebotomistName = null;
      job.phlebotomistPhone = null;
      job.updatedAt = timestamp;

      job.statusHistory.unshift({
        status: "Exception",
        timestamp,
        performedBy: params.performedBy,
        notes: `Job declined by phlebotomist. Reason: ${params.declineReason.trim()}. Routed to Exception Queue for reallocation.`
      });
      break;
    }

    case "en_route": {
      if (oldStatus !== "Accepted") {
        throw new Error(`Cannot mark "En Route" from status "${oldStatus}". Job must be "Accepted" first.`);
      }
      job.status = "En Route";
      job.enRouteAt = timestamp;
      job.updatedAt = timestamp;
      job.statusHistory.unshift({
        status: "En Route",
        timestamp,
        performedBy: params.performedBy,
        notes: "Phlebotomist is en route to patient residence with cold chain sample kit."
      });
      break;
    }

    case "arrived": {
      if (oldStatus !== "En Route") {
        throw new Error(`Cannot mark "Arrived" from status "${oldStatus}". Phlebotomist must be "En Route".`);
      }
      job.status = "Arrived";
      job.arrivedAt = timestamp;
      job.updatedAt = timestamp;
      job.statusHistory.unshift({
        status: "Arrived",
        timestamp,
        performedBy: params.performedBy,
        notes: "Phlebotomist arrived at patient doorstep. Preparing patient for draw."
      });
      break;
    }

    case "collected": {
      if (oldStatus !== "Arrived") {
        throw new Error(`Cannot mark "Collected" from status "${oldStatus}". Phlebotomist must mark "Arrived" before draw.`);
      }
      job.status = "Collected";
      job.collectedAt = timestamp;
      job.collectionNotes = params.collectionNotes || "Sample collected following sterile phlebotomy protocol.";
      job.barcodes = params.barcodes || [`BAR-${Date.now().toString().slice(-6)}`];
      job.vialsCollected = params.vialsCollected || [];
      job.temperatureVerified = params.temperatureVerified ?? true;
      job.fastingStatusVerified = params.fastingStatusVerified ?? true;
      job.fastingHoursReported = params.fastingHoursReported;
      job.updatedAt = timestamp;

      job.statusHistory.unshift({
        status: "Collected",
        timestamp,
        performedBy: params.performedBy,
        notes: `Samples drawn successfully. Barcodes: ${(job.barcodes || []).join(", ")}. Fasting verified: ${job.fastingStatusVerified ? "Yes" : "No"}. Cold chain OK: ${job.temperatureVerified ? "Yes" : "No"}.`,
        metadata: {
          barcodes: job.barcodes,
          vials: job.vialsCollected
        }
      });
      break;
    }

    case "completed": {
      if (oldStatus !== "Collected") {
        throw new Error(`Cannot complete job from status "${oldStatus}". Sample collection must be recorded first.`);
      }
      job.status = "Completed";
      job.completedAt = timestamp;
      job.updatedAt = timestamp;
      job.statusHistory.unshift({
        status: "Completed",
        timestamp,
        performedBy: params.performedBy,
        notes: `Sample kit handed over to central processing lab. ${params.destinationLab ? `Lab: ${params.destinationLab}.` : ""}`
      });
      break;
    }

    case "exception": {
      job.status = "Exception";
      job.inExceptionQueue = true;
      job.exceptionAt = timestamp;
      job.exceptionReason = params.exceptionReason || "Unspecified collection exception";
      job.updatedAt = timestamp;
      job.statusHistory.unshift({
        status: "Exception",
        timestamp,
        performedBy: params.performedBy,
        notes: `Collection exception logged: ${job.exceptionReason}. Alert sent to Customer Care.`
      });
      break;
    }

    default:
      throw new Error(`Invalid phlebotomist action: ${action}`);
  }

  // Sync status back to corresponding booking if exists
  if (job.bookingId) {
    const booking = inMemoryBookings.get(job.bookingId);
    if (booking) {
      if (job.status === "Collected") {
        booking.booking_status = "sample_collected";
      } else if (job.status === "En Route") {
        booking.booking_status = "on_the_way";
      } else if (job.status === "Completed") {
        booking.booking_status = "processing";
      } else if (job.status === "Exception") {
        booking.booking_status = "pending_confirmation";
      }
      booking.updated_at = timestamp;
    }
  }

  return job;
}

// =============================================================================
// 7. TRANSFER CASES TO COLLECTION OPERATIONS (CUSTOMER CARE INTEGRATION)
// =============================================================================

export function transferCaseToCollection(params: {
  bookingId: string;
  bookingNumber?: string;
  customerName: string;
  customerPhone: string;
  patientName?: string;
  patientAge?: string | number;
  patientGender?: string;
  address: string;
  pincode: string;
  city: string;
  scheduledDate: string;
  scheduledTime: string;
  testNames?: string[];
  fastingRequired?: boolean;
  specialInstructions?: string;
  allocationMode: "auto" | "manual";
  targetPhlebotomistId?: string;
  performedBy: string;
}): { job: CollectionJob; allocation: AllocationResult } {
  seedInitialJobsIfEmpty();

  const requiredSkills = deriveRequiredSkills({
    patientAge: params.patientAge,
    testNames: params.testNames,
    fastingRequired: params.fastingRequired
  });

  const slotWindow = deriveSlotWindow(params.scheduledTime);

  // Check for duplicate active assignment
  for (const existingJob of inMemoryCollectionJobs.values()) {
    if (existingJob.bookingId === params.bookingId && existingJob.status !== "Completed" && existingJob.status !== "Exception") {
      throw new Error(`Booking ${params.bookingNumber || params.bookingId} already has an active collection job in status "${existingJob.status}". Duplicate assignment prevented.`);
    }
  }

  let assignedPhleb: PhlebotomistProfile | null = null;
  let allocationResult: AllocationResult;

  if (params.allocationMode === "manual" && params.targetPhlebotomistId) {
    const manualPhleb = inMemoryPhlebotomistTeam.get(params.targetPhlebotomistId);
    if (!manualPhleb) throw new Error("Target phlebotomist not found.");
    manualPhleb.assignedCount += 1;
    assignedPhleb = manualPhleb;

    allocationResult = {
      success: true,
      assignedPhlebotomist: manualPhleb,
      allocationMode: "manual",
      ruleEvaluations: {
        serviceAreaAndPincodeMatched: manualPhleb.pincodes.includes(params.pincode),
        collectionSlotAndShiftMatched: true,
        staffAvailabilityPassed: manualPhleb.status === "available",
        skillsVerificationPassed: requiredSkills.every((s) => manualPhleb.skills.includes(s)),
        workloadLimitPassed: manualPhleb.assignedCount <= manualPhleb.maxDailySlots,
        duplicateCheckPassed: true
      },
      reason: `Manually dispatched to ${manualPhleb.name} by ${params.performedBy}.`
    };
  } else {
    allocationResult = runAutomaticAllocation({
      city: params.city,
      pincode: params.pincode,
      scheduledTime: params.scheduledTime,
      slotWindow,
      requiredSkills
    });
    assignedPhleb = allocationResult.assignedPhlebotomist;
  }

  const jobId = crypto.randomUUID();
  const timestamp = nowIso();

  const sampleReqs = (params.testNames || ["Complete Health Panel"]).map((name) => ({
    name,
    sampleType: name.toLowerCase().includes("fasting") ? "Fluoride Plasma" : "Whole Blood EDTA",
    fastingRequired: Boolean(params.fastingRequired || name.toLowerCase().includes("fasting")),
    containerType: name.toLowerCase().includes("fasting") ? "Fluoride (Grey)" : "EDTA (Purple)"
  }));

  const initialStatus: CollectionJobStatus = assignedPhleb ? "Assigned" : "Exception";

  const newJob: CollectionJob = {
    id: jobId,
    bookingId: params.bookingId,
    bookingNumber: params.bookingNumber || `SCX-2026-${Math.floor(100000 + Math.random() * 900000)}`,
    customerName: params.customerName,
    customerPhone: params.customerPhone,
    patientName: params.patientName || params.customerName,
    patientPhone: params.customerPhone,
    patientAge: params.patientAge,
    patientGender: params.patientGender,
    address: params.address,
    pincode: params.pincode,
    city: params.city,
    scheduledDate: params.scheduledDate,
    scheduledTime: params.scheduledTime,
    slotWindow,
    requiredSkills,
    sampleRequirements: sampleReqs,
    specialInstructions: params.specialInstructions,
    phlebotomistId: assignedPhleb ? assignedPhleb.id : null,
    phlebotomistName: assignedPhleb ? assignedPhleb.name : null,
    phlebotomistPhone: assignedPhleb ? assignedPhleb.phone : null,
    status: initialStatus,
    statusHistory: [
      {
        status: initialStatus,
        timestamp,
        performedBy: params.performedBy,
        notes: assignedPhleb
          ? `Transferred to Collection Operations: ${allocationResult.reason}`
          : `Failed auto-allocation: ${allocationResult.reason}`
      }
    ],
    assignedAt: assignedPhleb ? timestamp : null,
    exceptionAt: !assignedPhleb ? timestamp : null,
    exceptionReason: !assignedPhleb ? allocationResult.reason : null,
    allocationMode: allocationResult.allocationMode,
    inExceptionQueue: !assignedPhleb,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  inMemoryCollectionJobs.set(jobId, newJob);

  // Update in-memory booking if available
  const booking = inMemoryBookings.get(params.bookingId);
  if (booking) {
    booking.booking_status = assignedPhleb ? "assigned" : "pending_confirmation";
    booking.assigned_phlebotomist_id = assignedPhleb ? assignedPhleb.id : null;
    booking.assigned_phlebotomist_name = assignedPhleb ? assignedPhleb.name : null;
    booking.assigned_phlebotomist_phone = assignedPhleb ? assignedPhleb.phone : null;
    booking.updated_at = timestamp;
  }

  return { job: newJob, allocation: allocationResult };
}

// =============================================================================
// 8. CUSTOMER CARE TOUCHPOINTS & ACTIONS
// =============================================================================

export function recordCustomerCareCall(params: {
  targetId: string;
  targetKind: "lead" | "booking";
  callType: "outbound" | "inbound";
  outcome: CustomerCareCallRecord["outcome"];
  durationSeconds: number;
  notes: string;
  scheduledFollowUpDate?: string;
  performedBy: string;
}): CustomerCareCallRecord {
  const record: CustomerCareCallRecord = {
    id: crypto.randomUUID(),
    targetId: params.targetId,
    targetKind: params.targetKind,
    callType: params.callType,
    outcome: params.outcome,
    durationSeconds: params.durationSeconds,
    notes: params.notes,
    scheduledFollowUpDate: params.scheduledFollowUpDate,
    performedBy: params.performedBy,
    createdAt: nowIso()
  };

  inMemoryCustomerCareCalls.unshift(record);

  // If target is lead, add lead activity
  if (params.targetKind === "lead") {
    const lead = inMemoryLeads.get(params.targetId);
    if (lead) {
      lead.status = "Contacted";
      if (params.scheduledFollowUpDate) {
        lead.followUpDate = params.scheduledFollowUpDate;
      }
      lead.updatedAt = nowIso();
    }
  }

  return record;
}

export function recordCustomerCareMessage(params: {
  targetId: string;
  targetKind: "lead" | "booking";
  channel: "whatsapp" | "sms" | "email";
  templateTitle: string;
  messageContent: string;
  performedBy: string;
}): CustomerCareMessageRecord {
  const record: CustomerCareMessageRecord = {
    id: crypto.randomUUID(),
    targetId: params.targetId,
    targetKind: params.targetKind,
    channel: params.channel,
    templateTitle: params.templateTitle,
    messageContent: params.messageContent,
    deliveryStatus: "delivered",
    performedBy: params.performedBy,
    createdAt: nowIso()
  };

  inMemoryCustomerCareMessages.unshift(record);
  return record;
}

export function confirmBookingByCustomerCare(
  bookingId: string,
  notes: string,
  performedBy: string
) {
  seedInitialJobsIfEmpty();
  const booking = inMemoryBookings.get(bookingId);
  if (!booking) throw new Error("Booking not found.");

  booking.booking_status = "confirmed";
  booking.internal_notes = `${booking.internal_notes || ""}\n[Confirmed by ${performedBy} at ${new Date().toLocaleTimeString()}]: ${notes}`.trim();
  booking.updated_at = nowIso();

  return booking;
}

export function cancelBookingByCustomerCare(
  bookingId: string,
  reason: string,
  performedBy: string
) {
  seedInitialJobsIfEmpty();
  const booking = inMemoryBookings.get(bookingId);
  if (!booking) throw new Error("Booking not found.");

  booking.booking_status = "cancelled";
  booking.cancellation_reason = reason;
  booking.updated_at = nowIso();

  // If there is an assigned collection job, release phlebotomist and mark job cancelled
  for (const job of inMemoryCollectionJobs.values()) {
    if (job.bookingId === bookingId && job.status !== "Completed") {
      if (job.phlebotomistId) {
        const phleb = inMemoryPhlebotomistTeam.get(job.phlebotomistId);
        if (phleb && phleb.assignedCount > 0) {
          phleb.assignedCount -= 1;
        }
      }
      job.status = "Exception";
      job.exceptionReason = `Booking cancelled by Customer Care: ${reason}`;
      job.updatedAt = nowIso();
      job.statusHistory.unshift({
        status: "Exception",
        timestamp: nowIso(),
        performedBy,
        notes: `Job cancelled due to booking cancellation. Reason: ${reason}`
      });
    }
  }

  return booking;
}
