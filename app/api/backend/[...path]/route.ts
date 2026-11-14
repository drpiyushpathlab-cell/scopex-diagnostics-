import { NextRequest, NextResponse } from "next/server";
import { getBackendBaseUrl } from "../../_utils/backend";
import { apiErrorResponse } from "../../_utils/errors";
import {
  addFamilyMember,
  deleteFamilyMember,
  getPatientProfile,
  listFamilyMembers,
  makeDefaultFamilyMember,
  requirePatientAuth,
  updateFamilyMember,
  updatePatientProfile
} from "@/lib/supabase-patient";
import {
  addLeadActivity,
  authenticateAdmin,
  createAdminCategory,
  createAdminBundleSlab,
  deleteAdminBundleSlab,
  getAdminBundleSlabs,
  resetAdminBundleSlabsToDefault,
  updateAdminBundleSlab,
  createAdminFixedPackage,
  createAdminServiceArea,
  bulkUpsertAdminTests,
  bulkAdjustAdminTestPrices,
  createAdminStaff,
  createAdminTest,
  createBooking,
  deleteAdminFixedPackage,
  deleteAdminTest,
  getAdminBookingsList,
  getAdminCategoriesList,
  getAdminMetrics,
  getAdminPackagesList,
  getAdminServiceAreas,
  getAdminTestsList,
  getAssignmentSettings,
  getAuditLogsList,
  getBackendCatalog,
  getLeadActivities,
  getPatientBookings,
  inMemoryBookings,
  getPhlebotomistList,
  logAuditAction,
  requireAdminRole,
  requireAuthToken,
  updateAdminFixedPackage,
  updateAdminServiceArea,
  updateAdminTest,
  updateAssignmentSettings,
  updateBookingAdmin,
  type AdminRole
} from "@/lib/backend-service";
import { createRazorpayOrder, getRazorpayKeyId, verifyRazorpaySignature } from "@/lib/razorpay";
import { hasSupabasePublicConfig } from "@/lib/supabase";
import { getSupabaseServiceClient } from "@/lib/supabase-server";
import {
  queryLeads,
  createCrmLead,
  getLeadById,
  getLeadActivitiesById,
  updateLeadRecord,
  assignOrTransferLead,
  runAutomaticAssignment,
  bulkAutoAssignUnassignedLeads,
  addLeadActivityTouchpoint,
  convertLeadToBooking,
  getCrmAnalyticsReport,
  inMemoryTeamMembers,
  inMemoryLeads,
  type LeadPriority,
  type LeadStatus
} from "@/lib/crm-service";
import {
  inMemoryCollectionJobs,
  inMemoryPhlebotomistTeam,
  inMemoryCustomerCareCalls,
  inMemoryCustomerCareMessages,
  getPhlebotomistJobView,
  updateCollectionJobStatus,
  transferCaseToCollection,
  recordCustomerCareCall,
  recordCustomerCareMessage,
  confirmBookingByCustomerCare,
  cancelBookingByCustomerCare,
  runAutomaticAllocation,
  seedInitialJobsIfEmpty,
  type PhlebotomistAction,
  type CollectionJob
} from "@/lib/phlebotomist-service";
import {
  listPartnerLabs,
  getPartnerLabById,
  registerPartnerLab,
  updatePartnerLab,
  addPartnerLabLocation,
  updatePartnerLabLocation,
  listPartnerTestMappings,
  createOrUpdateManualPartnerTestMapping,
  generatePartnerTestExcelTemplate,
  validateBulkPartnerTestUpload,
  commitBulkPartnerTestImport,
  assignSampleToPartnerLab,
  reassignPartnerSample,
  getPartnerLocationTestsAndRates,
  recordPartnerLabBarcodeHandover,
  verifyPartnerSampleHandoverByAdmin,
  updatePartnerSampleStatus,
  uploadPartnerLabReport,
  verifyAndPublishPartnerReport,
  calculatePartnerFinancialMetrics,
  recordPartnerInvoice,
  recordPartnerPayment,
  inMemoryPartnerLabs,
  inMemoryPartnerTestMappings,
  inMemoryPartnerSamples,
  inMemoryPartnerReports,
  inMemoryPartnerInvoices,
  inMemoryPartnerPayments,
  seedInitialPartnerLabDataIfEmpty
} from "@/lib/partner-lab-service";

type Context = {
  params: Promise<{ path?: string[] }>;
};

const METHODS_WITHOUT_BODY = new Set(["GET", "HEAD"]);

async function jsonBody(request: Request) {
  return request.json().catch(() => ({}));
}

function getClientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
}

// Full-featured server handlers for the Next.js runtime environment
async function handleBackendRequest(request: Request, path: string[]) {
  const joined = `/${path.join("/")}`;
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const ip = getClientIp(request);

  // ---------------------------------------------------------------------------
  // AUTHENTICATION
  // ---------------------------------------------------------------------------
  if (request.method === "POST" && (joined === "/auth/admin/login" || joined === "/admin/login")) {
    const body = await jsonBody(request);
    const result = await authenticateAdmin(body.email, body.password, ip);
    return NextResponse.json({
      success: true,
      token: result.token,
      user: result.admin
    });
  }

  if (request.method === "POST" && joined === "/auth/logout") {
    return NextResponse.json({ success: true, message: "Logged out successfully." });
  }

  // ---------------------------------------------------------------------------
  // PATIENT USER & FAMILY PROFILE
  // ---------------------------------------------------------------------------
  if (joined === "/user/profile") {
    const auth = requirePatientAuth(request);
    if (request.method === "GET") {
      return NextResponse.json({ profile: await getPatientProfile(auth) });
    }
    if (request.method === "PATCH") {
      const body = await jsonBody(request);
      return NextResponse.json({
        success: true,
        profile: await updatePatientProfile(auth, body)
      });
    }
  }

  if (joined === "/family/list" && request.method === "GET") {
    const auth = requirePatientAuth(request);
    return NextResponse.json({ familyMembers: await listFamilyMembers(auth) });
  }

  if (joined === "/family/add" && request.method === "POST") {
    const auth = requirePatientAuth(request);
    const body = await jsonBody(request);
    const member = await addFamilyMember(auth, body);
    return NextResponse.json({ success: true, familyMember: member }, { status: 201 });
  }

  const familyMatch = joined.match(/^\/family\/([^/]+)(?:\/default)?$/);
  if (familyMatch) {
    const auth = requirePatientAuth(request);
    const id = familyMatch[1];
    if (request.method === "PATCH" && !joined.endsWith("/default")) {
      const body = await jsonBody(request);
      return NextResponse.json({ success: true, familyMember: await updateFamilyMember(auth, id, body) });
    }
    if (request.method === "DELETE" && !joined.endsWith("/default")) {
      await deleteFamilyMember(auth, id);
      return NextResponse.json({ success: true });
    }
    if (request.method === "POST" && joined.endsWith("/default")) {
      return NextResponse.json({ success: true, familyMember: await makeDefaultFamilyMember(auth, id) });
    }
  }

  // ---------------------------------------------------------------------------
  // CATALOG: TESTS & PACKAGES
  // ---------------------------------------------------------------------------
  if (request.method === "GET" && (joined === "/tests" || joined === "/catalog/tests")) {
    const catalog = await getBackendCatalog();
    return NextResponse.json({ success: true, tests: catalog.tests, categories: catalog.categories });
  }

  if (request.method === "GET" && (joined === "/packages" || joined === "/catalog/packages")) {
    const catalog = await getBackendCatalog();
    return NextResponse.json({ success: true, packages: catalog.packages });
  }

  // ---------------------------------------------------------------------------
  // BOOKINGS: CREATE, HISTORY, STATUS
  // ---------------------------------------------------------------------------
  if (request.method === "POST" && (joined === "/booking/create" || joined === "/bookings/create")) {
    let authUser = null;
    try {
      authUser = requireAuthToken(request);
    } catch {
      // Guest or session booking permitted
    }

    const body = await jsonBody(request);
    const bookingResult = await createBooking(body, authUser, ip);
    return NextResponse.json(bookingResult, { status: 201 });
  }

  if (request.method === "GET" && (joined === "/booking/history" || joined === "/booking/user")) {
    const auth = requireAuthToken(request);
    const bookings = await getPatientBookings(auth);
    return NextResponse.json({ success: true, bookings });
  }

  const bookingIdMatch = joined.match(/^\/booking\/([^/]+)$/);
  if (bookingIdMatch) {
    const bookingId = bookingIdMatch[1];
    const auth = requireAuthToken(request);

    if (request.method === "GET") {
      const bookings = await getPatientBookings(auth);
      const booking = bookings.find((b) => b.id === bookingId || b.booking_id === bookingId);
      if (!booking) return NextResponse.json({ success: false, message: "Booking not found." }, { status: 404 });
      return NextResponse.json({ success: true, booking });
    }

    if (request.method === "PATCH") {
      const body = await jsonBody(request);
      const updated = await updateBookingAdmin(bookingId, body, auth);
      return NextResponse.json({ success: true, booking: updated });
    }
  }

  // ---------------------------------------------------------------------------
  // PAYMENTS: RAZORPAY ORDERS & VERIFICATION
  // ---------------------------------------------------------------------------
  if (request.method === "POST" && joined === "/payment/create-order") {
    const body = await jsonBody(request);
    const amount = Math.round(Number(body.amount));
    const receipt = String(body.receipt || body.orderId || "order_" + Date.now());

    if (!Number.isSafeInteger(amount) || amount < 100) {
      return NextResponse.json({ success: false, message: "A valid payment amount is required." }, { status: 400 });
    }

    try {
      const order = await createRazorpayOrder({ amount, currency: "INR", receipt });
      return NextResponse.json({
        success: true,
        order,
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: getRazorpayKeyId()
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create payment order.";
      const status = message.toLowerCase().includes("credential") ? 503 : 502;
      return NextResponse.json({ success: false, message }, { status });
    }
  }

  if (request.method === "POST" && joined === "/payment/verify") {
    const body = await jsonBody(request);
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { success: false, message: "Missing payment verification fields (razorpayOrderId, razorpayPaymentId, razorpaySignature)." },
        { status: 400 }
      );
    }

    let isValidSignature = false;
    try {
      isValidSignature = verifyRazorpaySignature({
        razorpayOrderId: String(razorpayOrderId),
        razorpayPaymentId: String(razorpayPaymentId),
        razorpaySignature: String(razorpaySignature)
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      const isMissingCreds = msg.toLowerCase().includes("credential");
      const isDevMockOrder =
        process.env.NODE_ENV !== "production" &&
        String(razorpayOrderId).startsWith("order_mock_");
      if (isMissingCreds && isDevMockOrder) {
        isValidSignature = true;
      } else {
        return NextResponse.json(
          { success: false, message: msg || "Unable to verify payment signature." },
          { status: isMissingCreds ? 401 : 500 }
        );
      }
    }

    if (!isValidSignature) {
      return NextResponse.json({ success: false, message: "Payment signature verification failed." }, { status: 400 });
    }

    // Mark booking as paid if orderId was provided
    if (orderId) {
      let authUser = { userId: "system", role: "system" };
      try {
        authUser = requireAuthToken(request);
      } catch {
        // Fallback
      }
      try {
        await updateBookingAdmin(
          orderId,
          {
            payment_status: "paid",
            booking_status: "confirmed"
          },
          authUser as any
        );
      } catch {
        // Ignore if orderId is a client temporary ref
      }
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully.",
      paymentId: razorpayPaymentId || `pay_mock_${Date.now()}`
    });
  }

  // ---------------------------------------------------------------------------
  // REPORTS
  // ---------------------------------------------------------------------------
  if (request.method === "GET" && (joined === "/reports/user" || joined === "/reports")) {
    const auth = requireAuthToken(request);
    const bookings = await getPatientBookings(auth);
    const reports = bookings
      .filter((b) => b.reports && Array.isArray(b.reports))
      .flatMap((b) => b.reports);

    return NextResponse.json({ success: true, reports });
  }

  // ---------------------------------------------------------------------------
  // ADMIN DASHBOARD & OPERATIONS MANAGEMENT
  // ---------------------------------------------------------------------------
  if (joined === "/admin/overview" && request.method === "GET") {
    requireAdminRole(request);
    const metrics = await getAdminMetrics();
    return NextResponse.json({ success: true, ...metrics });
  }

  if (joined === "/admin/bookings-management") {
    requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager", "customer_support"]);
    const q = searchParams.get("q") || "";
    const status = searchParams.get("status") || "";
    const bookings = await getAdminBookingsList({ q, status });
    return NextResponse.json({ success: true, rows: bookings, total: bookings.length });
  }

  const adminBookingMatch = joined.match(/^\/admin\/bookings-management\/([^/]+)$/);
  if (adminBookingMatch) {
    const admin = requireAdminRole(request);
    const bookingId = adminBookingMatch[1];
    if (request.method === "PATCH") {
      const body = await jsonBody(request);
      const updated = await updateBookingAdmin(bookingId, body, admin);
      return NextResponse.json({ success: true, data: updated });
    }
  }

  if (joined === "/admin/revenue" && request.method === "GET") {
    requireAdminRole(request, ["super_admin", "admin", "finance_manager"]);
    const bookings = await getAdminBookingsList({});
    const rows = bookings
      .filter((b) => b.payment_status === "paid")
      .map((b) => ({
        id: b.id,
        booking_id: b.booking_number || b.id,
        provider_order_id: b.razorpay_order_id || `ORD-${String(b.id || "").slice(0, 8)}`,
        provider_payment_id: b.razorpay_payment_id || `PAY-${String(b.id || "").slice(0, 8)}`,
        status: b.payment_status,
        amount: b.payable_amount,
        created_at: b.created_at
      }));

    const totalRevenue = rows.reduce((sum, r) => sum + Number(r.amount || 0), 0);
    return NextResponse.json({ success: true, rows, totalRevenue });
  }

  if (joined === "/admin/sessions" && request.method === "GET") {
    requireAdminRole(request, ["super_admin", "admin"]);
    const logs = getAuditLogsList(50).map((l) => ({
      id: l.id,
      role: l.role,
      event: l.action,
      user_id: l.actor_email,
      ip_address: l.ip_address || "127.0.0.1",
      created_at: l.created_at
    }));
    return NextResponse.json({ success: true, rows: logs });
  }

  if (joined === "/admin/audit-logs" && request.method === "GET") {
    requireAdminRole(request);
    const logs = getAuditLogsList(100);
    return NextResponse.json({ success: true, logs });
  }

  if (joined === "/admin/users" && request.method === "GET") {
    requireAdminRole(request, ["super_admin", "admin"]);
    const bookings = await getAdminBookingsList({});
    const uniqueUsersMap = new Map<string, Record<string, unknown>>();

    for (const b of bookings) {
      const phone = String(b.customer_phone || "");
      if (phone && !uniqueUsersMap.has(phone)) {
        uniqueUsersMap.set(phone, {
          id: b.user_id || `usr-${phone}`,
          phone,
          email: b.customer_email || "-",
          auth_provider: "mobile_otp",
          role: "patient",
          is_active: true,
          created_at: b.created_at
        });
      }
    }

    return NextResponse.json({ success: true, rows: Array.from(uniqueUsersMap.values()) });
  }

  if (joined === "/admin/admin-users") {
    const admin = requireAdminRole(request, ["super_admin"]);
    if (request.method === "GET") {
      const defaultSuper = {
        id: "admin-super-001",
        email: "admin@scopexdiagnostics.in",
        role: "super_admin",
        name: "ScopeX Super Administrator",
        is_active: true,
        created_at: new Date().toISOString()
      };
      return NextResponse.json({ success: true, users: [defaultSuper] });
    }
    if (request.method === "POST") {
      const body = await jsonBody(request);
      const newStaff = await createAdminStaff(body, admin);
      return NextResponse.json({ success: true, user: newStaff }, { status: 201 });
    }
  }

  if (joined === "/admin/assignment-settings") {
    const admin = requireAdminRole(request, ["super_admin", "admin", "booking_manager"]);
    if (request.method === "GET") {
      return NextResponse.json({ success: true, settings: getAssignmentSettings() });
    }
    if (request.method === "PATCH") {
      const body = await jsonBody(request);
      const updated = updateAssignmentSettings(body, admin);
      return NextResponse.json({ success: true, settings: updated });
    }
  }

  if (joined === "/admin/phlebotomists") {
    requireAdminRole(request, ["super_admin", "admin", "booking_manager", "customer_support"]);
    const city = searchParams.get("city") || "";
    return NextResponse.json({ success: true, phlebotomists: getPhlebotomistList(city) });
  }

  // ---------------------------------------------------------------------------
  // CRM LEADS & CUSTOMER CARE MODULE (ADMIN)
  // ---------------------------------------------------------------------------
  if (joined === "/admin/crm/leads") {
    const admin = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager", "customer_support"]);
    if (request.method === "GET") {
      const q = searchParams.get("q") || "";
      const status = searchParams.get("status") || "";
      const priority = searchParams.get("priority") || "";
      const assignedTo = searchParams.get("assignedTo") || "";
      const unassignedOnly = searchParams.get("unassignedOnly") === "true";
      const followUpStatus = (searchParams.get("followUpStatus") || "all") as "all" | "today" | "overdue" | "upcoming";
      const source = searchParams.get("source") || "";
      const campaign = searchParams.get("campaign") || "";
      const page = Number(searchParams.get("page")) || 1;
      const pageSize = Number(searchParams.get("pageSize")) || 25;

      const result = queryLeads({
        q,
        status,
        priority,
        assignedTo,
        unassignedOnly,
        followUpStatus,
        source,
        campaign,
        page,
        pageSize
      });
      return NextResponse.json({ success: true, ...result });
    }

    if (request.method === "POST") {
      const body = await jsonBody(request);
      const result = await createCrmLead({
        ...body,
        performedBy: admin.email || "Customer Support"
      });
      return NextResponse.json({ success: true, ...result }, { status: 201 });
    }
  }

  if (joined === "/admin/crm/reports") {
    requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager", "customer_support"]);
    const report = getCrmAnalyticsReport();
    return NextResponse.json({ success: true, report });
  }

  if (joined === "/admin/crm/team") {
    const admin = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager", "customer_support"]);
    if (request.method === "GET") {
      return NextResponse.json({ success: true, team: Array.from(inMemoryTeamMembers.values()) });
    }
    if (request.method === "POST") {
      const body = await jsonBody(request);
      const id = body.id || `team-cust-${Date.now()}`;
      inMemoryTeamMembers.set(id, {
        id,
        name: body.name || "Customer Care Representative",
        email: body.email || "",
        phone: body.phone || "",
        role: body.role || "customer_support",
        city: body.city || "Indore",
        coveredPincodes: Array.isArray(body.coveredPincodes) ? body.coveredPincodes : [],
        active: body.active !== false,
        status: body.status || "available",
        maxDailyWorkload: Number(body.maxDailyWorkload) || 20,
        currentWorkload: Number(body.currentWorkload) || 0
      });
      return NextResponse.json({ success: true, member: inMemoryTeamMembers.get(id) }, { status: 201 });
    }
  }

  if (joined === "/admin/crm/leads/bulk-auto-assign" && request.method === "POST") {
    const admin = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager", "customer_support"]);
    const result = bulkAutoAssignUnassignedLeads(admin.email || "Customer Support");
    return NextResponse.json({ success: true, ...result });
  }

  const crmLeadAssignMatch = joined.match(/^\/admin\/crm\/leads\/([^/]+)\/assign$/);
  if (crmLeadAssignMatch && request.method === "POST") {
    const admin = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager", "customer_support"]);
    const leadId = crmLeadAssignMatch[1];
    const body = await jsonBody(request);
    const updated = assignOrTransferLead(leadId, body.targetEmployeeId, body.reason, admin.email || "Customer Support");
    return NextResponse.json({ success: true, lead: updated });
  }

  const crmLeadAutoAssignMatch = joined.match(/^\/admin\/crm\/leads\/([^/]+)\/auto-assign$/);
  if (crmLeadAutoAssignMatch && request.method === "POST") {
    const admin = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager", "customer_support"]);
    const leadId = crmLeadAutoAssignMatch[1];
    const lead = getLeadById(leadId);
    if (!lead) return NextResponse.json({ success: false, message: "Lead not found." }, { status: 404 });

    const autoRes = runAutomaticAssignment({
      city: lead.city,
      pincode: lead.pincode,
      priority: lead.priority
    });

    if (autoRes.assignedMember) {
      const updated = assignOrTransferLead(leadId, autoRes.assignedMember.id, autoRes.reason, "Auto-Assignment Engine");
      return NextResponse.json({ success: true, lead: updated, assignment: autoRes });
    }

    return NextResponse.json({
      success: false,
      message: autoRes.reason,
      lead
    }, { status: 422 });
  }

  const crmLeadActivityMatch = joined.match(/^\/admin\/crm\/leads\/([^/]+)\/activity$/);
  if (crmLeadActivityMatch) {
    const admin = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager", "customer_support"]);
    const leadId = crmLeadActivityMatch[1];
    if (request.method === "GET") {
      return NextResponse.json({ success: true, activities: getLeadActivitiesById(leadId) });
    }
    if (request.method === "POST") {
      const body = await jsonBody(request);
      const act = addLeadActivityTouchpoint(
        leadId,
        body.activityType || "note",
        body.notes || "",
        admin.email || "Customer Support",
        body.title
      );
      return NextResponse.json({ success: true, activity: act }, { status: 201 });
    }
  }

  const crmLeadConvertMatch = joined.match(/^\/admin\/crm\/leads\/([^/]+)\/convert$/);
  if (crmLeadConvertMatch && request.method === "POST") {
    const admin = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager", "customer_support"]);
    const leadId = crmLeadConvertMatch[1];
    const body = await jsonBody(request);
    const converted = convertLeadToBooking(
      leadId,
      {
        bookingNumber: body.bookingNumber,
        bookingId: body.bookingId,
        convertedAmount: Number(body.convertedAmount) || 0,
        notes: body.notes
      },
      admin.email || "Customer Support"
    );
    return NextResponse.json({ success: true, lead: converted });
  }

  const crmLeadDetailMatch = joined.match(/^\/admin\/crm\/leads\/([^/]+)$/);
  if (crmLeadDetailMatch) {
    const admin = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager", "customer_support"]);
    const leadId = crmLeadDetailMatch[1];
    if (request.method === "GET") {
      const lead = getLeadById(leadId);
      if (!lead) return NextResponse.json({ success: false, message: "Lead not found." }, { status: 404 });
      const activities = getLeadActivitiesById(leadId);
      return NextResponse.json({ success: true, lead, activities });
    }
    if (request.method === "PATCH") {
      const body = await jsonBody(request);
      const updated = updateLeadRecord(leadId, body, admin.email || "Customer Support");
      return NextResponse.json({ success: true, lead: updated });
    }
  }

  const leadActivityMatch = joined.match(/^\/admin\/leads\/([^/]+)\/activity$/);
  if (leadActivityMatch) {
    const admin = requireAdminRole(request);
    const leadId = leadActivityMatch[1];
    if (request.method === "GET") {
      return NextResponse.json({ success: true, activities: getLeadActivities(leadId) });
    }
    if (request.method === "POST") {
      const body = await jsonBody(request);
      const created = await addLeadActivity(leadId, body, admin);
      return NextResponse.json({ success: true, activity: created }, { status: 201 });
    }
  }

  // ---------------------------------------------------------------------------
  // TEST MASTER MANAGEMENT (ADMIN)
  // ---------------------------------------------------------------------------
  if (joined === "/admin/tests") {
    const admin = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager"]);
    if (request.method === "GET") {
      const q = searchParams.get("q") || "";
      const category = searchParams.get("category") || "";
      const status = searchParams.get("status") || "";
      const tests = await getAdminTestsList({ q, category, status });
      return NextResponse.json({ success: true, tests, total: tests.length });
    }
    if (request.method === "POST") {
      const body = await jsonBody(request);
      const created = await createAdminTest(body, admin);
      return NextResponse.json({ success: true, test: created }, { status: 201 });
    }
  }

  if (joined === "/admin/tests/bulk-upload" && request.method === "POST") {
    const admin = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager"]);
    const body = await jsonBody(request);
    const rows = Array.isArray(body) ? body : (body.tests || body.rows || []);
    const result = await bulkUpsertAdminTests(rows, admin);
    return NextResponse.json(result);
  }

  if (joined === "/admin/tests/bulk-adjust-prices" && request.method === "POST") {
    const admin = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager"]);
    const body = await jsonBody(request);
    const result = await bulkAdjustAdminTestPrices(body, admin);
    return NextResponse.json(result);
  }

  const adminTestMatch = joined.match(/^\/admin\/tests\/([^/]+)$/);
  if (adminTestMatch) {
    const admin = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager"]);
    const testId = adminTestMatch[1];
    if (request.method === "PATCH") {
      const body = await jsonBody(request);
      const updated = await updateAdminTest(testId, body, admin);
      return NextResponse.json({ success: true, test: updated });
    }
    if (request.method === "DELETE") {
      const result = await deleteAdminTest(testId, admin);
      return NextResponse.json(result);
    }
  }

  // ---------------------------------------------------------------------------
  // BUNDLE DISCOUNT SLABS (PRICING ENGINE ADMIN)
  // ---------------------------------------------------------------------------
  if (joined === "/admin/bundle-slabs") {
    const admin = requireAdminRole(request, ["super_admin", "admin", "manager", "finance_manager"]);
    if (request.method === "GET") {
      const slabs = getAdminBundleSlabs();
      return NextResponse.json({ success: true, slabs, total: slabs.length });
    }
    if (request.method === "POST") {
      const body = await jsonBody(request);
      const created = createAdminBundleSlab(body, admin);
      return NextResponse.json({ success: true, slab: created }, { status: 201 });
    }
  }

  if (joined === "/admin/bundle-slabs/reset" && request.method === "POST") {
    const admin = requireAdminRole(request, ["super_admin", "admin"]);
    const slabs = resetAdminBundleSlabsToDefault(admin);
    return NextResponse.json({ success: true, slabs, message: "Reset to standard configurable slabs." });
  }

  const slabMatch = joined.match(/^\/admin\/bundle-slabs\/([^/]+)$/);
  if (slabMatch) {
    const admin = requireAdminRole(request, ["super_admin", "admin", "manager", "finance_manager"]);
    const slabId = slabMatch[1];
    if (request.method === "PATCH") {
      const body = await jsonBody(request);
      const updated = updateAdminBundleSlab(slabId, body, admin);
      return NextResponse.json({ success: true, slab: updated });
    }
    if (request.method === "DELETE") {
      const result = deleteAdminBundleSlab(slabId, admin);
      return NextResponse.json(result);
    }
  }

  // ---------------------------------------------------------------------------
  // FIXED PACKAGES MANAGEMENT (TYPE 1: FIXED PACKAGES ADMIN)
  // ---------------------------------------------------------------------------
  if (joined === "/admin/packages") {
    const admin = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager"]);
    if (request.method === "GET") {
      const q = searchParams.get("q") || "";
      const category = searchParams.get("category") || "";
      const status = searchParams.get("status") || "";
      const packages = await getAdminPackagesList({ q, category, status });
      return NextResponse.json({ success: true, packages, total: packages.length });
    }
    if (request.method === "POST") {
      const body = await jsonBody(request);
      const created = await createAdminFixedPackage(body, admin);
      return NextResponse.json({ success: true, package: created }, { status: 201 });
    }
  }

  if (joined === "/admin/packages/export") {
    requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager"]);
    const packages = await getAdminPackagesList({});
    const headers = [
      "Package ID",
      "Package Name",
      "Category",
      "Tagline",
      "Badge",
      "Package Type",
      "Selling Price (INR)",
      "Reference Market MRP (INR)",
      "Valid Savings (INR)",
      "Discount (%)",
      "Allow Additional Bundle Discount",
      "Included Tests Count",
      "Included Tests",
      "Target Demographics",
      "Key Highlights",
      "Featured",
      "Catalog Status"
    ];

    const escapeCsv = (str: unknown) => `"${String(str ?? "").replace(/"/g, '""')}"`;

    const rows = packages.map((pkg) => {
      const mrp = pkg.mrp || Math.round(pkg.price * 1.5);
      const savings = mrp > pkg.price ? mrp - pkg.price : 0;
      const discount = mrp > pkg.price ? Math.round((savings / mrp) * 100) : 0;
      const tests = (pkg.overview || []).join("; ");
      const bestFor = (pkg.bestFor || []).join("; ");
      const whyPackage = (pkg.whyPackage || []).join("; ");

      return [
        escapeCsv(pkg.id),
        escapeCsv(pkg.name),
        escapeCsv(pkg.section || "Preventive Health"),
        escapeCsv(pkg.tagline || ""),
        escapeCsv(pkg.badge || ""),
        escapeCsv(pkg.packageType || "fixed"),
        escapeCsv(pkg.price),
        escapeCsv(mrp),
        escapeCsv(savings),
        escapeCsv(`${discount}%`),
        escapeCsv(pkg.allowExtraDiscount ? "Yes" : "No"),
        escapeCsv((pkg.overview || []).length),
        escapeCsv(tests),
        escapeCsv(bestFor),
        escapeCsv(whyPackage),
        escapeCsv(pkg.featured ? "Yes" : "No"),
        escapeCsv(pkg.isActive !== false ? "Active" : "Inactive")
      ].join(",");
    });

    const csvData = "\uFEFF" + [headers.map(escapeCsv).join(","), ...rows].join("\r\n");
    return new NextResponse(csvData, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="scopex_fixed_packages_${new Date().toISOString().slice(0, 10)}.csv"`
      }
    });
  }

  const adminPackageMatch = joined.match(/^\/admin\/packages\/([^/]+)$/);
  if (adminPackageMatch) {
    const admin = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager"]);
    const packageId = adminPackageMatch[1];
    if (request.method === "PATCH") {
      const body = await jsonBody(request);
      const updated = await updateAdminFixedPackage(packageId, body, admin);
      return NextResponse.json({ success: true, package: updated });
    }
    if (request.method === "DELETE") {
      const result = await deleteAdminFixedPackage(packageId, admin);
      return NextResponse.json(result);
    }
  }

  if (joined === "/admin/categories") {
    requireAdminRole(request, ["super_admin", "admin", "manager"]);
    if (request.method === "GET") {
      return NextResponse.json({ success: true, categories: getAdminCategoriesList() });
    }
    if (request.method === "POST") {
      const admin = requireAdminRole(request, ["super_admin", "admin"]);
      const body = await jsonBody(request);
      const cat = createAdminCategory(body, admin);
      return NextResponse.json({ success: true, category: cat }, { status: 201 });
    }
  }

  // ---------------------------------------------------------------------------
  // SERVICE AVAILABILITY (CITIES & PIN CODES)
  // ---------------------------------------------------------------------------
  if (joined === "/admin/service-areas") {
    const admin = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager"]);
    if (request.method === "GET") {
      const city = searchParams.get("city") || undefined;
      const areas = getAdminServiceAreas(city);
      return NextResponse.json({ success: true, areas, total: areas.length });
    }
    if (request.method === "POST") {
      const body = await jsonBody(request);
      const created = createAdminServiceArea(body, admin);
      return NextResponse.json({ success: true, area: created }, { status: 201 });
    }
  }

  const adminServiceAreaMatch = joined.match(/^\/admin\/service-areas\/([^/]+)$/);
  if (adminServiceAreaMatch) {
    const admin = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager"]);
    const areaId = adminServiceAreaMatch[1];
    if (request.method === "PATCH") {
      const body = await jsonBody(request);
      const updated = updateAdminServiceArea(areaId, body, admin);
      return NextResponse.json({ success: true, area: updated });
    }
  }

  if (joined === "/admin/email-logs" && request.method === "GET") {
    requireAdminRole(request);
    return NextResponse.json({ success: true, logs: [] });
  }

  if (joined === "/admin/reports") {
    requireAdminRole(request);
    return NextResponse.json({ success: true, reports: [] });
  }

  // ---------------------------------------------------------------------------
  // PHLEBOTOMIST PORTAL & COLLECTION OPERATIONS
  // ---------------------------------------------------------------------------
  if (joined === "/phlebotomist/jobs" && request.method === "GET") {
    seedInitialJobsIfEmpty();
    const phlebId = searchParams.get("phlebotomistId") || "";
    const statusParam = searchParams.get("status") || "";

    let jobs = Array.from(inMemoryCollectionJobs.values());
    if (phlebId) {
      jobs = jobs.filter((j) => j.phlebotomistId === phlebId);
    }
    if (statusParam) {
      jobs = jobs.filter((j) => j.status.toLowerCase() === statusParam.toLowerCase());
    }

    // Sort by scheduledDate asc, scheduledTime asc
    jobs.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate) || a.scheduledTime.localeCompare(b.scheduledTime));

    // Privacy boundary: expose only minimal required patient collection information
    const restrictedViews = jobs.map(getPhlebotomistJobView);
    return NextResponse.json({ success: true, jobs: restrictedViews, total: restrictedViews.length });
  }

  if (joined === "/phlebotomist/team" && request.method === "GET") {
    seedInitialJobsIfEmpty();
    const city = searchParams.get("city") || "";
    let team = Array.from(inMemoryPhlebotomistTeam.values());
    if (city) {
      team = team.filter((p) => p.city.toLowerCase() === city.toLowerCase());
    }
    return NextResponse.json({ success: true, team });
  }

  const phlebActionMatch = joined.match(/^\/phlebotomist\/jobs\/([^/]+)\/action$/);
  if (phlebActionMatch && request.method === "POST") {
    seedInitialJobsIfEmpty();
    const jobId = phlebActionMatch[1];
    const body = await jsonBody(request);
    const action = body.action as PhlebotomistAction;

    let actorName = body.performedBy || "Phlebotomist Staff";
    try {
      const auth = requireAuthToken(request);
      actorName = auth.email || actorName;
    } catch {
      // Allow simulator in preview
    }

    const updated = updateCollectionJobStatus(jobId, action, {
      performedBy: actorName,
      declineReason: body.declineReason,
      exceptionReason: body.exceptionReason,
      collectionNotes: body.collectionNotes,
      barcodes: body.barcodes,
      vialsCollected: body.vialsCollected,
      temperatureVerified: body.temperatureVerified,
      fastingStatusVerified: body.fastingStatusVerified,
      fastingHoursReported: body.fastingHoursReported,
      destinationLab: body.destinationLab
    });

    return NextResponse.json({
      success: true,
      message: `Job status transitioned to ${updated.status}`,
      job: getPhlebotomistJobView(updated)
    });
  }

  // ---------------------------------------------------------------------------
  // CUSTOMER CARE DESK & COLLECTION DISPATCH
  // ---------------------------------------------------------------------------
  if (joined === "/admin/customer-care/dashboard" && request.method === "GET") {
    seedInitialJobsIfEmpty();
    const allBookings = await getAdminBookingsList({});
    const pendingConfirmations = allBookings.filter((b) => b.booking_status === "new" || b.booking_status === "pending_confirmation");
    const confirmedBookings = allBookings.filter((b) => b.booking_status === "confirmed");
    const cancelledBookings = allBookings.filter((b) => b.booking_status === "cancelled");

    const allJobs = Array.from(inMemoryCollectionJobs.values());
    const activeCollections = allJobs.filter((j) => ["Assigned", "Accepted", "En Route", "Arrived", "Collected"].includes(j.status));
    const exceptions = allJobs.filter((j) => j.inExceptionQueue || j.status === "Exception");

    const allLeads = Array.from(inMemoryLeads.values());
    const todayStr = new Date().toISOString().split("T")[0];
    const followUpsDueToday = allLeads.filter((l) => l.followUpDate && l.followUpDate.startsWith(todayStr) && l.status !== "Closed");

    return NextResponse.json({
      success: true,
      summary: {
        pendingConfirmationsCount: pendingConfirmations.length,
        pendingDispatchCount: confirmedBookings.filter((b) => !b.assigned_phlebotomist_id).length,
        activeCollectionsCount: activeCollections.length,
        exceptionsCount: exceptions.length,
        cancelledCount: cancelledBookings.length,
        followUpsDueTodayCount: followUpsDueToday.length,
        totalCallsLogged: inMemoryCustomerCareCalls.length,
        totalMessagesSent: inMemoryCustomerCareMessages.length
      },
      queues: {
        pendingConfirmations: pendingConfirmations.slice(0, 20),
        pendingDispatch: confirmedBookings.filter((b) => !b.assigned_phlebotomist_id).slice(0, 20),
        cancellations: cancelledBookings.slice(0, 20),
        exceptions: exceptions.slice(0, 20),
        followUpsDueToday: followUpsDueToday.slice(0, 20)
      },
      recentCalls: inMemoryCustomerCareCalls.slice(0, 15),
      recentMessages: inMemoryCustomerCareMessages.slice(0, 15)
    });
  }

  if (joined === "/admin/customer-care/call" && request.method === "POST") {
    const body = await jsonBody(request);
    let performedBy = body.performedBy || "Customer Care Agent";
    try {
      const auth = requireAuthToken(request);
      performedBy = auth.email || performedBy;
    } catch {
      // Allow fallback
    }

    const record = recordCustomerCareCall({
      targetId: body.targetId,
      targetKind: body.targetKind || "booking",
      callType: body.callType || "outbound",
      outcome: body.outcome || "connected_interested",
      durationSeconds: Number(body.durationSeconds) || 60,
      notes: body.notes || "Customer care conversation logged.",
      scheduledFollowUpDate: body.scheduledFollowUpDate,
      performedBy
    });

    return NextResponse.json({ success: true, record });
  }

  if (joined === "/admin/customer-care/message" && request.method === "POST") {
    const body = await jsonBody(request);
    let performedBy = body.performedBy || "Customer Care Agent";
    try {
      const auth = requireAuthToken(request);
      performedBy = auth.email || performedBy;
    } catch {
      // Allow fallback
    }

    const record = recordCustomerCareMessage({
      targetId: body.targetId,
      targetKind: body.targetKind || "booking",
      channel: body.channel || "whatsapp",
      templateTitle: body.templateTitle || "Slot Confirmation",
      messageContent: body.messageContent || "Hello from SCOPEX Diagnostics Customer Care.",
      performedBy
    });

    return NextResponse.json({ success: true, record });
  }

  if (joined === "/admin/customer-care/confirm-booking" && request.method === "POST") {
    const body = await jsonBody(request);
    let performedBy = body.performedBy || "Customer Care";
    try {
      const auth = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager", "customer_support"]);
      performedBy = auth.email || performedBy;
    } catch {
      // Allow fallback
    }

    const confirmed = confirmBookingByCustomerCare(body.bookingId, body.notes || "Slot and patient details verified over phone.", performedBy);
    return NextResponse.json({ success: true, booking: confirmed });
  }

  if (joined === "/admin/customer-care/cancel-booking" && request.method === "POST") {
    const body = await jsonBody(request);
    let performedBy = body.performedBy || "Customer Care";
    try {
      const auth = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager", "customer_support"]);
      performedBy = auth.email || performedBy;
    } catch {
      // Allow fallback
    }

    const cancelled = cancelBookingByCustomerCare(body.bookingId, body.reason || "Patient cancelled appointment.", performedBy);
    return NextResponse.json({ success: true, booking: cancelled });
  }

  if (joined === "/admin/customer-care/transfer-to-collection" && request.method === "POST") {
    seedInitialJobsIfEmpty();
    const body = await jsonBody(request);
    let performedBy = body.performedBy || "Customer Care";
    try {
      const auth = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager", "customer_support"]);
      performedBy = auth.email || performedBy;
    } catch {
      // Allow fallback
    }

    const result = transferCaseToCollection({
      bookingId: body.bookingId,
      bookingNumber: body.bookingNumber,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      patientName: body.patientName,
      patientAge: body.patientAge,
      patientGender: body.patientGender,
      address: body.address,
      pincode: body.pincode,
      city: body.city,
      scheduledDate: body.scheduledDate,
      scheduledTime: body.scheduledTime,
      testNames: body.testNames,
      fastingRequired: body.fastingRequired,
      specialInstructions: body.specialInstructions,
      allocationMode: body.allocationMode || "auto",
      targetPhlebotomistId: body.targetPhlebotomistId,
      performedBy
    });

    return NextResponse.json({
      success: true,
      job: getPhlebotomistJobView(result.job),
      allocation: result.allocation
    });
  }

  if (joined === "/admin/allocation/exceptions" && request.method === "GET") {
    seedInitialJobsIfEmpty();
    const exceptions = Array.from(inMemoryCollectionJobs.values()).filter((j) => j.inExceptionQueue || j.status === "Exception");
    return NextResponse.json({ success: true, exceptions, total: exceptions.length });
  }

  if (joined === "/admin/allocation/reallocate" && request.method === "POST") {
    seedInitialJobsIfEmpty();
    const body = await jsonBody(request);
    const job = inMemoryCollectionJobs.get(body.jobId);
    if (!job) throw new Error("Job not found.");

    let performedBy = body.performedBy || "Dispatcher";
    try {
      const auth = requireAdminRole(request, ["super_admin", "admin", "booking_manager", "customer_support"]);
      performedBy = auth.email || performedBy;
    } catch {
      // Allow fallback
    }

    if (body.allocationMode === "manual" && body.targetPhlebotomistId) {
      const phleb = inMemoryPhlebotomistTeam.get(body.targetPhlebotomistId);
      if (!phleb) throw new Error("Phlebotomist not found.");
      phleb.assignedCount += 1;
      job.phlebotomistId = phleb.id;
      job.phlebotomistName = phleb.name;
      job.phlebotomistPhone = phleb.phone;
      job.status = "Assigned";
      job.inExceptionQueue = false;
      job.exceptionReason = null;
      job.assignedAt = new Date().toISOString();
      job.updatedAt = new Date().toISOString();
      job.statusHistory.unshift({
        status: "Assigned",
        timestamp: new Date().toISOString(),
        performedBy,
        notes: `Manually reallocated to ${phleb.name} (${phleb.phone}).`
      });

      return NextResponse.json({ success: true, job: getPhlebotomistJobView(job), message: `Reallocated to ${phleb.name}` });
    }

    // Automatic reallocation
    const alloc = runAutomaticAllocation({
      city: job.city,
      pincode: job.pincode,
      scheduledTime: job.scheduledTime,
      slotWindow: job.slotWindow,
      requiredSkills: job.requiredSkills
    });

    if (alloc.assignedPhlebotomist) {
      job.phlebotomistId = alloc.assignedPhlebotomist.id;
      job.phlebotomistName = alloc.assignedPhlebotomist.name;
      job.phlebotomistPhone = alloc.assignedPhlebotomist.phone;
      job.status = "Assigned";
      job.inExceptionQueue = false;
      job.exceptionReason = null;
      job.assignedAt = new Date().toISOString();
      job.updatedAt = new Date().toISOString();
      job.statusHistory.unshift({
        status: "Assigned",
        timestamp: new Date().toISOString(),
        performedBy,
        notes: `Auto-reallocated: ${alloc.reason}`
      });

      return NextResponse.json({ success: true, job: getPhlebotomistJobView(job), message: alloc.reason });
    }

    job.exceptionReason = alloc.reason;
    job.updatedAt = new Date().toISOString();
    return NextResponse.json({ success: false, message: alloc.reason, job: getPhlebotomistJobView(job) }, { status: 422 });
  }

  // ---------------------------------------------------------------------------
  // PARTNER LABORATORY MANAGEMENT MODULE
  // ---------------------------------------------------------------------------

  // Phase 1: Partner Labs Registration & Multi-City Locations
  if (joined === "/admin/partner-labs") {
    const admin = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager"]);
    if (request.method === "GET") {
      const status = searchParams.get("status") || "all";
      const city = searchParams.get("city") || "all";
      const labs = listPartnerLabs({ status, city });
      return NextResponse.json({ success: true, labs, total: labs.length });
    }
    if (request.method === "POST") {
      const body = await jsonBody(request);
      const created = registerPartnerLab(body, admin);
      return NextResponse.json({ success: true, lab: created }, { status: 201 });
    }
  }

  const partnerLabMatch = joined.match(/^\/admin\/partner-labs\/([^/]+)$/);
  if (partnerLabMatch) {
    const admin = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager"]);
    const labId = partnerLabMatch[1];
    if (request.method === "GET") {
      const lab = getPartnerLabById(labId);
      if (!lab) return NextResponse.json({ success: false, message: "Partner lab not found" }, { status: 404 });
      return NextResponse.json({ success: true, lab });
    }
    if (request.method === "PATCH") {
      const body = await jsonBody(request);
      const updated = updatePartnerLab(labId, body, admin);
      return NextResponse.json({ success: true, lab: updated });
    }
  }

  const partnerLocationMatch = joined.match(/^\/admin\/partner-labs\/([^/]+)\/locations$/);
  if (partnerLocationMatch && request.method === "POST") {
    const admin = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager"]);
    const labId = partnerLocationMatch[1];
    const body = await jsonBody(request);
    const location = addPartnerLabLocation(labId, body, admin);
    return NextResponse.json({ success: true, location }, { status: 201 });
  }

  const partnerLocationEditMatch = joined.match(/^\/admin\/partner-labs\/([^/]+)\/locations\/([^/]+)$/);
  if (partnerLocationEditMatch && request.method === "PATCH") {
    const admin = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager"]);
    const labId = partnerLocationEditMatch[1];
    const locId = partnerLocationEditMatch[2];
    const body = await jsonBody(request);
    const location = updatePartnerLabLocation(labId, locId, body, admin);
    return NextResponse.json({ success: true, location });
  }

  // Phase 2: Partner Lab Test Master & Bulk Excel/CSV Upload
  if (joined === "/admin/partner-test-master") {
    const admin = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager"]);
    if (request.method === "GET") {
      const partnerLabId = searchParams.get("partnerLabId") || "all";
      const locationId = searchParams.get("locationId") || "all";
      const city = searchParams.get("city") || "all";
      const applicability = searchParams.get("applicability") || "all";
      const status = searchParams.get("status") || "all";
      const search = searchParams.get("search") || "";
      const mappings = listPartnerTestMappings({ partnerLabId, locationId, city, applicability, status, search });
      return NextResponse.json({ success: true, mappings, total: mappings.length });
    }
    if (request.method === "POST") {
      const body = await jsonBody(request);
      const mapping = createOrUpdateManualPartnerTestMapping(body, admin);
      return NextResponse.json({ success: true, mapping }, { status: 201 });
    }
  }

  if (joined === "/admin/partner-labs/tests-and-rates" && request.method === "GET") {
    requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager", "customer_support"]);
    const partnerLabId = searchParams.get("partnerLabId") || "";
    const locationId = searchParams.get("locationId") || "";
    const rawTests = searchParams.get("testIds") || "";
    const testIds = rawTests ? rawTests.split(",").map((s) => s.trim()).filter(Boolean) : [];
    const result = getPartnerLocationTestsAndRates({ partnerLabId, locationId, testIds });
    return NextResponse.json({ success: true, ...result });
  }

  if (joined === "/admin/partner-test-master/template" && request.method === "GET") {
    requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager"]);
    const template = generatePartnerTestExcelTemplate();
    return NextResponse.json({ success: true, ...template });
  }

  if (joined === "/admin/partner-test-master/validate-bulk" && request.method === "POST") {
    requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager"]);
    const body = await jsonBody(request);
    const preview = validateBulkPartnerTestUpload(body);
    return NextResponse.json({ success: true, preview });
  }

  if (joined === "/admin/partner-test-master/commit-bulk" && request.method === "POST") {
    const admin = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager"]);
    const body = await jsonBody(request);
    const result = commitBulkPartnerTestImport({
      preview: body.preview,
      duplicateStrategy: body.duplicateStrategy || "skip",
      adminUser: admin
    });
    return NextResponse.json({ success: true, result });
  }

  // Phase 3 & 4: Sample Assignment, Handover & Status Lifecycle
  if (joined === "/admin/partner-samples") {
    const auth = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager", "customer_support", "phlebotomist"]);
    seedInitialPartnerLabDataIfEmpty();
    let samples = Array.from(inMemoryPartnerSamples.values());

    if (auth.role === "phlebotomist") {
      samples = samples.filter((sample) => {
        const booking = inMemoryBookings.get(sample.bookingId);
        return booking?.assigned_phlebotomist_id === auth.userId || booking?.phlebotomist_id === auth.userId;
      });
    }

    const partnerLabId = searchParams.get("partnerLabId");
    const status = searchParams.get("status");
    const q = searchParams.get("q")?.toLowerCase();

    if (partnerLabId && partnerLabId !== "all") {
      samples = samples.filter((s) => s.partnerLabId === partnerLabId);
    }
    if (status && status !== "all") {
      samples = samples.filter((s) => s.status.toLowerCase() === status.toLowerCase());
    }
    if (q) {
      samples = samples.filter(
        (s) =>
          s.bookingNumber.toLowerCase().includes(q) ||
          s.scopexSampleId.toLowerCase().includes(q) ||
          (s.partnerBarcode && s.partnerBarcode.toLowerCase().includes(q)) ||
          s.patientName.toLowerCase().includes(q) ||
          s.patientPhone.includes(q)
      );
    }

    return NextResponse.json({ success: true, samples, total: samples.length });
  }

  if (joined === "/admin/partner-samples/assign" && request.method === "POST") {
    const admin = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager"]);
    const body = await jsonBody(request);
    const assigned = assignSampleToPartnerLab({
      bookingId: body.bookingId,
      scopexSampleId: body.scopexSampleId,
      partnerLabId: body.partnerLabId,
      locationId: body.locationId,
      remarks: body.remarks,
      adminUser: admin
    });
    return NextResponse.json({ success: true, sample: assigned });
  }

  if (joined === "/admin/partner-samples/reassign" && request.method === "POST") {
    const admin = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager"]);
    const body = await jsonBody(request);
    const reassigned = reassignPartnerSample({
      sampleRecordId: body.sampleRecordId,
      newPartnerLabId: body.newPartnerLabId,
      newLocationId: body.newLocationId,
      reason: body.reason,
      adminUser: admin
    });
    return NextResponse.json({ success: true, sample: reassigned });
  }

  const sampleHandoverMatch = joined.match(/^\/admin\/partner-samples\/([^/]+)\/handover$/);
  if (sampleHandoverMatch && request.method === "POST") {
    seedInitialPartnerLabDataIfEmpty();
    const sampleRecordId = sampleHandoverMatch[1];
    const body = await jsonBody(request);
    const auth = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager", "phlebotomist"]);
    const performedBy = auth.email || auth.userId;

    const updated = recordPartnerLabBarcodeHandover({
      sampleRecordId,
      partnerBarcode: body.partnerBarcode,
      barcodePhotoUrl: body.barcodePhotoUrl,
      handoverGpsCoordinates: body.handoverGpsCoordinates,
      remarks: body.remarks,
      performedBy
    });
    return NextResponse.json({ success: true, sample: updated });
  }

  const sampleVerifyMatch = joined.match(/^\/admin\/partner-samples\/([^/]+)\/verify$/);
  if (sampleVerifyMatch && request.method === "POST") {
    const admin = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager"]);
    const sampleRecordId = sampleVerifyMatch[1];
    const body = await jsonBody(request);
    const updated = verifyPartnerSampleHandoverByAdmin({
      sampleRecordId,
      correctedPartnerBarcode: body.correctedPartnerBarcode,
      verified: body.verified !== false,
      remarks: body.remarks,
      adminUser: admin
    });
    return NextResponse.json({ success: true, sample: updated });
  }

  const sampleStatusMatch = joined.match(/^\/admin\/partner-samples\/([^/]+)\/status$/);
  if (sampleStatusMatch && request.method === "PATCH") {
    const admin = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager"]);
    const sampleRecordId = sampleStatusMatch[1];
    const body = await jsonBody(request);
    const updated = updatePartnerSampleStatus({
      sampleRecordId,
      newStatus: body.newStatus,
      remarks: body.remarks,
      exceptionType: body.exceptionType,
      adminUser: admin
    });
    return NextResponse.json({ success: true, sample: updated });
  }

  // Phase 5: Report Upload & Publication
  if (joined === "/admin/partner-reports") {
    requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager", "report_manager"]);
    seedInitialPartnerLabDataIfEmpty();
    let reports = Array.from(inMemoryPartnerReports.values());
    const status = searchParams.get("status");
    const q = searchParams.get("q")?.toLowerCase();

    if (status && status !== "all") {
      reports = reports.filter((r) => r.status.toLowerCase() === status.toLowerCase());
    }
    if (q) {
      reports = reports.filter(
        (r) =>
          r.bookingNumber.toLowerCase().includes(q) ||
          r.scopexSampleId.toLowerCase().includes(q) ||
          (r.partnerBarcode && r.partnerBarcode.toLowerCase().includes(q)) ||
          r.patientName.toLowerCase().includes(q) ||
          r.patientPhone.includes(q)
      );
    }

    return NextResponse.json({ success: true, reports, total: reports.length });
  }

  if (joined === "/admin/partner-reports/upload" && request.method === "POST") {
    const admin = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager", "report_manager"]);
    const body = await jsonBody(request);
    const report = uploadPartnerLabReport({
      bookingId: body.bookingId,
      scopexSampleId: body.scopexSampleId,
      partnerBarcode: body.partnerBarcode,
      testNames: body.testNames || ["Comprehensive Test Panel"],
      reportType: body.reportType || "individual",
      fileUrl: body.fileUrl || "/reports/sample-report.pdf",
      fileName: body.fileName || "ScopeX_Diagnostic_Report.pdf",
      remarks: body.remarks,
      adminUser: admin
    });
    return NextResponse.json({ success: true, report });
  }

  const reportVerifyPublishMatch = joined.match(/^\/admin\/partner-reports\/([^/]+)\/verify-publish$/);
  if (reportVerifyPublishMatch && request.method === "POST") {
    const admin = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager", "report_manager"]);
    const reportId = reportVerifyPublishMatch[1];
    const body = await jsonBody(request);
    const report = verifyAndPublishPartnerReport({
      reportId,
      action: body.action,
      remarks: body.remarks,
      adminUser: admin
    });
    return NextResponse.json({ success: true, report });
  }

  // Phase 6: Financial Dashboard & Analytics
  if (joined === "/admin/partner-financials" && request.method === "GET") {
    requireAdminRole(request, ["super_admin", "admin", "finance_manager"]);
    const partnerLabId = searchParams.get("partnerLabId") || "all";
    const city = searchParams.get("city") || "all";
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const metrics = calculatePartnerFinancialMetrics({ partnerLabId, city, startDate, endDate });
    return NextResponse.json({ success: true, ...metrics });
  }

  // Phase 7: Partner Invoices & Payments
  if (joined === "/admin/partner-invoices") {
    const admin = requireAdminRole(request, ["super_admin", "admin", "finance_manager"]);
    if (request.method === "GET") {
      seedInitialPartnerLabDataIfEmpty();
      const partnerLabId = searchParams.get("partnerLabId") || "all";
      let invoices = Array.from(inMemoryPartnerInvoices.values());
      if (partnerLabId !== "all") {
        invoices = invoices.filter((i) => i.partnerLabId === partnerLabId);
      }
      return NextResponse.json({ success: true, invoices, total: invoices.length });
    }
    if (request.method === "POST") {
      const body = await jsonBody(request);
      const invoice = recordPartnerInvoice(body, admin);
      return NextResponse.json({ success: true, invoice }, { status: 201 });
    }
  }

  const partnerInvoicePayMatch = joined.match(/^\/admin\/partner-invoices\/([^/]+)\/payments$/);
  if (partnerInvoicePayMatch && request.method === "POST") {
    const admin = requireAdminRole(request, ["super_admin", "admin", "finance_manager"]);
    const invoiceId = partnerInvoicePayMatch[1];
    const body = await jsonBody(request);
    const payment = recordPartnerPayment({
      invoiceId,
      paymentAmount: Number(body.paymentAmount),
      paymentDate: body.paymentDate,
      paymentMode: body.paymentMode || "NEFT",
      transactionReference: body.transactionReference,
      receiptUrl: body.receiptUrl,
      remarks: body.remarks
    }, admin);
    return NextResponse.json({ success: true, payment }, { status: 201 });
  }

  return NextResponse.json({ success: false, message: `Route ${joined} not found.` }, { status: 404 });
}

// Proxies to external backend if configured, otherwise serves through native Next.js handlers
async function proxyBackend(request: NextRequest, context: Context) {
  const backendUrl = getBackendBaseUrl();
  const { path = [] } = await context.params;

  if (!backendUrl) {
    try {
      return await handleBackendRequest(request, path);
    } catch (error) {
      return apiErrorResponse(error, "Backend operation failed.");
    }
  }

  const targetUrl = new URL(`/${path.join("/")}`, backendUrl);
  targetUrl.search = request.nextUrl.search;
  const fallbackRequest = request.clone();

  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  const contentType = request.headers.get("content-type");

  if (authorization) headers.set("authorization", authorization);
  if (contentType) headers.set("content-type", contentType);

  try {
    const backendResponse = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: METHODS_WITHOUT_BODY.has(request.method) ? undefined : await request.arrayBuffer(),
      cache: "no-store"
    });

    return new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      headers: {
        "content-type": backendResponse.headers.get("content-type") || "application/json"
      }
    });
  } catch {
    // If external service is unreachable, gracefully fall back to native Next.js backend
    try {
      return await handleBackendRequest(fallbackRequest, path);
    } catch (fallbackError) {
      return apiErrorResponse(fallbackError, "Backend operation failed.");
    }
  }
}

export const GET = proxyBackend;
export const POST = proxyBackend;
export const PATCH = proxyBackend;
export const PUT = proxyBackend;
export const DELETE = proxyBackend;
