import assert from "node:assert/strict";
import test from "node:test";
import {
  createCrmLead,
  detectDuplicateLead,
  assignOrTransferLead,
  runAutomaticAssignment,
  bulkAutoAssignUnassignedLeads,
  updateLeadRecord,
  addLeadActivityTouchpoint,
  convertLeadToBooking,
  queryLeads,
  getCrmAnalyticsReport,
  getLeadTransitionTimeline,
  inMemoryLeads,
  inMemoryTeamMembers,
  normalizePhone,
  ALL_LEAD_STATUSES,
  type LeadStatus,
  type LeadPriority
} from "../lib/crm-service";

// -----------------------------------------------------------------------------
// 1. LEAD MODEL & FIELD INTEGRITY
// -----------------------------------------------------------------------------

test("captures lead with all required fields, contact preferences, and interested items", async () => {
  const result = await createCrmLead({
    name: "Aakash Verma",
    phone: "9826011122",
    email: "aakash@example.com",
    city: "Indore",
    pincode: "452001",
    location: "Vijay Nagar, Scheme 54",
    interestedItems: [
      { id: "cbc", name: "Complete Blood Count", kind: "test", price: 300, category: "Blood" },
      { id: "lipid", name: "Lipid Profile", kind: "test", price: 450, category: "Profile" }
    ],
    source: "website_home_collection",
    campaign: "Diwali_Health_Drive",
    utmSource: "google",
    utmMedium: "cpc",
    utmCampaign: "diwali_search",
    consent: true,
    contactPreferences: { phone: true, whatsapp: true, email: true },
    priority: "High",
    notes: "Patient requests fasting home sample collection",
    followUpDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    autoAssign: true,
    performedBy: "Website Form"
  });

  const lead = result.lead;
  assert.equal(lead.name, "Aakash Verma");
  assert.equal(lead.phone, "9826011122");
  assert.equal(lead.normalizedPhone, "9826011122");
  assert.equal(lead.email, "aakash@example.com");
  assert.equal(lead.city, "Indore");
  assert.equal(lead.pincode, "452001");
  assert.equal(lead.source, "website_home_collection");
  assert.equal(lead.campaign, "Diwali_Health_Drive");
  assert.equal(lead.consent, true);
  assert.equal(lead.priority, "High");
  assert.equal(lead.status, "New");
  assert.equal(lead.interestedItems.length, 2);
  assert.equal(lead.isDuplicate, false);
});

test("supports all 8 required lead statuses", () => {
  const expectedStatuses: LeadStatus[] = [
    "New",
    "Contacted",
    "Qualified",
    "Follow-up",
    "Booking Pending",
    "Converted",
    "Not Interested",
    "Closed"
  ];

  for (const st of expectedStatuses) {
    assert.ok(ALL_LEAD_STATUSES.includes(st), `Expected status ${st} to be supported.`);
  }
});

// -----------------------------------------------------------------------------
// 2. DUPLICATE DETECTION & NON-DESTRUCTIVE ENQUIRY ATTACHMENT
// -----------------------------------------------------------------------------

test("detects duplicate lead by phone and merges enquiry without creating duplicate record", async () => {
  const phone = "9826077788";

  // First enquiry
  const first = await createCrmLead({
    name: "Kavita Rao",
    phone,
    city: "Indore",
    pincode: "452001",
    interestedItems: [{ id: "thyroid", name: "Thyroid Profile", kind: "test", price: 400 }],
    source: "test_page",
    campaign: "Campaign_A"
  });

  assert.equal(first.isDuplicate, false);
  const primaryId = first.lead.id;

  // Second enquiry with same phone but different source & additional test
  const second = await createCrmLead({
    name: "Kavita Rao",
    phone: `+91 ${phone}`, // test phone normalization
    city: "Indore",
    interestedItems: [{ id: "vitamin_d", name: "Vitamin D3", kind: "test", price: 650 }],
    source: "package_page",
    campaign: "Campaign_B"
  });

  assert.equal(second.isDuplicate, true);
  assert.equal(second.lead.id, primaryId, "Must return the primary lead instead of a new duplicate ID.");
  assert.equal(second.lead.duplicateCount, 1);
  assert.ok(second.lead.interestedItems.some((i) => i.id === "vitamin_d"), "Merged new interested item.");
});

test("detects duplicate lead by email address", async () => {
  const email = "manish.sharma.test@gmail.com";

  const first = await createCrmLead({
    name: "Manish Sharma",
    phone: "9826099111",
    email,
    city: "Bhopal",
    source: "contact_form"
  });

  const duplicateCheck = detectDuplicateLead("9826099222", email);
  assert.equal(duplicateCheck.isDuplicate, true);
  assert.equal(duplicateCheck.primaryLead?.id, first.lead.id);
});

// -----------------------------------------------------------------------------
// 3. AUTOMATIC ASSIGNMENT (PIN CODE, CITY, WORKLOAD BALANCING, EXCEPTIONS)
// -----------------------------------------------------------------------------

test("auto-assigns to agent covering exact PIN code with lowest workload", () => {
  // Team members Priya (452001, 452010, 452011) and Rohit (452012, 452016)
  const result = runAutomaticAssignment({
    city: "Indore",
    pincode: "452001",
    priority: "Medium"
  });

  assert.equal(result.assignmentMode, "auto");
  assert.ok(result.assignedMember);
  assert.ok(result.assignedMember.coveredPincodes.includes("452001"));
  assert.ok(result.reason.includes("452001"));
});

test("auto-assigns to city coverage when exact PIN code is not listed in territory", () => {
  // Pincode 452099 is in Indore but not in Priya's or Rohit's explicit list
  const result = runAutomaticAssignment({
    city: "Indore",
    pincode: "452099",
    priority: "Medium"
  });

  assert.equal(result.assignmentMode, "auto");
  assert.ok(result.assignedMember);
  assert.equal(result.assignedMember.city, "Indore");
});

test("balances workload by picking the agent with fewer active assignments", () => {
  const memberA = inMemoryTeamMembers.get("team-ind-01")!;
  const memberB = inMemoryTeamMembers.get("team-ind-02")!;

  memberA.currentWorkload = 8;
  memberB.currentWorkload = 2;

  // Querying for Indore city fallback
  const result = runAutomaticAssignment({
    city: "Indore",
    priority: "Medium"
  });

  assert.equal(result.assignmentMode, "auto");
  // memberB had currentWorkload 2 vs 8, so memberB must be chosen (and incremented)
  assert.equal(result.assignedMember?.id, "team-ind-02");
});

test("gracefully routes to Unassigned Queue when territory is out of coverage (never silently discards)", async () => {
  const result = await createCrmLead({
    name: "Out of Station Lead",
    phone: "9826044999",
    city: "Kolkata",
    pincode: "700001",
    source: "google_ad",
    autoAssign: true
  });

  assert.equal(result.lead.assignmentMode, "unassigned");
  assert.equal(result.lead.assignedEmployeeId, null);
  assert.ok(result.lead.assignmentReason?.includes("Exception"));
  assert.ok(inMemoryLeads.has(result.lead.id), "Lead must be preserved in CRM database!");
});

test("bulk auto-assigns leads from unassigned queue when new agents or coverage become available", () => {
  const bulk = bulkAutoAssignUnassignedLeads("Admin System");
  assert.ok(typeof bulk.processed === "number");
  assert.ok(typeof bulk.assignedCount === "number");
  assert.ok(typeof bulk.remainingUnassigned === "number");
});

// -----------------------------------------------------------------------------
// 4. MANUAL ASSIGNMENT & TRANSFER WITH AUDIT TRAIL
// -----------------------------------------------------------------------------

test("manually reassigns/transfers lead to another employee and logs transfer history", async () => {
  const leadRes = await createCrmLead({
    name: "Tarun Gill",
    phone: "9826055667",
    city: "Indore",
    autoAssign: false
  });

  const leadId = leadRes.lead.id;
  assert.equal(leadRes.lead.assignmentMode, "unassigned");

  // Transfer to Priya Sharma
  const transferred = assignOrTransferLead(
    leadId,
    "team-ind-01",
    "Customer requested Hindi-speaking specialist",
    "Supervisor Amit"
  );

  assert.equal(transferred.assignedEmployeeId, "team-ind-01");
  assert.equal(transferred.assignedEmployeeName, "Priya Sharma");
  assert.equal(transferred.assignmentMode, "manual");
  assert.ok(transferred.assignmentReason?.includes("Hindi-speaking specialist"));
});

// -----------------------------------------------------------------------------
// 5. STATUS TRANSITIONS, FOLLOW-UP REMINDERS & ACTIVITY TOUCHPOINTS
// -----------------------------------------------------------------------------

test("updates status through pipeline stages and schedules follow-up reminder", async () => {
  const leadRes = await createCrmLead({
    name: "Deepak Chawla",
    phone: "9826088990",
    city: "Bhopal"
  });

  const leadId = leadRes.lead.id;
  assert.equal(leadRes.lead.status, "New");

  // Advance to Contacted
  updateLeadRecord(leadId, { status: "Contacted" }, "Agent Amit");
  assert.equal(inMemoryLeads.get(leadId)?.status, "Contacted");

  // Advance to Follow-up with scheduled date
  const tomorrowIso = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
  updateLeadRecord(
    leadId,
    {
      status: "Follow-up",
      followUpDate: tomorrowIso,
      followUpNotes: "Callback at 11 AM regarding fasting instructions"
    },
    "Agent Amit"
  );

  const updated = inMemoryLeads.get(leadId)!;
  assert.equal(updated.status, "Follow-up");
  assert.equal(updated.followUpDate, tomorrowIso);
});

test("logs communication touchpoints (call, whatsapp, email, note)", async () => {
  const leadRes = await createCrmLead({
    name: "Geeta Sen",
    phone: "9826033112",
    city: "Indore"
  });

  const leadId = leadRes.lead.id;
  const act = addLeadActivityTouchpoint(
    leadId,
    "whatsapp",
    "Sent package brochure and fasting checklist via WhatsApp",
    "Agent Priya"
  );

  assert.equal(act.activityType, "whatsapp");
  assert.equal(act.performedBy, "Agent Priya");
});

// -----------------------------------------------------------------------------
// 6. CONNECT CRM TO CUSTOMER CARE & PREVENT DUPLICATE CUSTOMER RECORDS
// -----------------------------------------------------------------------------

test("converts lead to booking and links customer record without duplicate records", async () => {
  const leadRes = await createCrmLead({
    name: "Rohan Kapoor",
    phone: "9826022334",
    email: "rohan.kapoor@gmail.com",
    city: "Indore",
    interestedItems: [{ id: "full-body", name: "Full Body Checkup", kind: "package", price: 1499 }]
  });

  const leadId = leadRes.lead.id;
  const converted = convertLeadToBooking(
    leadId,
    {
      bookingNumber: "SCX-2026-992811",
      convertedAmount: 1499,
      notes: "Customer confirmed home collection slot for tomorrow 8 AM."
    },
    "Agent Priya"
  );

  assert.equal(converted.status, "Converted");
  assert.equal(converted.bookingNumber, "SCX-2026-992811");
  assert.equal(converted.convertedAmount, 1499);
  assert.ok(converted.convertedAt);

  // Repeat enquiry from same converted customer attaches to their profile
  const repeat = await createCrmLead({
    name: "Rohan Kapoor",
    phone: "9826022334",
    interestedItems: [{ id: "hba1c", name: "HbA1c Followup", kind: "test", price: 350 }]
  });

  assert.equal(repeat.lead.phone, "9826022334");
  assert.equal(repeat.lead.bookingNumber, "SCX-2026-992811", "Preserves existing booking linkage.");
});

// -----------------------------------------------------------------------------
// 7. SEARCH, FILTERING & CONVERSION REPORTING
// -----------------------------------------------------------------------------

test("filters leads by search query, status, priority, and unassigned queue", () => {
  const allResult = queryLeads({ page: 1, pageSize: 50 });
  assert.ok(allResult.total > 0);
  assert.ok(allResult.rows.length > 0);

  const unassignedResult = queryLeads({ unassignedOnly: true });
  for (const row of unassignedResult.rows) {
    assert.equal(row.assignedEmployeeId, null);
  }
});

test("calculates conversion metrics, funnel stages, and channel attribution", () => {
  const report = getCrmAnalyticsReport();

  assert.ok(typeof report.summary.totalLeads === "number");
  assert.ok(typeof report.summary.convertedCount === "number");
  assert.ok(typeof report.summary.conversionRate === "number");
  assert.ok(typeof report.summary.totalConvertedRevenue === "number");
  assert.ok(Array.isArray(report.funnel));
  assert.equal(report.funnel.length, 6, "Must contain all 6 funnel stages.");
  assert.ok(report.funnel.some((f) => f.stage === "New Leads"));
  assert.ok(report.funnel.some((f) => f.stage === "Converted"));
  assert.ok(report.teamPerformance.length > 0);
  assert.ok(report.transitionReport, "Must include transition report for Recharts visualizer.");
});

// -----------------------------------------------------------------------------
// 8. LEAD STATUS TRANSITIONS TIMELINE & VELOCITY (RECHARTS/D3)
// -----------------------------------------------------------------------------

test("generates lead transition timeline across requested timeframes (7, 14, 30, 90 days)", () => {
  for (const days of [7, 14, 30, 90]) {
    const report = getLeadTransitionTimeline(days);

    assert.equal(report.timeframeDays, days);
    assert.equal(report.timeline.length, days, `Timeline array must have exactly ${days} daily points.`);

    const firstPoint = report.timeline[0];
    assert.ok(firstPoint.date, "Each point must have ISO date string.");
    assert.ok(firstPoint.displayDate, "Each point must have localized display date.");
    assert.ok(typeof firstPoint.newLeads === "number");
    assert.ok(typeof firstPoint.converted === "number");
    assert.ok(typeof firstPoint.conversionRate === "number");
    assert.ok(typeof firstPoint.revenue === "number");

    // Check summary metrics
    assert.ok(report.summary.totalNewInPeriod > 0);
    assert.ok(report.summary.totalConvertedInPeriod > 0);
    assert.ok(report.summary.periodConversionRate > 0);
    assert.ok(report.summary.totalRevenueInPeriod > 0);
    assert.ok(report.summary.avgHoursToConvert > 0);
  }
});

test("tracks detailed stage-by-stage progression from 'New' through intermediate stages to 'Converted'", () => {
  const report = getLeadTransitionTimeline(30);

  assert.equal(report.transitions.length, 4, "Must contain 4 step transitions.");

  const step1 = report.transitions[0];
  assert.equal(step1.fromStatus, "New");
  assert.equal(step1.toStatus, "Contacted");
  assert.ok(step1.count > 0);
  assert.ok(step1.conversionRate > 50);

  const step4 = report.transitions[3];
  assert.equal(step4.fromStatus, "Booking Pending");
  assert.equal(step4.toStatus, "Converted");
  assert.ok(step4.count > 0);
  assert.ok(step4.avgDurationHours > 0);

  // Conversion rate bounds
  assert.ok(report.summary.periodConversionRate <= 100);
  assert.ok(report.summary.periodConversionRate >= 0);
});

