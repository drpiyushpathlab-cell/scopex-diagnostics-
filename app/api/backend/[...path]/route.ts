import { NextRequest, NextResponse } from "next/server";
import { getBackendBaseUrl } from "../../_utils/backend";
import { apiErrorResponse } from "../../_utils/errors";
import { authorizeBackendRoute } from "@/lib/backend-route-auth";
import { ADMIN_PERMISSION_GROUPS, ADMIN_PERMISSION_KEYS, enforceStoredAdminPermission, validateBuiltInRole, validatePermissionList } from "@/lib/admin-permissions";
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
  getAdminPackagesList,
  getAdminServiceAreas,
  getAdminTestsList,
  getAssignmentSettings,
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
import { getOrCreateBookingPaymentLink } from "@/lib/supabase-booking-payment";
import {
  authenticatePhlebotomist,
  assignBookingCollectionWorkflow,
  listAssignedCollectionJobs,
  listCollectionAssignmentOptions,
  listPartnerHandoverSamples,
  setPartnerSampleIdentifiers,
  submitPartnerSampleHandover,
  updateCollectionJobInDatabase
} from "@/lib/supabase-phlebotomy";
import { getCustomerCareDashboardFromDatabase, recordCustomerCareInteraction, updateBookingFromCustomerCare } from "@/lib/supabase-customer-care";
import { HttpError } from "@/backend/src/lib/http-error";
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
  addCrmLeadActivityToDatabase,
  assignCrmLeadInDatabase,
  bulkAutoAssignCrmLeadsFromDatabase,
  convertCrmLeadToBookingInDatabase,
  createCrmLeadInDatabase,
  getCrmLeadFromDatabase,
  listCrmLeadActivitiesFromDatabase,
  listCrmLeadsFromDatabase,
  listCrmTeamFromDatabase,
  getCrmAnalyticsFromDatabase,
  updateCrmLeadInDatabase,
  upsertCrmTeamMemberInDatabase
} from "@/lib/supabase-crm";
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

function getClientIp(request: Request): string | undefined {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined;
}

function csvCell(value: unknown) {
  const raw = value == null ? "" : String(value);
  return `"${raw.replace(/"/g, '""')}"`;
}

function toCsv(rows: Array<Record<string, unknown>>, columns: string[]) {
  return [columns.map(csvCell).join(","), ...rows.map((row) => columns.map((key) => csvCell(row[key])).join(","))].join("\r\n");
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

  if (request.method === "POST" && joined === "/phlebotomist/login") {
    const body = await jsonBody(request);
    const result = await authenticatePhlebotomist(String(body.email || ""), String(body.password || ""));
    return NextResponse.json({ success: true, ...result });
  }

  if (request.method === "POST" && joined === "/auth/logout") {
    return NextResponse.json({ success: true, message: "Logged out successfully." });
  }

  const routeAuth = authorizeBackendRoute(request, joined);
  if (routeAuth && hasSupabasePublicConfig()) {
    await enforceStoredAdminPermission(joined, request.method, routeAuth.userId, routeAuth.role);
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
  if ((joined === "/admin/overview" || joined === "/admin/dashboard") && request.method === "GET") {
    requireAdminRole(request);
    const supabase = getSupabaseServiceClient();
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - 29);
    periodStart.setHours(0, 0, 0, 0);
    const periodStartIso = periodStart.toISOString();
    const bookingStatuses = ["STARTED", "DETAILS_ENTERED", "SLOT_SELECTED", "PAYMENT_STARTED", "PENDING_PAYMENT", "PAID", "CONFIRMED", "ASSIGNED", "COLLECTION_STARTED", "SAMPLE_COLLECTED", "PROCESSING", "REPORT_READY", "COMPLETED", "CANCELLED", "REFUNDED", "ABANDONED"];
    const [bookings, patients, reports, recentBookings, recentUploads, periodBookings, periodPayments, ...statusResults] = await Promise.all([
      supabase.from("bookings").select("id", { count: "exact", head: true }),
      supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "patient").eq("is_active", true),
      supabase.from("report_uploads").select("id", { count: "exact", head: true }),
      supabase.from("bookings").select("id,booking_number,contact_name,booking_status,created_at").order("created_at", { ascending: false }).limit(8),
      supabase.from("report_uploads").select("id,file_name,patient_name,mobile_number,created_at").order("created_at", { ascending: false }).limit(8),
      supabase.from("bookings").select("created_at,booking_status").gte("created_at", periodStartIso).order("created_at", { ascending: true }),
      supabase.from("payments").select("amount,created_at").eq("status", "PAID").gte("created_at", periodStartIso).order("created_at", { ascending: true }),
      ...bookingStatuses.map((status) => supabase.from("bookings").select("id", { count: "exact", head: true }).eq("booking_status", status))
    ]);
    if (bookings.error || patients.error || reports.error || recentBookings.error || recentUploads.error || periodBookings.error || periodPayments.error || statusResults.some((result) => result.error)) {
      throw new HttpError(500, "Unable to load live admin dashboard data.");
    }

    const rawStatusCounts = Object.fromEntries(bookingStatuses.map((status, index) => [status.toLowerCase(), statusResults[index].count || 0]));
    const statusCounts = {
      new: rawStatusCounts.started || 0,
      pending_confirmation: (rawStatusCounts.details_entered || 0) + (rawStatusCounts.slot_selected || 0) + (rawStatusCounts.payment_started || 0) + (rawStatusCounts.pending_payment || 0),
      confirmed: rawStatusCounts.confirmed || 0,
      sample_collected: rawStatusCounts.sample_collected || 0,
      processing: rawStatusCounts.processing || 0,
      report_ready: rawStatusCounts.report_ready || 0,
      completed: rawStatusCounts.completed || 0,
      cancelled: rawStatusCounts.cancelled || 0
    };
    let revenue = 0;
    for (let page = 0; ; page += 1) {
      const { data, error } = await supabase.from("payments").select("amount").eq("status", "PAID").range(page * 1000, page * 1000 + 999);
      if (error) throw new HttpError(500, "Unable to load reconciled payment totals.");
      for (const payment of data || []) revenue += Number(payment.amount || 0);
      if (!data || data.length < 1000) break;
    }
    const metrics = [
      { title: "Total users", value: String(patients.count || 0), note: "Active patient accounts" },
      { title: "Total bookings", value: String(bookings.count || 0), note: "Live booking records" },
      { title: "Pending confirmation", value: String(statusCounts.pending_confirmation + statusCounts.new), note: "Awaiting confirmation" },
      { title: "Completed bookings", value: String(statusCounts.completed), note: "Completed bookings" },
      { title: "Uploaded reports", value: String(reports.count || 0), note: "Report records" },
      { title: "Active users", value: String(patients.count || 0), note: "Active patient accounts" },
      { title: "Paid revenue", value: `₹${revenue.toLocaleString("en-IN")}`, note: "Captured payments only" }
    ];
    const daily = new Map<string, { bookings: number; completedBookings: number; revenue: number }>();
    for (const booking of periodBookings.data || []) {
      const date = String(booking.created_at || "").slice(0, 10);
      if (!date) continue;
      const item = daily.get(date) || { bookings: 0, completedBookings: 0, revenue: 0 };
      item.bookings += 1;
      if (String(booking.booking_status).toUpperCase() === "COMPLETED") item.completedBookings += 1;
      daily.set(date, item);
    }
    for (const payment of periodPayments.data || []) {
      const date = String(payment.created_at || "").slice(0, 10);
      if (!date) continue;
      const item = daily.get(date) || { bookings: 0, completedBookings: 0, revenue: 0 };
      item.revenue += Number(payment.amount || 0);
      daily.set(date, item);
    }
    let cumulativeRevenue = 0;
    const dailyAnalytics = Array.from({ length: 30 }, (_, index) => {
      const day = new Date(periodStart);
      day.setDate(periodStart.getDate() + index);
      const date = day.toISOString().slice(0, 10);
      const values = daily.get(date) || { bookings: 0, completedBookings: 0, revenue: 0 };
      cumulativeRevenue += values.revenue;
      return {
        date,
        displayDate: day.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        ...values,
        cumulativeRevenue
      };
    });
    return NextResponse.json({
      success: true,
      metrics,
      recentActivities: [],
      recentBookings: recentBookings.data || [],
      recentUploads: recentUploads.data || [],
      dailyAnalytics,
      statusCounts,
      unavailableSources: ["audit_logs"]
    });
  }

  if (joined === "/admin/bookings-management") {
    requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager", "customer_support"]);
    const q = searchParams.get("q") || "";
    const status = searchParams.get("status") || "";
    const paymentStatus = searchParams.get("paymentStatus") || "";
    const city = searchParams.get("city") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const collectionDate = searchParams.get("collectionDate") || "";
    const exportCsv = searchParams.get("format") === "csv";
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = exportCsv ? 1000 : Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 50)));
    const supabase = getSupabaseServiceClient();
    let query = supabase.from("bookings").select("*", { count: "exact" }).order("created_at", { ascending: false });
    if (status) query = query.eq("booking_status", status.toUpperCase());
    if (paymentStatus) query = query.eq("payment_status", paymentStatus.toUpperCase());
    if (city) query = query.ilike("city", `%${city.replace(/[,%()\\]/g, " ").trim()}%`);
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateFrom)) query = query.gte("created_at", `${dateFrom}T00:00:00.000Z`);
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) query = query.lt("created_at", `${dateTo}T23:59:59.999Z`);
    if (/^\d{4}-\d{2}-\d{2}$/.test(collectionDate)) query = query.eq("preferred_date", collectionDate);
    const safeQ = q.replace(/[,%()"\\]/g, " ").trim();
    if (safeQ) query = query.or(`booking_number.ilike.%${safeQ}%,contact_name.ilike.%${safeQ}%,contact_phone.ilike.%${safeQ}%,city.ilike.%${safeQ}%`);
    const start = (page - 1) * pageSize;
    const { data, error, count } = await query.range(start, start + pageSize - 1);
    if (error) throw new HttpError(500, "Unable to load live bookings.");
    if (exportCsv) {
      const columns = ["booking_number", "created_at", "contact_name", "contact_phone", "city", "address", "preferred_date", "preferred_time", "subtotal", "discount_total", "payable_amount", "payment_status", "booking_status", "phlebotomist_id"];
      return new NextResponse(toCsv((data || []) as Array<Record<string, unknown>>, columns), {
        headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": "attachment; filename=scopex-bookings.csv" }
      });
    }
    return NextResponse.json({ success: true, rows: data || [], total: count ?? (data || []).length, page, pageSize });
  }

  const adminPaymentLinkMatch = joined.match(/^\/admin\/bookings-management\/([^/]+)\/payment-link$/);
  if (adminPaymentLinkMatch && request.method === "POST") {
    const admin = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager", "finance_manager"]);
    const result = await getOrCreateBookingPaymentLink(adminPaymentLinkMatch[1], admin.email || admin.userId);
    return NextResponse.json({ success: true, ...result }, { status: result.reused ? 200 : 201 });
  }

  const adminBookingMatch = joined.match(/^\/admin\/bookings-management\/([^/]+)$/);
  if (adminBookingMatch) {
    const admin = requireAdminRole(request);
    const bookingId = adminBookingMatch[1];
    if (request.method === "PATCH") {
      const body = await jsonBody(request);
      const allowedFields: Record<string, string> = {
        booking_status: "booking_status",
        preferred_date: "preferred_date",
        preferred_time: "preferred_time",
        assigned_phlebotomist_id: "phlebotomist_id",
        internal_notes: "notes"
      };
      const patch = Object.fromEntries(
        Object.entries(allowedFields).filter(([key]) => Object.prototype.hasOwnProperty.call(body, key)).map(([key, column]) => [column, body[key]])
      );
      if (!Object.keys(patch).length) throw new HttpError(400, "No supported booking fields were provided.");
      const bookingStatuses = new Set(["STARTED", "DETAILS_ENTERED", "SLOT_SELECTED", "PAYMENT_STARTED", "PENDING_PAYMENT", "CONFIRMED", "ASSIGNED", "COLLECTION_STARTED", "SAMPLE_COLLECTED", "PROCESSING", "REPORT_READY", "COMPLETED", "CANCELLED", "REFUNDED", "ABANDONED"]);
      if (patch.booking_status && !bookingStatuses.has(String(patch.booking_status).toUpperCase())) {
        throw new HttpError(400, "Unsupported booking status.");
      }
      if (patch.booking_status) patch.booking_status = String(patch.booking_status).toUpperCase();
      patch.updated_at = new Date().toISOString();
      const { data, error } = await getSupabaseServiceClient().from("bookings").update(patch).eq("id", bookingId).select("*").maybeSingle();
      if (error) throw new HttpError(500, "Unable to update booking.");
      if (!data) throw new HttpError(404, "Booking not found.");
      logAuditAction({ actorEmail: admin.email || admin.userId, role: admin.role, action: "update_booking", entityType: "bookings", entityId: bookingId, newVal: patch });
      return NextResponse.json({ success: true, data });
    }
  }

  if (joined === "/admin/revenue" && request.method === "GET") {
    requireAdminRole(request, ["super_admin", "admin", "finance_manager"]);
    const supabase = getSupabaseServiceClient();
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 50)));
    const start = (page - 1) * pageSize;
    const { data: payments, error, count } = await supabase.from("payments").select("id,booking_id,provider_order_id,provider_payment_id,status,amount,currency,created_at", { count: "exact" }).order("created_at", { ascending: false }).range(start, start + pageSize - 1);
    if (error) throw new HttpError(500, "Unable to load payment reconciliation records.");
    const bookingIds = [...new Set((payments || []).map((payment) => payment.booking_id).filter(Boolean))];
    const bookingNumbers = new Map<string, string>();
    if (bookingIds.length) {
      const { data: bookings, error: bookingError } = await supabase.from("bookings").select("id,booking_number").in("id", bookingIds);
      if (bookingError) throw new HttpError(500, "Unable to load payment booking references.");
      for (const booking of bookings || []) bookingNumbers.set(booking.id, booking.booking_number || booking.id);
    }
    const rows = (payments || []).map((payment) => ({
      ...payment,
      booking_id: bookingNumbers.get(payment.booking_id) || payment.booking_id,
      status: String(payment.status || "").toLowerCase()
    }));
    let totalRevenue = 0;
    for (let pageIndex = 0; ; pageIndex += 1) {
      const { data, error: revenueError } = await supabase.from("payments").select("amount").eq("status", "PAID").range(pageIndex * 1000, pageIndex * 1000 + 999);
      if (revenueError) throw new HttpError(500, "Unable to load reconciled payment totals.");
      for (const payment of data || []) totalRevenue += Number(payment.amount || 0);
      if (!data || data.length < 1000) break;
    }
    return NextResponse.json({ success: true, rows, total: count || 0, page, pageSize, totalRevenue });
  }

  if (joined === "/admin/sessions" && request.method === "GET") {
    requireAdminRole(request, ["super_admin", "admin"]);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 25)));
    const start = (page - 1) * pageSize;
    const { data, error, count } = await getSupabaseServiceClient().from("login_logs").select("id,user_id,admin_id,email,role,event,created_at", { count: "exact" }).order("created_at", { ascending: false }).range(start, start + pageSize - 1);
    if (error) throw new HttpError(503, "Unable to load persisted admin session history.");
    return NextResponse.json({ success: true, rows: data || [], total: count || 0, page, pageSize, source: "supabase" });
  }

  if (joined === "/admin/audit-logs" && request.method === "GET") {
    requireAdminRole(request);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 50)));
    const start = (page - 1) * pageSize;
    const { data, error, count } = await getSupabaseServiceClient().from("audit_logs").select("id,actor_id,actor_email,role,action,entity_type,entity_id,ip_address,metadata,created_at", { count: "exact" }).order("created_at", { ascending: false }).range(start, start + pageSize - 1);
    if (error) throw new HttpError(503, "Unable to load persisted audit history.");
    return NextResponse.json({ success: true, logs: data || [], total: count || 0, page, pageSize, source: "supabase" });
  }

  if (joined === "/admin/users" && request.method === "GET") {
    requireAdminRole(request, ["super_admin", "admin"]);
    const { data, error } = await getSupabaseServiceClient().from("users").select("id,phone,mobile,email,role,is_active,created_at").eq("role", "patient").order("created_at", { ascending: false }).limit(1000);
    if (error) throw new HttpError(500, "Unable to load patient accounts.");
    return NextResponse.json({ success: true, rows: data || [] });
  }

  if (joined === "/admin/roles-permissions") {
    const admin = requireAdminRole(request, ["super_admin"]);
    if (request.method === "GET") {
      const supabase = getSupabaseServiceClient();
      const { data: permissionRows, error } = await supabase.from("admin_role_permissions").select("role,permission,allowed");
      if (error) throw new HttpError(503, "Unable to load saved role permissions.");
      const allowedByRole = new Map<string, string[]>();
      for (const row of permissionRows || []) {
        if (row.allowed) allowedByRole.set(row.role, [...(allowedByRole.get(row.role) || []), row.permission]);
      }
      const roleNames = ["super_admin", "admin", "manager", "booking_manager", "report_manager", "finance_manager", "customer_support"];
      const roles = roleNames.map((role) => ({
        id: role,
        role,
        display_name: role.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
        description: "Built-in administrator role",
        permissions: allowedByRole.get(role) || [],
        is_system: true
      }));
      const { data: roleAssignments, error: rolesError } = await supabase.from("admin_roles").select("user_id,role");
      if (rolesError) throw new HttpError(503, "Unable to load admin role assignments.");
      const overridesResult = await supabase.from("admin_user_permission_overrides").select("user_id,permission,allowed");
      if (overridesResult.error) throw new HttpError(503, "Unable to load user permission overrides.");
      const customByUser = new Map<string, { allowed: string[]; exists: boolean }>();
      for (const row of overridesResult.data || []) {
        const current = customByUser.get(row.user_id) || { allowed: [], exists: true };
        if (row.allowed) current.allowed.push(row.permission);
        customByUser.set(row.user_id, current);
      }
      const roleByUser = new Map((roleAssignments || []).map((row) => [row.user_id, row.role]));
      const authUsers: Array<{ id: string; email?: string; created_at?: string; banned_until?: string; user_metadata?: Record<string, unknown> }> = [];
      for (let page = 1; ; page += 1) {
        const { data, error: authError } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
        if (authError) throw new HttpError(503, "Unable to load admin account records.");
        authUsers.push(...data.users);
        if (data.users.length < 1000) break;
      }
      const users = authUsers.filter((user) => roleByUser.has(user.id)).map((user) => {
        const custom = customByUser.get(user.id);
        return {
          id: user.id,
          email: user.email || "",
          role: roleByUser.get(user.id),
          name: String(user.user_metadata?.full_name || user.email?.split("@")[0] || "Admin"),
          is_active: !user.banned_until || Date.parse(user.banned_until) < Date.now(),
          created_at: user.created_at || null,
          custom_permissions_enabled: Boolean(custom),
          custom_permissions: custom?.allowed || []
        };
      });
      return NextResponse.json({ success: true, catalog: ADMIN_PERMISSION_GROUPS, roles, users });
    }
    if (request.method === "POST") throw new HttpError(400, "Only supported built-in administrator roles can be configured.");
  }

  const rolePermissionMatch = joined.match(/^\/admin\/roles-permissions\/([^/]+)$/);
  if (rolePermissionMatch && request.method === "PATCH") {
    const admin = requireAdminRole(request, ["super_admin"]);
    const role = validateBuiltInRole(decodeURIComponent(rolePermissionMatch[1]));
    if (role === "super_admin") throw new HttpError(400, "Super administrator access is fixed and cannot be narrowed here.");
    const body = await jsonBody(request);
    if (body.role && body.role !== role) throw new HttpError(400, "Built-in role identifiers cannot be changed.");
    const permissions = new Set(validatePermissionList(body.permissions));
    const now = new Date().toISOString();
    const rows = ADMIN_PERMISSION_KEYS.map((permission) => ({ role, permission, allowed: permissions.has(permission), updated_by: admin.userId, updated_at: now }));
    const { error } = await getSupabaseServiceClient().from("admin_role_permissions").upsert(rows, { onConflict: "role,permission" });
    if (error) throw new HttpError(503, "Unable to save administrator role permissions.");
    return NextResponse.json({ success: true, role, permissions: [...permissions] });
  }
  if (rolePermissionMatch && request.method === "DELETE") throw new HttpError(400, "Built-in administrator roles cannot be deleted.");

  if (joined === "/admin/roles-permissions/assign-users" && request.method === "POST") {
    const admin = requireAdminRole(request, ["super_admin"]);
    const body = await jsonBody(request);
    const role = validateBuiltInRole(body.role);
    if (!Array.isArray(body.adminIds) || body.adminIds.length === 0 || body.adminIds.some((id: unknown) => typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id))) {
      throw new HttpError(400, "Select one or more valid administrator accounts.");
    }
    const ids = [...new Set(body.adminIds as string[])];
    const supabase = getSupabaseServiceClient();
    const { data: selected, error: selectedError } = await supabase.from("admin_roles").select("user_id,role").in("user_id", ids);
    if (selectedError || selected?.length !== ids.length) throw new HttpError(404, "One or more administrator accounts were not found.");
    if (role !== "super_admin" && selected.some((row) => row.role === "super_admin")) {
      const { count, error } = await supabase.from("admin_roles").select("user_id", { count: "exact", head: true }).eq("role", "super_admin");
      if (error) throw new HttpError(503, "Unable to verify super administrator assignments.");
      if ((count || 0) <= selected.filter((row) => row.role === "super_admin").length || ids.includes(admin.userId)) {
        throw new HttpError(409, "Keep at least one active super administrator and do not remove your own super administrator access.");
      }
    }
    const { error } = await supabase.from("admin_roles").upsert(ids.map((user_id) => ({ user_id, role })), { onConflict: "user_id" });
    if (error) throw new HttpError(503, "Unable to update administrator role assignments.");
    return NextResponse.json({ success: true, assigned: ids.length, role });
  }

  const adminUserPermissionsMatch = joined.match(/^\/admin\/admin-users\/([^/]+)$/);
  if (adminUserPermissionsMatch && request.method === "PATCH") {
    const admin = requireAdminRole(request, ["super_admin"]);
    const userId = decodeURIComponent(adminUserPermissionsMatch[1]);
    if (!/^[0-9a-f-]{36}$/i.test(userId)) throw new HttpError(400, "Invalid administrator account ID.");
    const body = await jsonBody(request);
    if (typeof body.custom_permissions_enabled !== "boolean") throw new HttpError(400, "Choose whether custom permissions are enabled.");
    const supabase = getSupabaseServiceClient();
    const { data: target, error: targetError } = await supabase.from("admin_roles").select("user_id").eq("user_id", userId).maybeSingle();
    if (targetError) throw new HttpError(503, "Unable to verify the target administrator account.");
    if (!target) throw new HttpError(404, "Administrator account not found.");
    if (!body.custom_permissions_enabled) {
      const { error } = await supabase.from("admin_user_permission_overrides").delete().eq("user_id", userId);
      if (error) throw new HttpError(503, "Unable to clear custom permissions.");
      return NextResponse.json({ success: true, custom_permissions_enabled: false, custom_permissions: [] });
    }
    const permissions = new Set(validatePermissionList(body.custom_permissions));
    const now = new Date().toISOString();
    const rows = ADMIN_PERMISSION_KEYS.map((permission) => ({ user_id: userId, permission, allowed: permissions.has(permission), updated_by: admin.userId, updated_at: now }));
    const { error } = await supabase.from("admin_user_permission_overrides").upsert(rows, { onConflict: "user_id,permission" });
    if (error) throw new HttpError(503, "Unable to save custom administrator permissions.");
    return NextResponse.json({ success: true, custom_permissions_enabled: true, custom_permissions: [...permissions] });
  }

  if (joined === "/admin/admin-users") {
    const admin = requireAdminRole(request, ["super_admin"]);
    if (request.method === "GET") {
      const supabase = getSupabaseServiceClient();
      const { data: roleRows, error: roleError } = await supabase.from("admin_roles").select("user_id,role");
      if (roleError) throw new HttpError(500, "Unable to load admin role assignments.");
      const roleByUser = new Map((roleRows || []).map((row) => [row.user_id, row.role]));
      const authUsers: Array<{ id: string; email?: string; created_at?: string; banned_until?: string; user_metadata?: Record<string, unknown> }> = [];
      for (let page = 1; ; page += 1) {
        const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) throw new HttpError(500, "Unable to load admin account records.");
        authUsers.push(...data.users);
        if (data.users.length < 1000) break;
      }
      const users = authUsers.filter((user) => roleByUser.has(user.id)).map((user) => ({
        id: user.id,
        email: user.email || "",
        role: roleByUser.get(user.id),
        name: String(user.user_metadata?.full_name || user.email?.split("@")[0] || "Admin"),
        is_active: !user.banned_until || Date.parse(user.banned_until) < Date.now(),
        created_at: user.created_at || null
      }));
      return NextResponse.json({ success: true, users });
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

      const result = await listCrmLeadsFromDatabase({
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
      const result = await createCrmLeadInDatabase(body, admin.email || admin.userId);
      return NextResponse.json({ success: true, ...result }, { status: 201 });
    }
  }

  if (joined === "/admin/crm/reports") {
    requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager", "customer_support"]);
    const timeframeDays = Number(searchParams.get("timeframeDays")) || 30;
    const report = await getCrmAnalyticsFromDatabase(timeframeDays);
    return NextResponse.json({ success: true, report });
  }

  if (joined === "/admin/crm/team") {
    requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager", "customer_support"]);
    if (request.method === "GET") {
      return NextResponse.json({ success: true, team: await listCrmTeamFromDatabase() });
    }
    if (request.method === "POST") {
      const body = await jsonBody(request);
      const member = await upsertCrmTeamMemberInDatabase(body);
      return NextResponse.json({ success: true, member }, { status: 201 });
    }
  }

  if (joined === "/admin/crm/leads/bulk-auto-assign" && request.method === "POST") {
    const admin = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager", "customer_support"]);
    const result = await bulkAutoAssignCrmLeadsFromDatabase(admin.email || admin.userId);
    return NextResponse.json({ success: true, ...result });
  }

  const crmLeadAssignMatch = joined.match(/^\/admin\/crm\/leads\/([^/]+)\/assign$/);
  if (crmLeadAssignMatch && request.method === "POST") {
    const admin = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager", "customer_support"]);
    const leadId = crmLeadAssignMatch[1];
    const body = await jsonBody(request);
    const result = await assignCrmLeadInDatabase(leadId, String(body.targetEmployeeId || ""), String(body.reason || ""), admin.email || admin.userId, false);
    return NextResponse.json({ success: true, lead: result.lead });
  }

  const crmLeadAutoAssignMatch = joined.match(/^\/admin\/crm\/leads\/([^/]+)\/auto-assign$/);
  if (crmLeadAutoAssignMatch && request.method === "POST") {
    const admin = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager", "customer_support"]);
    const leadId = crmLeadAutoAssignMatch[1];
    const lead = await getCrmLeadFromDatabase(leadId);
    if (!lead) return NextResponse.json({ success: false, message: "Lead not found." }, { status: 404 });
    const result = await assignCrmLeadInDatabase(leadId, null, "Automatic assignment requested.", "Auto-Assignment Engine", true);
    return NextResponse.json({ success: result.assigned, lead: result.lead, assignment: { assigned: result.assigned } }, { status: result.assigned ? 200 : 422 });
  }

  const crmLeadActivityMatch = joined.match(/^\/admin\/crm\/leads\/([^/]+)\/activity$/);
  if (crmLeadActivityMatch) {
    const admin = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager", "customer_support"]);
    const leadId = crmLeadActivityMatch[1];
    if (request.method === "GET") {
      return NextResponse.json({ success: true, activities: await listCrmLeadActivitiesFromDatabase(leadId) });
    }
    if (request.method === "POST") {
      const body = await jsonBody(request);
      const act = await addCrmLeadActivityToDatabase(leadId, body, admin.email || admin.userId);
      return NextResponse.json({ success: true, activity: act }, { status: 201 });
    }
  }

  const crmLeadConvertMatch = joined.match(/^\/admin\/crm\/leads\/([^/]+)\/convert$/);
  if (crmLeadConvertMatch && request.method === "POST") {
    const admin = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager", "customer_support"]);
    const leadId = crmLeadConvertMatch[1];
    const body = await jsonBody(request);
    const converted = await convertCrmLeadToBookingInDatabase(leadId, body, admin.email || admin.userId);
    return NextResponse.json({ success: true, lead: converted });
  }

  const crmLeadDetailMatch = joined.match(/^\/admin\/crm\/leads\/([^/]+)$/);
  if (crmLeadDetailMatch) {
    const admin = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager", "customer_support"]);
    const leadId = crmLeadDetailMatch[1];
    if (request.method === "GET") {
      const lead = await getCrmLeadFromDatabase(leadId);
      if (!lead) return NextResponse.json({ success: false, message: "Lead not found." }, { status: 404 });
      const activities = await listCrmLeadActivitiesFromDatabase(leadId);
      return NextResponse.json({ success: true, lead, activities });
    }
    if (request.method === "PATCH") {
      const body = await jsonBody(request);
      const updated = await updateCrmLeadInDatabase(leadId, body, admin.email || admin.userId);
      return NextResponse.json({ success: true, lead: updated });
    }
  }

  const leadActivityMatch = joined.match(/^\/admin\/leads\/([^/]+)\/activity$/);
  if (leadActivityMatch) {
    const admin = requireAdminRole(request);
    const leadId = leadActivityMatch[1];
    if (request.method === "GET") {
      return NextResponse.json({ success: true, activities: await listCrmLeadActivitiesFromDatabase(leadId) });
    }
    if (request.method === "POST") {
      const body = await jsonBody(request);
      const created = await addCrmLeadActivityToDatabase(leadId, body, admin.email || admin.userId);
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
      return NextResponse.json({ success: true, categories: await getAdminCategoriesList() });
    }
    if (request.method === "POST") {
      const admin = requireAdminRole(request, ["super_admin", "admin"]);
      const body = await jsonBody(request);
      const cat = await createAdminCategory(body, admin);
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
      const areas = await getAdminServiceAreas(city);
      return NextResponse.json({ success: true, areas, total: areas.length });
    }
    if (request.method === "POST") {
      const body = await jsonBody(request);
      const created = await createAdminServiceArea(body, admin);
      return NextResponse.json({ success: true, area: created }, { status: 201 });
    }
  }

  const adminServiceAreaMatch = joined.match(/^\/admin\/service-areas\/([^/]+)$/);
  if (adminServiceAreaMatch) {
    const admin = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager"]);
    const areaId = adminServiceAreaMatch[1];
    if (request.method === "PATCH") {
      const body = await jsonBody(request);
      const updated = await updateAdminServiceArea(areaId, body, admin);
      return NextResponse.json({ success: true, area: updated });
    }
  }

  if (joined === "/admin/email-logs" && request.method === "GET") {
    requireAdminRole(request);
    const supabase = getSupabaseServiceClient();
    let query = supabase.from("notification_logs").select("id,recipient,template,status,error_message,sent_at,created_at").eq("channel", "email").order("created_at", { ascending: false }).limit(200);
    const q = (searchParams.get("q") || "").replace(/[,%()"\\]/g, " ").trim();
    const status = (searchParams.get("status") || "").toLowerCase();
    const date = searchParams.get("date") || "";
    if (q) query = query.or(`recipient.ilike.%${q}%,template.ilike.%${q}%`);
    if (status === "success") query = query.eq("status", "sent");
    if (status === "failed") query = query.eq("status", "failed");
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      query = query.gte("created_at", `${date}T00:00:00.000Z`).lt("created_at", `${date}T23:59:59.999Z`);
    }
    const { data, error } = await query;
    if (error) throw new HttpError(500, "Unable to load email delivery logs.");
    const rows = (data || []).map((row) => ({
      id: row.id,
      recipient_email: row.recipient,
      subject: row.template,
      event_type: row.template,
      status: row.status === "sent" ? "success" : row.status === "failed" ? "failed" : "pending",
      sent_at: row.sent_at,
      error_message: row.error_message,
      created_at: row.created_at
    }));
    if (searchParams.get("format") === "csv") {
      return new NextResponse(toCsv(rows, ["id", "recipient_email", "subject", "event_type", "status", "sent_at", "error_message", "created_at"]), {
        headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": "attachment; filename=scopex-email-logs.csv" }
      });
    }
    return NextResponse.json({ success: true, rows, total: rows.length, source: "notification_logs" });
  }

  if ((joined === "/admin/reports" || joined === "/admin/report-uploads") && request.method === "GET") {
    requireAdminRole(request);
    const supabase = getSupabaseServiceClient();
    let query = supabase.from("report_uploads").select("id,booking_id,booking_code,user_id,patient_name,mobile_number,file_name,file_size,mime_type,file_data,uploaded_by,created_at", { count: "exact" }).order("created_at", { ascending: false });
    const q = (searchParams.get("q") || "").replace(/[,%()"\\]/g, " ").trim();
    const date = searchParams.get("date") || "";
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") || 25)));
    if (q) query = query.or(`booking_code.ilike.%${q}%,patient_name.ilike.%${q}%,mobile_number.ilike.%${q}%,file_name.ilike.%${q}%`);
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      query = query.gte("created_at", `${date}T00:00:00.000Z`).lt("created_at", `${date}T23:59:59.999Z`);
    }
    const start = (page - 1) * pageSize;
    const { data, error, count } = await query.range(start, start + pageSize - 1);
    if (error) throw new HttpError(500, "Unable to load uploaded report records.");
    return NextResponse.json({ success: true, reports: data || [], total: count || 0, page, pageSize });
  }

  // ---------------------------------------------------------------------------
  // PHLEBOTOMIST PORTAL & COLLECTION OPERATIONS
  // ---------------------------------------------------------------------------
  if (joined === "/admin/phlebotomist-assignment-options" && request.method === "GET") {
    requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager"]);
    return NextResponse.json({ success: true, ...(await listCollectionAssignmentOptions()) });
  }

  if (joined === "/phlebotomist/jobs" && request.method === "GET") {
    const auth = requireAdminRole(request, ["phlebotomist"]);
    const result = await listAssignedCollectionJobs(auth.userId);
    const statusParam = searchParams.get("status")?.toLowerCase();
    const jobs = statusParam ? result.jobs.filter((job: any) => job.status.toLowerCase() === statusParam) : result.jobs;
    return NextResponse.json({ success: true, phlebotomist: result.phlebotomist, jobs, total: jobs.length });
  }

  if (joined === "/phlebotomist/team" && request.method === "GET") {
    requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager", "customer_support"]);
    const { phlebotomists } = await listCollectionAssignmentOptions();
    return NextResponse.json({ success: true, team: phlebotomists });
  }

  const phlebActionMatch = joined.match(/^\/phlebotomist\/jobs\/([^/]+)\/action$/);
  if (phlebActionMatch && request.method === "POST") {
    const jobId = phlebActionMatch[1];
    const body = await jsonBody(request);
    const action = body.action as PhlebotomistAction;
    const auth = requireAdminRole(request, ["phlebotomist"]);
    const updated = await updateCollectionJobInDatabase({
      jobId, actorId: auth.userId, action, notes: body.collectionNotes,
      exceptionReason: body.declineReason || body.exceptionReason,
      temperatureVerified: body.temperatureVerified,
      fastingVerified: body.fastingStatusVerified,
      fastingHours: body.fastingHoursReported
    });

    return NextResponse.json({
      success: true, message: `Job status transitioned to ${updated.status}`, job: updated
    });
  }

  // ---------------------------------------------------------------------------
  // CUSTOMER CARE DESK & COLLECTION DISPATCH
  // ---------------------------------------------------------------------------
  if (joined === "/admin/customer-care/dashboard" && request.method === "GET") {
    requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager", "customer_support"]);
    return NextResponse.json({ success: true, ...(await getCustomerCareDashboardFromDatabase()) });
  }

  if (joined === "/admin/customer-care/call" && request.method === "POST") {
    const admin = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager", "customer_support"]);
    const body = await jsonBody(request);
    const record = await recordCustomerCareInteraction({
      targetId: String(body.targetId || ""),
      targetKind: body.targetKind === "lead" ? "lead" : "booking",
      interactionKind: "call",
      channel: "phone",
      outcome: String(body.outcome || body.callType || "connected_interested"),
      durationSeconds: Math.max(0, Math.min(86400, Number(body.durationSeconds) || 0)),
      notes: String(body.notes || "Customer care call logged."),
      followUpAt: body.scheduledFollowUpDate || null,
      performedBy: admin.email || admin.userId
    });
    return NextResponse.json({ success: true, record }, { status: 201 });
  }

  if (joined === "/admin/customer-care/message" && request.method === "POST") {
    const admin = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager", "customer_support"]);
    const body = await jsonBody(request);
    const record = await recordCustomerCareInteraction({
      targetId: String(body.targetId || ""),
      targetKind: body.targetKind === "lead" ? "lead" : "booking",
      interactionKind: "message",
      channel: ["whatsapp", "sms", "email"].includes(body.channel) ? body.channel : "whatsapp",
      subject: String(body.templateTitle || ""),
      notes: String(body.messageContent || ""),
      performedBy: admin.email || admin.userId
    });
    return NextResponse.json({ success: true, record, message: "Message recorded in the queue; no provider delivery was attempted." }, { status: 201 });
  }

  if (joined === "/admin/customer-care/confirm-booking" && request.method === "POST") {
    const admin = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager", "customer_support"]);
    const body = await jsonBody(request);
    const confirmed = await updateBookingFromCustomerCare({ bookingId: String(body.bookingId || ""), action: "confirm", notes: String(body.notes || "Slot and patient details verified over phone."), performedBy: admin.email || admin.userId });
    return NextResponse.json({ success: true, booking: confirmed });
  }

  if (joined === "/admin/customer-care/cancel-booking" && request.method === "POST") {
    const admin = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager", "customer_support"]);
    const body = await jsonBody(request);
    const cancelled = await updateBookingFromCustomerCare({ bookingId: String(body.bookingId || ""), action: "cancel", notes: String(body.reason || "Patient cancelled appointment."), performedBy: admin.email || admin.userId });
    return NextResponse.json({ success: true, booking: cancelled });
  }

  if (joined === "/admin/customer-care/transfer-to-collection" && request.method === "POST") {
    const body = await jsonBody(request);
    const auth = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager"]);
    const scheduledAt = body.scheduledAt || (body.scheduledDate && body.scheduledTime ? `${body.scheduledDate}T${body.scheduledTime}` : "");
    const job = await assignBookingCollectionWorkflow({
      bookingId: String(body.bookingId || ""),
      phlebotomistId: String(body.targetPhlebotomistId || ""),
      partnerLabId: String(body.partnerLabId || ""),
      partnerLocationId: String(body.partnerLocationId || body.locationId || ""),
      scheduledAt: String(scheduledAt), actorId: auth.userId, remarks: body.specialInstructions
    });
    return NextResponse.json({ success: true, job, message: "Booking assigned with partner lab and location." });
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
  if (joined === "/admin/partner-samples/pending-handover" && request.method === "GET") {
    requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager"]);
    const rows = await listPartnerHandoverSamples();
    const samples = rows.map((sample: any) => {
      const booking = Array.isArray(sample.booking) ? sample.booking[0] : sample.booking;
      const patient = Array.isArray(booking?.patients) ? booking.patients[0] : booking?.patients;
      const lab = Array.isArray(sample.partner_lab) ? sample.partner_lab[0] : sample.partner_lab;
      const location = Array.isArray(sample.partner_location) ? sample.partner_location[0] : sample.partner_location;
      const collectionJob = Array.isArray(sample.collectionJob) ? sample.collectionJob[0] : sample.collectionJob;
      const phlebotomist = Array.isArray(collectionJob?.phlebotomist) ? collectionJob.phlebotomist[0] : collectionJob?.phlebotomist;
      return {
        ...sample, bookingNumber: booking?.booking_number || sample.booking_id,
        id: sample.id, scopexSampleId: sample.scopex_sample_id,
        partnerLabId: sample.partner_lab_id, locationId: sample.location_id,
        partnerBarcode: sample.partner_barcode, partnerAccessionNumber: sample.partner_accession_number,
        testNames: sample.test_names || [], testIds: sample.test_ids || [],
        applicableRateSnapshot: sample.rate_snapshot || [], totalProcessingCost: Number(sample.total_processing_cost || 0),
        adminVerified: sample.admin_verified,
        statusHistory: (sample.handover_status_history || []).map((event: any, index: number, all: any[]) => ({
          id: `${sample.id}-${index}`, previousStatus: all[index + 1]?.status || "Awaiting Collection",
          newStatus: event.status, updatedBy: event.actorId || "System", updatedAt: event.at || "", remarks: ""
        })),
        patientName: patient?.name || "Patient", patientPhone: patient?.mobile || "",
        partnerLabName: lab?.name || sample.partner_lab_id, locationCity: location?.city || "",
        locationAddress: location?.full_address || "", handoverStatus: sample.handover_status,
        phlebotomistName: phlebotomist?.name || "", collectionDateTime: collectionJob?.collected_at || collectionJob?.scheduled_at || "",
        status: sample.handover_status,
        barcodePhotoUrl: sample.handoverPhotos?.[0]?.signedUrl || sample.barcode_photo_url || ""
      };
    });
    return NextResponse.json({ success: true, samples, total: samples.length });
  }

  if (joined === "/admin/partner-samples") {
    const auth = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager", "customer_support"]);
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
    requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager"]);
    return NextResponse.json({
      success: false, code: "COMBINED_ASSIGNMENT_REQUIRED",
      error: "Assign the phlebotomist, partner laboratory, and location together from Customer Care dispatch."
    }, { status: 409 });
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
    const sampleRecordId = sampleHandoverMatch[1];
    const auth = requireAdminRole(request, ["phlebotomist"]);
    const form = await request.formData();
    const photos = form.getAll("photos").filter((entry): entry is File => entry instanceof File);
    const updated = await submitPartnerSampleHandover({
      sampleRecordId, actorId: auth.userId,
      remarks: String(form.get("remarks") || ""), files: photos
    });
    return NextResponse.json({ success: true, sample: updated });
  }

  const sampleVerifyMatch = joined.match(/^\/admin\/partner-samples\/([^/]+)\/verify$/);
  if (sampleVerifyMatch && request.method === "POST") {
    const admin = requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager"]);
    const sampleRecordId = sampleVerifyMatch[1];
    const body = await jsonBody(request);
    const updated = await setPartnerSampleIdentifiers({
      sampleRecordId, actorId: admin.userId,
      barcode: body.partnerBarcode || body.correctedPartnerBarcode,
      accessionNumber: body.accessionNumber,
      verify: body.verified === true,
      remarks: body.remarks || body.verificationNotes
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
