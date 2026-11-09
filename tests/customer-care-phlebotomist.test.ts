import assert from "node:assert/strict";
import test from "node:test";
import {
  inMemoryPhlebotomistTeam,
  inMemoryCollectionJobs,
  inMemoryCustomerCareCalls,
  inMemoryCustomerCareMessages,
  runAutomaticAllocation,
  deriveSlotWindow,
  deriveRequiredSkills,
  getPhlebotomistJobView,
  updateCollectionJobStatus,
  transferCaseToCollection,
  recordCustomerCareCall,
  recordCustomerCareMessage,
  confirmBookingByCustomerCare,
  cancelBookingByCustomerCare,
  seedInitialJobsIfEmpty,
  type PhlebotomistSkill,
  type CollectionJob
} from "../lib/phlebotomist-service";
import { inMemoryBookings } from "../lib/backend-service";
import { createCrmLead, inMemoryLeads } from "../lib/crm-service";

// Ensure seed state before tests
seedInitialJobsIfEmpty();

// =============================================================================
// 1. AUTOMATIC ALLOCATION RULES & CONSTRAINTS
// =============================================================================

test("Automatic allocation matches PIN code, shift, availability, skills, and workload", () => {
  // Indore PIN 452010 in morning with pediatric + fasting requirements
  const result = runAutomaticAllocation({
    city: "Indore",
    pincode: "452010",
    scheduledTime: "07:30 AM - 08:30 AM",
    slotWindow: "morning",
    requiredSkills: ["venipuncture", "pediatric_venipuncture", "fasting_metabolic"]
  });

  assert.equal(result.success, true);
  assert.ok(result.assignedPhlebotomist);
  assert.ok(["Ramesh Sharma", "Sunita Patel"].includes(result.assignedPhlebotomist.name));
  assert.equal(result.ruleEvaluations.serviceAreaAndPincodeMatched, true);
  assert.equal(result.ruleEvaluations.collectionSlotAndShiftMatched, true);
  assert.equal(result.ruleEvaluations.staffAvailabilityPassed, true);
  assert.equal(result.ruleEvaluations.skillsVerificationPassed, true);
  assert.equal(result.ruleEvaluations.workloadLimitPassed, true);
  assert.equal(result.ruleEvaluations.duplicateCheckPassed, true);
});

test("Automatic allocation respects shift windows (morning vs evening)", () => {
  // Anil Verma (phleb-002) is on evening shift (13:00-21:00) covering 452003
  const result = runAutomaticAllocation({
    city: "Indore",
    pincode: "452003",
    scheduledTime: "03:00 PM - 04:00 PM",
    slotWindow: "evening",
    requiredSkills: ["venipuncture"]
  });

  assert.equal(result.success, true);
  assert.ok(result.assignedPhlebotomist);
  assert.equal(result.assignedPhlebotomist.id, "phleb-002");
  assert.equal(result.assignedPhlebotomist.shift, "evening");
});

test("Automatic allocation filters out staff who are on leave", () => {
  // Devendra Rao (phleb-006) is marked on_leave
  const phleb6 = inMemoryPhlebotomistTeam.get("phleb-006");
  assert.ok(phleb6);
  assert.equal(phleb6.status, "on_leave");

  const result = runAutomaticAllocation({
    city: "Indore",
    pincode: "452001",
    scheduledTime: "08:00 AM",
    slotWindow: "morning",
    excludePhlebotomistId: "phleb-001" // exclude Ramesh, should pick Sunita (full_day) not phleb-006
  });

  assert.ok(result.assignedPhlebotomist);
  assert.notEqual(result.assignedPhlebotomist.id, "phleb-006");
  assert.equal(result.assignedPhlebotomist.status, "available");
});

test("Automatic allocation enforces required specialized skills (e.g., pediatric venipuncture)", () => {
  // Ask for pediatric skill in Bhopal where Vikas Joshi only has geriatric + fasting
  const result = runAutomaticAllocation({
    city: "Bhopal",
    pincode: "462001",
    scheduledTime: "09:00 AM",
    slotWindow: "morning",
    requiredSkills: ["venipuncture", "pediatric_venipuncture"]
  });

  // Since Bhopal staff lacks pediatric_venipuncture, should fail and route to Exception Queue
  assert.equal(result.success, false);
  assert.equal(result.assignedPhlebotomist, null);
  assert.match(result.reason, /Exception: Staff available in PIN.*lack mandatory specialized skills/);
});

test("Automatic allocation enforces workload limits and routes to exception queue when capped", () => {
  // Artificially saturate phleb-004 in Bhopal
  const vikas = inMemoryPhlebotomistTeam.get("phleb-004")!;
  const originalCount = vikas.assignedCount;
  vikas.assignedCount = vikas.maxDailySlots;

  const result = runAutomaticAllocation({
    city: "Bhopal",
    pincode: "462001",
    scheduledTime: "10:00 AM",
    slotWindow: "morning",
    requiredSkills: ["venipuncture"]
  });

  assert.equal(result.success, false);
  assert.match(result.reason, /Exception: All qualified phlebotomists.*reached their daily workload/);

  // Restore count
  vikas.assignedCount = originalCount;
});

test("Automatic allocation handles unsupported PIN code by routing to Exception Queue with diagnostics", () => {
  const result = runAutomaticAllocation({
    city: "Indore",
    pincode: "999999",
    scheduledTime: "08:00 AM",
    slotWindow: "morning",
    requiredSkills: ["venipuncture"]
  });

  assert.equal(result.success, false);
  assert.equal(result.allocationMode, "unassigned");
  assert.match(result.reason, /Exception: Service Area \/ PIN code \[999999\] in Indore is not covered/);
});

// =============================================================================
// 2. PHLEBOTOMIST STATE MACHINE & CONFIGURED RULES
// =============================================================================

test("Phlebotomist lifecycle: Assigned -> Accepted -> En Route -> Arrived -> Collected -> Completed", () => {
  // Create test job
  const jobId = "test-job-lifecycle-" + Date.now();
  const testJob: CollectionJob = {
    id: jobId,
    bookingId: "bk-" + Date.now(),
    bookingNumber: "SCX-2026-TEST01",
    customerName: "Mohan Das",
    customerPhone: "9826011111",
    patientName: "Mohan Das",
    patientPhone: "9826011111",
    patientAge: 45,
    patientGender: "Male",
    address: "12 Scheme 78, Indore",
    pincode: "452010",
    city: "Indore",
    scheduledDate: "2026-11-03",
    scheduledTime: "07:00 AM - 08:00 AM",
    slotWindow: "morning",
    requiredSkills: ["venipuncture"],
    sampleRequirements: [{ name: "CBC", sampleType: "EDTA", fastingRequired: false, containerType: "EDTA (Purple)" }],
    phlebotomistId: "phleb-001",
    phlebotomistName: "Ramesh Sharma",
    phlebotomistPhone: "9876543210",
    status: "Assigned",
    statusHistory: [],
    allocationMode: "auto",
    inExceptionQueue: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  inMemoryCollectionJobs.set(jobId, testJob);

  // 1. Accept
  const accepted = updateCollectionJobStatus(jobId, "accept", { performedBy: "Ramesh Sharma" });
  assert.equal(accepted.status, "Accepted");
  assert.ok(accepted.acceptedAt);
  assert.equal(accepted.statusHistory[0].status, "Accepted");

  // 2. En Route
  const enRoute = updateCollectionJobStatus(jobId, "en_route", { performedBy: "Ramesh Sharma" });
  assert.equal(enRoute.status, "En Route");
  assert.ok(enRoute.enRouteAt);

  // 3. Arrived
  const arrived = updateCollectionJobStatus(jobId, "arrived", { performedBy: "Ramesh Sharma" });
  assert.equal(arrived.status, "Arrived");
  assert.ok(arrived.arrivedAt);

  // 4. Collected
  const collected = updateCollectionJobStatus(jobId, "collected", {
    performedBy: "Ramesh Sharma",
    barcodes: ["BAR-CBC-9921"],
    collectionNotes: "Blood draw clean on first attempt via median cubital vein.",
    temperatureVerified: true,
    fastingStatusVerified: true,
    fastingHoursReported: 12,
    vialsCollected: [
      { tubeType: "EDTA (Purple)", count: 1, barcode: "BAR-CBC-9921", testName: "CBC" }
    ]
  });
  assert.equal(collected.status, "Collected");
  assert.ok(collected.collectedAt);
  assert.deepEqual(collected.barcodes, ["BAR-CBC-9921"]);
  assert.equal(collected.fastingStatusVerified, true);
  assert.equal(collected.temperatureVerified, true);

  // 5. Completed
  const completed = updateCollectionJobStatus(jobId, "completed", {
    performedBy: "Ramesh Sharma",
    destinationLab: "ScopeX Central Pathology Lab, Indore"
  });
  assert.equal(completed.status, "Completed");
  assert.ok(completed.completedAt);
});

test("Phlebotomist decline rule enforces valid reason and routes to exception queue", () => {
  const jobId = "test-job-decline-" + Date.now();
  const testJob: CollectionJob = {
    id: jobId,
    bookingId: "bk-decline-" + Date.now(),
    bookingNumber: "SCX-2026-DEC01",
    customerName: "Sunil Jain",
    customerPhone: "9826022222",
    patientName: "Sunil Jain",
    patientPhone: "9826022222",
    address: "MG Road, Indore",
    pincode: "452001",
    city: "Indore",
    scheduledDate: "2026-11-03",
    scheduledTime: "08:00 AM",
    slotWindow: "morning",
    requiredSkills: ["venipuncture"],
    sampleRequirements: [],
    phlebotomistId: "phleb-001",
    phlebotomistName: "Ramesh Sharma",
    phlebotomistPhone: "9876543210",
    status: "Assigned",
    statusHistory: [],
    allocationMode: "auto",
    inExceptionQueue: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  inMemoryCollectionJobs.set(jobId, testJob);

  // Reject decline without reason
  assert.throws(() => {
    updateCollectionJobStatus(jobId, "decline", { performedBy: "Ramesh Sharma", declineReason: "" });
  }, /valid authorized decline reason is required/);

  // Valid decline with authorized reason
  const declined = updateCollectionJobStatus(jobId, "decline", {
    performedBy: "Ramesh Sharma",
    declineReason: "Vehicle Breakdown / Accident"
  });

  assert.equal(declined.status, "Exception");
  assert.equal(declined.inExceptionQueue, true);
  assert.equal(declined.declineReason, "Vehicle Breakdown / Accident");
  assert.equal(declined.phlebotomistId, null); // released for reallocation
  assert.ok(declined.exceptionAt);
});

test("Privacy boundary: Restricted view exposes patient logistics and redacts financial/margin details", () => {
  const fullJob: CollectionJob = {
    id: "job-privacy-01",
    bookingId: "bk-priv-01",
    bookingNumber: "SCX-2026-PRIV01",
    customerName: "Private Patient",
    customerPhone: "9826044444",
    patientName: "Private Patient",
    patientPhone: "9826044444",
    patientAge: 32,
    patientGender: "Female",
    address: "Secret Colony, Indore",
    pincode: "452010",
    city: "Indore",
    scheduledDate: "2026-11-04",
    scheduledTime: "07:30 AM",
    slotWindow: "morning",
    requiredSkills: ["venipuncture"],
    sampleRequirements: [{ name: "Thyroid Profile", sampleType: "Serum", fastingRequired: true, containerType: "SST / Serum (Yellow/Red)" }],
    specialInstructions: "Use small needle",
    phlebotomistId: "phleb-001",
    phlebotomistName: "Ramesh Sharma",
    phlebotomistPhone: "9876543210",
    status: "Assigned",
    statusHistory: [],
    allocationMode: "auto",
    inExceptionQueue: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const restricted = getPhlebotomistJobView(fullJob);

  // Patient clinical logistics must be present
  assert.equal(restricted.patientName, "Private Patient");
  assert.equal(restricted.patientPhone, "9826044444");
  assert.equal(restricted.address, "Secret Colony, Indore");
  assert.equal(restricted.pincode, "452010");
  assert.equal(restricted.scheduledTime, "07:30 AM");
  assert.equal(restricted.sampleRequirements[0].name, "Thyroid Profile");

  // Private business fields must NOT exist in the restricted view object
  const anyRestricted = restricted as any;
  assert.equal(anyRestricted.payable_amount, undefined);
  assert.equal(anyRestricted.profit_margin, undefined);
  assert.equal(anyRestricted.discount_breakdown, undefined);
  assert.equal(anyRestricted.coupon_code, undefined);
});

// =============================================================================
// 3. CUSTOMER CARE WORKFLOW & DISPATCH INTEGRATION
// =============================================================================

test("Customer Care records calls, messages, notes, and follow-up dates", () => {
  const call = recordCustomerCareCall({
    targetId: "lead-test-01",
    targetKind: "lead",
    callType: "outbound",
    outcome: "connected_interested",
    durationSeconds: 145,
    notes: "Patient interested in full body checkup for parents.",
    scheduledFollowUpDate: "2026-11-05T10:00:00.000Z",
    performedBy: "Priya Sharma"
  });

  assert.equal(call.outcome, "connected_interested");
  assert.equal(call.durationSeconds, 145);
  assert.equal(call.performedBy, "Priya Sharma");
  assert.ok(inMemoryCustomerCareCalls.includes(call));

  const msg = recordCustomerCareMessage({
    targetId: "lead-test-01",
    targetKind: "lead",
    channel: "whatsapp",
    templateTitle: "Home Collection Confirmation",
    messageContent: "Dear Patient, your ScopeX collection is scheduled for tomorrow 7:30 AM.",
    performedBy: "Priya Sharma"
  });

  assert.equal(msg.channel, "whatsapp");
  assert.equal(msg.deliveryStatus, "delivered");
  assert.ok(inMemoryCustomerCareMessages.includes(msg));
});

test("Customer Care confirms booking and updates notes", () => {
  const bookingId = "bk-confirm-" + Date.now();
  inMemoryBookings.set(bookingId, {
    id: bookingId,
    booking_number: "SCX-2026-CONF",
    booking_status: "pending_confirmation",
    internal_notes: "Initial order created"
  });

  const confirmed = confirmBookingByCustomerCare(bookingId, "Verified address and 12h fasting requirement", "Priya Sharma");
  assert.equal(confirmed.booking_status, "confirmed");
  assert.match(String(confirmed.internal_notes), /Verified address and 12h fasting requirement/);
});

test("Customer Care cancels booking and releases assigned phlebotomist", () => {
  const phleb1 = inMemoryPhlebotomistTeam.get("phleb-001")!;
  const prevCount = phleb1.assignedCount;
  phleb1.assignedCount += 1;

  const bookingId = "bk-cancel-" + Date.now();
  inMemoryBookings.set(bookingId, {
    id: bookingId,
    booking_number: "SCX-2026-CANC",
    booking_status: "confirmed"
  });

  const jobId = "job-cancel-" + Date.now();
  inMemoryCollectionJobs.set(jobId, {
    id: jobId,
    bookingId,
    bookingNumber: "SCX-2026-CANC",
    customerName: "Anand Rathi",
    customerPhone: "9826033333",
    patientName: "Anand Rathi",
    patientPhone: "9826033333",
    address: "Indore",
    pincode: "452001",
    city: "Indore",
    scheduledDate: "2026-11-04",
    scheduledTime: "08:00 AM",
    slotWindow: "morning",
    requiredSkills: ["venipuncture"],
    sampleRequirements: [],
    phlebotomistId: "phleb-001",
    phlebotomistName: "Ramesh Sharma",
    phlebotomistPhone: "9876543210",
    status: "Assigned",
    statusHistory: [],
    allocationMode: "auto",
    inExceptionQueue: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const cancelled = cancelBookingByCustomerCare(bookingId, "Patient traveling out of town", "Customer Care Lead");
  assert.equal(cancelled.booking_status, "cancelled");

  // Verify collection job was updated to exception and phlebotomist capacity freed
  const job = inMemoryCollectionJobs.get(jobId)!;
  assert.equal(job.status, "Exception");
  assert.equal(phleb1.assignedCount, prevCount);
});

test("Transfer case to collection operations supports manual and auto allocation", () => {
  const bookingId = "bk-transfer-" + Date.now();
  inMemoryBookings.set(bookingId, {
    id: bookingId,
    booking_number: "SCX-2026-XFER",
    booking_status: "confirmed"
  });

  // 1. Auto allocation transfer
  const autoResult = transferCaseToCollection({
    bookingId,
    bookingNumber: "SCX-2026-XFER",
    customerName: "Shruti Aggarwal",
    customerPhone: "9826077777",
    patientName: "Shruti Aggarwal",
    patientAge: 28,
    patientGender: "Female",
    address: "Palasia Main Road",
    pincode: "452001",
    city: "Indore",
    scheduledDate: "2026-11-05",
    scheduledTime: "08:30 AM",
    testNames: ["Complete Blood Count", "Fasting Blood Sugar"],
    fastingRequired: true,
    allocationMode: "auto",
    performedBy: "Dispatcher Priya"
  });

  assert.equal(autoResult.allocation.success, true);
  assert.equal(autoResult.job.status, "Assigned");
  assert.ok(autoResult.job.phlebotomistId);

  // 2. Prevent duplicate active assignment
  assert.throws(() => {
    transferCaseToCollection({
      bookingId,
      customerName: "Shruti Aggarwal",
      customerPhone: "9826077777",
      address: "Palasia",
      pincode: "452001",
      city: "Indore",
      scheduledDate: "2026-11-05",
      scheduledTime: "08:30 AM",
      allocationMode: "auto",
      performedBy: "Dispatcher Priya"
    });
  }, /already has an active collection job.*Duplicate assignment prevented/);
});
