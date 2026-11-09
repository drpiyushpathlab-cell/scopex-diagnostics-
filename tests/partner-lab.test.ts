import assert from "node:assert/strict";
import test from "node:test";
import {
  registerPartnerLab,
  addPartnerLabLocation,
  listPartnerLabs,
  createOrUpdateManualPartnerTestMapping,
  listPartnerTestMappings,
  generatePartnerTestExcelTemplate,
  validateBulkPartnerTestUpload,
  commitBulkPartnerTestImport,
  assignSampleToPartnerLab,
  recordPartnerLabBarcodeHandover,
  verifyPartnerSampleHandoverByAdmin,
  updatePartnerSampleStatus,
  uploadPartnerLabReport,
  verifyAndPublishPartnerReport,
  calculatePartnerFinancialMetrics,
  allocatePackageRevenueProportionally,
  recordPartnerInvoice,
  recordPartnerPayment,
  resolveApplicablePartnerRate,
  getPartnerLocationTestsAndRates,
  reassignPartnerSample,
  checkRateConflict,
  inMemoryPartnerLabs,
  inMemoryPartnerTestMappings,
  inMemoryPartnerSamples,
  inMemoryPartnerReports,
  inMemoryPartnerInvoices,
  inMemoryPartnerPayments,
  seedInitialPartnerLabDataIfEmpty
} from "../lib/partner-lab-service";
import { inMemoryBookings } from "../lib/backend-service";

// Ensure seed state before tests
seedInitialPartnerLabDataIfEmpty();

// =============================================================================
// PHASE 1: PARTNER REGISTRATION & MULTI-CITY LOCATIONS
// =============================================================================

test("Phase 1: Registers a partner laboratory with separate licence, NABL, and GSTIN fields", () => {
  const lab = registerPartnerLab(
    {
      name: "ThyroCare BioPath Diagnostics",
      brandName: "BioPath Labs",
      legalName: "BioPath Clinical Laboratories India Limited",
      registrationNumber: "REG-MH-2019-4401",
      isNablAccredited: true,
      nablNumber: "NABL-MC-5590",
      gstin: "27AABCB9988G1Z5",
      registeredAddress: "Plot 45, MIDC Industrial Area, Turbhe, Navi Mumbai",
      primaryContactPerson: "Dr. Sandeep Kulkarni",
      mobile: "9820011223",
      email: "sandeep.k@biopathlabs.com",
      status: "active"
    },
    { email: "admin@scopexdiagnostics.in" }
  );

  assert.ok(lab.id.startsWith("PLAB-"));
  assert.equal(lab.name, "ThyroCare BioPath Diagnostics");
  assert.equal(lab.brandName, "BioPath Labs");
  assert.equal(lab.registrationNumber, "REG-MH-2019-4401");
  assert.equal(lab.isNablAccredited, true);
  assert.equal(lab.nablNumber, "NABL-MC-5590");
  assert.equal(lab.gstin, "27AABCB9988G1Z5");
  assert.equal(lab.status, "active");
});

test("Phase 1: Adds multiple operational city locations under one Partner Lab ID", () => {
  const lab = registerPartnerLab(
    {
      name: "Star Health Reference Labs",
      brandName: "Star Diagnostics",
      registrationNumber: "REG-MP-2021-1122",
      isNablAccredited: false,
      registeredAddress: "Scheme 54, Indore",
      primaryContactPerson: "Rohan V.",
      mobile: "9826012399",
      email: "ops@stardiagnostics.in"
    },
    { email: "admin@scopexdiagnostics.in" }
  );

  // Add Location 1: Indore
  const locIndore = addPartnerLabLocation(
    lab.id,
    {
      city: "Indore",
      fullAddress: "101, Star Chambers, AB Road, Indore",
      pincode: "452001",
      contactPerson: "Mahesh Jain",
      mobile: "9826011100",
      email: "indore@stardiagnostics.in",
      sampleReceivingTimings: "07:00 AM - 10:00 PM",
      operatingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      status: "active"
    },
    { email: "admin@scopexdiagnostics.in" }
  );

  // Add Location 2: Bhopal
  const locBhopal = addPartnerLabLocation(
    lab.id,
    {
      city: "Bhopal",
      fullAddress: "Plot 5, MP Nagar Zone 1, Bhopal",
      pincode: "462011",
      contactPerson: "Sunil Verma",
      mobile: "9826022200",
      email: "bhopal@stardiagnostics.in",
      sampleReceivingTimings: "08:00 AM - 08:00 PM",
      operatingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      status: "active"
    },
    { email: "admin@scopexdiagnostics.in" }
  );

  assert.equal(lab.locations.length, 2);
  assert.equal(locIndore.city, "Indore");
  assert.equal(locIndore.pincode, "452001");
  assert.equal(locBhopal.city, "Bhopal");
  assert.equal(locBhopal.pincode, "462011");
});

// =============================================================================
// PHASE 2: PARTNER TEST MASTER, MANUAL ENTRY & BULK EXCEL UPLOAD
// =============================================================================

test("Phase 2: Adds partner test mapping manually without entering a partner test code (optional code)", () => {
  const lab = Array.from(inMemoryPartnerLabs.values())[0];
  const loc = lab.locations[0];

  const mapping = createOrUpdateManualPartnerTestMapping(
    {
      partnerLabId: lab.id,
      locationId: loc.id,
      scopexTestId: "cbc",
      partnerTestName: "Automated CBC with 5-Part Diff",
      partnerTestCode: "", // Intentionally blank!
      category: "Hematology",
      partnerProcessingRate: 145,
      sampleType: "Whole Blood EDTA",
      tatHours: "6 Hours",
      effectiveFrom: "2026-02-01",
      status: "active"
    },
    { email: "admin@scopexdiagnostics.in" }
  );

  assert.equal(mapping.partnerTestName, "Automated CBC with 5-Part Diff");
  assert.equal(mapping.partnerTestCode, undefined); // verified optional
  assert.equal(mapping.partnerProcessingRate, 145);
  assert.equal(mapping.scopexTestId, "cbc-esr");
});

test("Phase 2: Downloads template and validates bulk Excel/CSV rows (valid vs invalid errors)", () => {
  const template = generatePartnerTestExcelTemplate();
  assert.ok(template.headers.includes("SCOPEX Test ID or Test Name"));
  assert.ok(template.headers.includes("Partner Processing Rate"));
  assert.ok(template.csvContent.length > 50);

  const lab = Array.from(inMemoryPartnerLabs.values())[0];
  const loc = lab.locations[0];

  const preview = validateBulkPartnerTestUpload({
    partnerLabId: lab.id,
    locationId: loc.id,
    rows: [
      {
        scopexTestIdentifier: "Complete Blood Count (CBC)",
        partnerTestName: "Hemogram Plus",
        partnerTestCode: "APX-01",
        partnerProcessingRate: 140,
        effectiveFrom: "2026-03-01",
        status: "Active"
      },
      {
        scopexTestIdentifier: "Non_Existent_Test_12345", // Invalid SCOPEX test
        partnerTestName: "Mystery Panel",
        partnerProcessingRate: -50, // Negative rate error
        effectiveFrom: "invalid-date", // Invalid date error
        status: "Active"
      }
    ]
  });

  assert.equal(preview.totalRows, 2);
  assert.equal(preview.validCount, 1);
  assert.equal(preview.invalidCount, 1);
  assert.equal(preview.results[0].isValid, true);
  assert.equal(preview.results[1].isValid, false);
  assert.ok(preview.results[1].errors.some((e) => e.includes("does not exist")));
  assert.ok(preview.results[1].errors.some((e) => e.includes("non-negative")));
  assert.ok(preview.results[1].errors.some((e) => e.includes("format")));
});

test("Phase 2: Handles duplicate mappings via Admin strategies (skip, update, new_version)", () => {
  const lab = Array.from(inMemoryPartnerLabs.values())[0];
  const loc = lab.locations[0];

  const preview = validateBulkPartnerTestUpload({
    partnerLabId: lab.id,
    locationId: loc.id,
    rows: [
      {
        scopexTestIdentifier: "cbc",
        partnerTestName: "CBC Automated 2026",
        partnerProcessingRate: 155,
        effectiveFrom: "2026-06-01"
      }
    ]
  });

  assert.equal(preview.duplicateCount, 1);

  // Strategy 1: new_version creates new version and preserves previous rate
  const commitRes = commitBulkPartnerTestImport({
    preview,
    duplicateStrategy: "new_version",
    adminUser: { email: "admin@scopexdiagnostics.in" }
  });

  assert.equal(commitRes.newVersionCount, 1);
  const updatedMapping = inMemoryPartnerTestMappings.get(`MAP-${lab.id}-${loc.id}-cbc-esr`)!;
  assert.equal(updatedMapping.partnerProcessingRate, 155);
  assert.ok(updatedMapping.version > 1);
});

// =============================================================================
// PHASE 3 & 4: SAMPLE ASSIGNMENT, BARCODE HANDOVER & 10-STEP STATUS
// =============================================================================

test("Phase 3 & 4: Sample assignment validates active partner, active location, and active test rate snapshot", () => {
  const lab = Array.from(inMemoryPartnerLabs.values())[0];
  const loc = lab.locations[0];

  // Set up mock confirmed booking
  const bookingId = "bk-test-partner-01";
  inMemoryBookings.set(bookingId, {
    id: bookingId,
    booking_number: "SCX-2026-PLAB01",
    customer_name: "Anita Deshmukh",
    customer_phone: "9826011999",
    booking_status: "confirmed",
    payment_status: "paid",
    payable_amount: 500,
    booking_patients: [
      {
        name: "Anita Deshmukh",
        items: [{ kind: "test", id: "cbc", name: "Complete Blood Count (CBC)", price: 300 }]
      }
    ]
  });

  const sample = assignSampleToPartnerLab({
    bookingId,
    scopexSampleId: "SMP-100200",
    partnerLabId: lab.id,
    locationId: loc.id,
    adminUser: { email: "admin@scopexdiagnostics.in" }
  });

  assert.equal(sample.status, "Assigned to Partner Lab");
  assert.equal(sample.scopexSampleId, "SMP-100200");
  assert.equal(sample.partnerLabId, lab.id);
  assert.ok(sample.applicableRateSnapshot.length > 0);
  assert.ok(sample.totalProcessingCost > 0);
});

test("Phase 3 & 4: Phlebotomist records partner barcode and photo handover; prevents duplicate barcode", () => {
  const lab = Array.from(inMemoryPartnerLabs.values())[0];
  const loc = lab.locations[0];

  const bookingId = "bk-test-partner-02";
  inMemoryBookings.set(bookingId, {
    id: bookingId,
    booking_number: "SCX-2026-PLAB02",
    customer_name: "Rameshwar Rao",
    customer_phone: "9826022888",
    booking_status: "confirmed"
  });

  const sample = assignSampleToPartnerLab({
    bookingId,
    scopexSampleId: "SMP-100300",
    partnerLabId: lab.id,
    locationId: loc.id,
    adminUser: { email: "admin@scopexdiagnostics.in" }
  });

  // Handover confirmation
  const handover = recordPartnerLabBarcodeHandover({
    sampleRecordId: sample.id,
    partnerBarcode: "APX-ACC-998811",
    barcodePhotoUrl: "/uploads/barcode_tube_998811.jpg",
    performedBy: "Phlebotomist Ramesh Sharma",
    remarks: "Handed over to Apex Central specimen receiving desk."
  });

  assert.equal(handover.status, "Ready for Handover");
  assert.equal(handover.partnerBarcode, "APX-ACC-998811");
  assert.equal(handover.scopexSampleId, "SMP-100300"); // Original ID unchanged!
  assert.ok(handover.barcodePhotoUrl);

  // Attempt duplicate barcode registration on another sample
  inMemoryBookings.set("bk-test-partner-03", {
    id: "bk-test-partner-03",
    booking_number: "SCX-2026-PLAB03",
    customer_name: "Karan Patel",
    customer_phone: "9826033777",
    booking_status: "confirmed"
  });

  const sample2 = assignSampleToPartnerLab({
    bookingId: "bk-test-partner-03",
    scopexSampleId: "SMP-100400",
    partnerLabId: lab.id,
    locationId: loc.id,
    adminUser: { email: "admin@scopexdiagnostics.in" }
  });

  assert.throws(() => {
    recordPartnerLabBarcodeHandover({
      sampleRecordId: sample2.id,
      partnerBarcode: "APX-ACC-998811", // Duplicate!
      performedBy: "Phlebotomist Anil"
    });
  }, /Duplicate barcode prevented/);
});

test("Phase 3 & 4: Admin verifies handover and manages 10-step sample lifecycle with audit trail", () => {
  const sample = Array.from(inMemoryPartnerSamples.values())[0];

  // 1. Admin Verification
  const verified = verifyPartnerSampleHandoverByAdmin({
    sampleRecordId: sample.id,
    verified: true,
    remarks: "Barcode label and tube volume verified by Admin.",
    adminUser: { email: "admin@scopexdiagnostics.in" }
  });
  assert.equal(verified.status, "Received by Partner Lab");
  assert.equal(verified.adminVerified, true);

  // 2. Transition to Processing
  const processing = updatePartnerSampleStatus({
    sampleRecordId: sample.id,
    newStatus: "Processing",
    remarks: "Centrifuged and loaded on automated analyzer.",
    adminUser: { email: "admin@scopexdiagnostics.in" }
  });
  assert.equal(processing.status, "Processing");

  // 3. Transition to Completed
  const completed = updatePartnerSampleStatus({
    sampleRecordId: sample.id,
    newStatus: "Completed",
    remarks: "Analyzed and pathologist approved.",
    adminUser: { email: "admin@scopexdiagnostics.in" }
  });
  assert.equal(completed.status, "Completed");
  assert.ok(completed.statusHistory.length >= 3);
});

// =============================================================================
// PHASE 5: REPORT UPLOAD & PATIENT PUBLICATION
// =============================================================================

test("Phase 5: Uploads report, verifies, publishes to patient, and preserves revision history", () => {
  const sample = Array.from(inMemoryPartnerSamples.values())[0];

  // 1. Initial Upload
  const report = uploadPartnerLabReport({
    bookingId: sample.bookingId,
    scopexSampleId: sample.scopexSampleId,
    partnerBarcode: sample.partnerBarcode,
    testNames: ["Complete Blood Count (CBC)"],
    reportType: "individual",
    fileUrl: "/reports/test_report_v1.pdf",
    fileName: "CBC_Report_v1.pdf",
    remarks: "Apex lab verified sign-off PDF.",
    adminUser: { email: "admin@scopexdiagnostics.in" }
  });

  assert.equal(report.status, "Pending Verification");
  assert.equal(report.versionHistory.length, 1);

  // 2. Upload revised version
  const revised = uploadPartnerLabReport({
    bookingId: sample.bookingId,
    scopexSampleId: sample.scopexSampleId,
    partnerBarcode: sample.partnerBarcode,
    testNames: ["Complete Blood Count (CBC)"],
    reportType: "revised",
    fileUrl: "/reports/test_report_v2.pdf",
    fileName: "CBC_Report_v2_corrected.pdf",
    remarks: "Typo corrected in platelet commentary.",
    adminUser: { email: "admin@scopexdiagnostics.in" }
  });

  assert.equal(revised.versionHistory.length, 2);
  assert.equal(revised.currentFileName, "CBC_Report_v2_corrected.pdf");

  // 3. Admin Verify & Publish
  verifyAndPublishPartnerReport({
    reportId: report.id,
    action: "verify",
    adminUser: { email: "admin@scopexdiagnostics.in" }
  });

  const published = verifyAndPublishPartnerReport({
    reportId: report.id,
    action: "publish",
    adminUser: { email: "admin@scopexdiagnostics.in" }
  });

  assert.equal(published.status, "Published to Patient");
  assert.ok(published.publishedAt);
});

// =============================================================================
// PHASE 6: FINANCIAL RECONCILIATION & REVENUE ALLOCATION
// =============================================================================

test("Phase 6: Calculates net patient revenue, partner costs, gross profit, and gross margin", () => {
  const financials = calculatePartnerFinancialMetrics();
  assert.ok(financials.kpis.totalSamplesAssigned > 0);
  assert.ok(typeof financials.kpis.grossProfit === "number");
  assert.ok(financials.kpis.totalPartnerCost >= 0);
});

test("Phase 6: Allocates package revenue proportionally without double counting", () => {
  // Package sells for ₹900 net. Included tests normally sell for: Test A ₹600, Test B ₹400 (Total ₹1000)
  // Proportional split: Test A = 900 * (600/1000) = 540, Test B = 900 * (400/1000) = 360
  const tests = [
    { testId: "test-a", sellingPrice: 600 },
    { testId: "test-b", sellingPrice: 400 }
  ];

  const allocations = allocatePackageRevenueProportionally(900, tests);
  assert.equal(allocations.length, 2);
  assert.equal(allocations[0].allocatedRevenue, 540);
  assert.equal(allocations[1].allocatedRevenue, 360);

  // Verify sum exactly equals netPackageRevenue
  const sum = allocations.reduce((acc, a) => acc + a.allocatedRevenue, 0);
  assert.equal(sum, 900);
});

// =============================================================================
// PHASE 7 & 8: PARTNER INVOICE AND PAYMENT MANAGEMENT
// =============================================================================

test("Phase 7 & 8: Records partner invoice, reconciles discrepancies, and records partial payments", () => {
  const lab = Array.from(inMemoryPartnerLabs.values())[0];
  const sample = Array.from(inMemoryPartnerSamples.values())[0];

  // 1. Record Invoice
  const invoice = recordPartnerInvoice(
    {
      partnerLabId: lab.id,
      invoiceNumber: `INV-APX-${Date.now().toString().slice(-4)}`,
      invoiceDate: "2026-11-01",
      relatedSampleIds: [sample.scopexSampleId],
      invoiceAmount: sample.totalProcessingCost,
      remarks: "Monthly batch billing"
    },
    { email: "finance@scopexdiagnostics.in" }
  );

  assert.equal(invoice.status, "Approved");
  assert.equal(invoice.approvedAmount, sample.totalProcessingCost);
  assert.equal(invoice.outstandingAmount, sample.totalProcessingCost);

  // 2. Record Partial Payment (e.g. ₹50)
  const payment1 = recordPartnerPayment(
    {
      invoiceId: invoice.id,
      paymentAmount: 50,
      paymentDate: "2026-11-05",
      paymentMode: "NEFT",
      transactionReference: `NEFT-REF-${Date.now().toString().slice(-6)}`,
      remarks: "Part payment 1"
    },
    { email: "finance@scopexdiagnostics.in" }
  );

  assert.equal(invoice.status, "Partially Paid");
  assert.equal(invoice.paidAmount, 50);
  assert.equal(invoice.outstandingAmount, invoice.approvedAmount - 50);

  // 3. Complete Remaining Payment
  recordPartnerPayment(
    {
      invoiceId: invoice.id,
      paymentAmount: invoice.outstandingAmount,
      paymentDate: "2026-11-06",
      paymentMode: "RTGS",
      transactionReference: `RTGS-REF-${Date.now().toString().slice(-6)}`,
      remarks: "Final settlement"
    },
    { email: "finance@scopexdiagnostics.in" }
  );

  assert.equal(invoice.status, "Paid");
  assert.equal(invoice.outstandingAmount, 0);
});

// =============================================================================
// PHASE 9: FLEXIBLE CITY RATE APPLICABILITY & POST-BOOKING PARTNER ASSIGNMENT
// =============================================================================

test("Phase 9: Evaluates 3-Tier Rate Priority (Single City -> Selected Cities -> Pan-India)", () => {
  // Test Case 1: Single City priority (Indore matches Single City rate ₹140 over Selected/Pan-India)
  const rateIndore = resolveApplicablePartnerRate({
    partnerLabId: "PLAB-001", // Apex
    city: "Indore",
    scopexTestId: "cbc"
  });
  assert.ok(rateIndore);
  assert.equal(rateIndore.priorityTier, 1);
  assert.equal(rateIndore.appliedScope, "single_city");
  assert.equal(rateIndore.rate, 155); // Updated to v2 (155) in duplicate versioning test

  // Test Case 2: Selected Cities priority (Bhopal matches Selected Cities rate ₹150 over Pan-India)
  const rateBhopal = resolveApplicablePartnerRate({
    partnerLabId: "PLAB-001", // Apex
    city: "Bhopal",
    scopexTestId: "cbc"
  });
  assert.ok(rateBhopal);
  assert.equal(rateBhopal.rate, 150);
  assert.ok(rateBhopal.priorityTier <= 2);

  // Test Case 3: Pan-India common rate fallback (Pune has no Single City or Selected Cities rate for Apex -> resolves to Pan-India ₹135)
  const ratePune = resolveApplicablePartnerRate({
    partnerLabId: "PLAB-001", // Apex
    city: "Pune",
    scopexTestId: "cbc"
  });
  assert.ok(ratePune);
  assert.equal(ratePune.priorityTier, 3);
  assert.equal(ratePune.appliedScope, "pan_india");
  assert.equal(ratePune.rate, 135);

  // Test Case 4: No applicable rate configured returns null
  const rateMissing = resolveApplicablePartnerRate({
    partnerLabId: "PLAB-001",
    city: "Indore",
    scopexTestId: "non-existent-test-id-xyz"
  });
  assert.equal(rateMissing, null);
});

test("Phase 9: Verifies master prompt examples (Agilus Pan-India, Lal PathLabs Lucknow, Metropolis Selected Cities)", () => {
  // 1. Agilus CBC: Pan-India rate ₹130 applies to Mumbai and Delhi
  const agilusMumbai = resolveApplicablePartnerRate({
    partnerLabId: "PLAB-003",
    city: "Mumbai",
    scopexTestId: "cbc"
  });
  assert.ok(agilusMumbai);
  assert.equal(agilusMumbai.rate, 130);
  assert.equal(agilusMumbai.appliedScope, "pan_india");

  const agilusDelhi = resolveApplicablePartnerRate({
    partnerLabId: "PLAB-003",
    city: "Delhi",
    scopexTestId: "cbc"
  });
  assert.ok(agilusDelhi);
  assert.equal(agilusDelhi.rate, 130);
  assert.equal(agilusDelhi.appliedScope, "pan_india");

  // 2. Dr Lal PathLabs CBC: Lucknow only ₹165
  const lalLucknow = resolveApplicablePartnerRate({
    partnerLabId: "PLAB-004",
    city: "Lucknow",
    scopexTestId: "cbc"
  });
  assert.ok(lalLucknow);
  assert.equal(lalLucknow.rate, 165);
  assert.equal(lalLucknow.appliedScope, "single_city");

  // Lal PathLabs has no rate for Bhopal -> null
  const lalBhopal = resolveApplicablePartnerRate({
    partnerLabId: "PLAB-004",
    city: "Bhopal",
    scopexTestId: "cbc"
  });
  assert.equal(lalBhopal, null);

  // 3. Metropolis CBC: Selected Cities Indore, Bhopal and Pune ₹148
  const metIndore = resolveApplicablePartnerRate({
    partnerLabId: "PLAB-005",
    city: "Indore",
    scopexTestId: "cbc"
  });
  assert.ok(metIndore);
  assert.equal(metIndore.rate, 148);
  assert.equal(metIndore.appliedScope, "selected_cities");

  const metPune = resolveApplicablePartnerRate({
    partnerLabId: "PLAB-005",
    city: "Pune",
    scopexTestId: "cbc"
  });
  assert.ok(metPune);
  assert.equal(metPune.rate, 148);
  assert.equal(metPune.appliedScope, "selected_cities");
});

test("Phase 9: Post-booking Partner Lab & City selection displays only that partner's locations and snapshots rate", () => {
  // Step 1: Patient completes booking without any partner lab assigned
  const bookingId = "bk-post-booking-01";
  inMemoryBookings.set(bookingId, {
    id: bookingId,
    booking_number: "SCX-2026-POST01",
    customer_name: "Sunil Gavaskar",
    customer_phone: "9826099111",
    booking_status: "confirmed",
    city: "Indore",
    booking_patients: [
      {
        name: "Sunil Gavaskar",
        items: [{ kind: "test", id: "cbc", name: "Complete Blood Count (CBC)", price: 300 }]
      }
    ]
  });

  const createdBooking = inMemoryBookings.get(bookingId) as any;
  // Verify NO partner lab was assigned at booking creation
  assert.equal(createdBooking.partner_lab_id, undefined);
  assert.equal(createdBooking.partner_location_id, undefined);

  // Step 2: Admin selects Partner Lab (Agilus PLAB-003) and verifies ONLY its locations appear
  const agilusLab = inMemoryPartnerLabs.get("PLAB-003")!;
  const agilusLocationCities = agilusLab.locations.map((loc) => loc.city);
  assert.ok(agilusLocationCities.includes("Mumbai"));
  assert.ok(agilusLocationCities.includes("Delhi"));
  // Unrelated partner locations (e.g. Lucknow) must NOT appear under Agilus
  assert.equal(agilusLocationCities.includes("Lucknow"), false);

  // Step 3: Admin inspects tests and rates preview for Metropolis PLAB-005 in Indore (LOC-IND-02)
  const preview = getPartnerLocationTestsAndRates({
    partnerLabId: "PLAB-005",
    locationId: "LOC-IND-02",
    testIds: ["cbc"]
  });
  assert.equal(preview.allMapped, true);
  assert.equal(preview.totalCost, 148);
  assert.equal(preview.tests[0].appliedScope, "selected_cities");

  // Step 4: Admin confirms assignment
  const sample = assignSampleToPartnerLab({
    bookingId,
    partnerLabId: "PLAB-005",
    locationId: "LOC-IND-02",
    adminUser: { email: "admin@scopexdiagnostics.in" },
    remarks: "Assigned after booking verification"
  });

  assert.equal(sample.partnerLabId, "PLAB-005");
  assert.equal(sample.locationCity, "Indore");
  assert.equal(sample.applicableRateSnapshot[0].processingRate, 148);
  assert.equal(sample.applicableRateSnapshot[0].appliedScope, "selected_cities");

  // Verify booking record was updated with the assignment
  const updatedBooking = inMemoryBookings.get(bookingId) as any;
  assert.equal(updatedBooking.partner_lab_id, "PLAB-005");
  assert.equal(updatedBooking.partner_location_city, "Indore");
  assert.ok(updatedBooking.partner_assigned_at);
});

test("Phase 9: Admin reassigns partner lab with mandatory reason and full audit trail without modifying past records", () => {
  const bookingId = "bk-post-booking-reassign-01";
  inMemoryBookings.set(bookingId, {
    id: bookingId,
    booking_number: "SCX-2026-REASSIGN01",
    customer_name: "Pooja Hegde",
    customer_phone: "9826088222",
    booking_status: "confirmed",
    city: "Indore",
    booking_patients: [
      {
        name: "Pooja Hegde",
        items: [{ kind: "test", id: "cbc", name: "Complete Blood Count (CBC)", price: 300 }]
      }
    ]
  });

  // Initial assignment to Apex Central in Indore (rate ₹140)
  const sample = assignSampleToPartnerLab({
    bookingId,
    partnerLabId: "PLAB-001",
    locationId: "LOC-IND-01",
    adminUser: { email: "admin@scopexdiagnostics.in" }
  });
  assert.equal(sample.partnerLabName, "Apex Central Pathology & Molecular Laboratory");
  assert.equal(sample.totalProcessingCost, 155);

  // Admin reassigns to Metropolis in Indore (LOC-IND-02, rate ₹148)
  const reassigned = reassignPartnerSample({
    sampleRecordId: sample.id,
    newPartnerLabId: "PLAB-005",
    newLocationId: "LOC-IND-02",
    reason: "Equipment calibration ongoing at Apex Indore hub. Routing to Metropolis for faster turnaround.",
    adminUser: { email: "operations.head@scopexdiagnostics.in" }
  });

  assert.equal(reassigned.partnerLabId, "PLAB-005");
  assert.equal(reassigned.locationCity, "Indore");
  assert.equal(reassigned.totalProcessingCost, 148);
  assert.ok(reassigned.statusHistory[0].remarks?.includes("Reassigned from"));
  assert.ok(reassigned.statusHistory[0].remarks?.includes("Equipment calibration"));

  // Verify booking reflects reassignment
  const booking = inMemoryBookings.get(bookingId) as any;
  assert.equal(booking.partner_lab_id, "PLAB-005");
  assert.ok(booking.partner_reassignment_reason?.includes("Equipment calibration"));
});

test("Phase 9: Detects and prevents conflicting active rates in the same tier", () => {
  // Check conflict for adding an identical active Pan-India rate when one already exists for Agilus
  const conflict = checkRateConflict({
    partnerLabId: "PLAB-003",
    scopexTestId: "cbc",
    applicability: "pan_india",
    effectiveFrom: "2026-01-01"
  });

  assert.equal(conflict.hasConflict, true);
  assert.ok(conflict.message?.includes("Conflicting active Pan-India rate already exists"));
});

