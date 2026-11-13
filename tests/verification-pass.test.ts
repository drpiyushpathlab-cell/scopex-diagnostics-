import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  authenticateAdmin,
  createAdminStaff,
  createAdminTest,
  createBooking,
  deleteAdminTest,
  getAdminTestsList,
  inMemoryBookings,
  inMemoryTests,
  requireAdminRole,
  requireAuthToken,
  updateAdminTest
} from "@/lib/backend-service";
import { signAppToken } from "@/backend/src/lib/jwt";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import {
  approveClinicalReview,
  buildPageStructuredData,
  createOrUpdateSeoPage,
  deleteSeoPage,
  getSeoPageBySlug,
  listSeoPages,
  publishSeoPage,
  submitForClinicalReview
} from "@/lib/seo-service";

// ---------------------------------------------------------------------------
// CHECK 5: AUTHENTICATION & ROLE PERMISSIONS
// ---------------------------------------------------------------------------

test("Check 5: authenticateAdmin issues JWT for valid credentials and rejects invalid credentials", async () => {
  const result = await authenticateAdmin("admin@scopexdiagnostics.in", "ScopexAdmin#2026");
  assert.ok(result.token);
  assert.equal(result.admin.role, "super_admin");
  assert.equal(result.admin.email, "admin@scopexdiagnostics.in");

  await assert.rejects(
    () => authenticateAdmin("admin@scopexdiagnostics.in", "WrongPassword123"),
    /Invalid email or password/
  );
});

test("Check 5: requireAuthToken and requireAdminRole enforce RBAC and block patient role from admin routes", async () => {
  const unauthedReq = new Request("http://localhost:3000/api/backend/admin/overview");
  assert.throws(() => requireAuthToken(unauthedReq), /Authentication token required/);

  const patientToken = signAppToken({
    userId: "pat-001",
    patientId: "pat-001",
    mobile: "9998887776",
    role: "patient"
  });
  const patientReq = new Request("http://localhost:3000/api/backend/admin/overview", {
    headers: { Authorization: `Bearer ${patientToken}` }
  });

  // Patient must be rejected even when allowedRoles is omitted
  assert.throws(() => requireAdminRole(patientReq), /Access denied/);
  assert.throws(() => requireAdminRole(patientReq, ["admin", "booking_manager"]), /Access denied/);

  const financeToken = signAppToken({
    userId: "adm-fin-001",
    email: "finance@scopexdiagnostics.in",
    role: "finance_manager"
  });
  const financeReq = new Request("http://localhost:3000/api/backend/admin/revenue", {
    headers: { Authorization: `Bearer ${financeToken}` }
  });

  assert.equal(requireAdminRole(financeReq, ["super_admin", "admin", "finance_manager"]).role, "finance_manager");
  assert.throws(() => requireAdminRole(financeReq, ["super_admin"]), /Access denied/);

  // Only super_admin can create admin staff
  await assert.rejects(
    () =>
      createAdminStaff(
        { email: "test.staff@scopexdiagnostics.in", password: "Password#123", role: "customer_support" },
        { userId: "adm-fin-001", email: "finance@scopexdiagnostics.in", role: "finance_manager" }
      ),
    /Only super administrators/
  );
});

// ---------------------------------------------------------------------------
// CHECK 6: TEST CATALOG CRUD
// ---------------------------------------------------------------------------

test("Check 6: Test catalog CRUD creates, lists/filters, updates, prevents duplicates, and soft-deactivates tests", async () => {
  const adminUser = {
    userId: "admin-super-001",
    email: "admin@scopexdiagnostics.in",
    role: "super_admin"
  };

  const uniqueId = `verify-crp-test-${Date.now()}`;

  try {
    const created = await createAdminTest(
      {
        id: uniqueId,
        code: uniqueId,
        name: "Verification CRP Panel",
        price: 450,
        mrp: 900,
        discountCapPercent: 20,
        category: "Blood",
        group: "Basic Tests",
        specimenType: "Serum",
        tat: "12 Hrs"
      },
      adminUser
    );

    assert.equal(created.id, uniqueId);
    assert.equal(created.discount, 50);
    assert.equal(created.isActive, true);

    // Duplicate ID/slug should be rejected with 409
    await assert.rejects(
      () =>
        createAdminTest(
          {
            id: uniqueId,
            name: "Duplicate CRP Panel",
            price: 450
          },
          adminUser
        ),
      /already exists/
    );

    // Search filter
    const listFiltered = await getAdminTestsList({ q: "Verification CRP Panel", status: "active" });
    assert.ok(listFiltered.some((t) => t.id === uniqueId));

    // Update
    const updated = await updateAdminTest(
      uniqueId,
      { price: 540, mrp: 900, discountCapPercent: 15 },
      adminUser
    );
    assert.equal(updated.price, 540);
    assert.equal(updated.discount, 40);
    assert.equal(updated.discountCapPercent, 15);

    // Soft deactivate
    const delRes = await deleteAdminTest(uniqueId, adminUser);
    assert.equal(delRes.success, true);
    assert.equal(inMemoryTests.get(uniqueId)?.isActive, false);

    const inactiveList = await getAdminTestsList({ q: uniqueId, status: "inactive" });
    assert.ok(inactiveList.some((t) => t.id === uniqueId));
  } finally {
    inMemoryTests.delete(uniqueId);
  }
});

// ---------------------------------------------------------------------------
// CHECK 13: CHECKOUT & PAYMENT VERIFICATION
// ---------------------------------------------------------------------------

test("Check 13: createBooking computes authoritative server quote from frontend patient tests[] payload", async () => {
  const booking = await createBooking({
    customer: {
      fullName: "Aarav Mehta",
      phone: "9876543210",
      email: "aarav@example.com",
      city: "Indore",
      address: "14 Vijay Nagar, Indore",
      pincode: "452001",
      preferredDate: "2026-11-20",
      preferredTime: "07:00 AM - 08:00 AM"
    },
    bookingPatients: [
      {
        patientId: "self",
        name: "Aarav Mehta",
        relation: "Self",
        age: "32",
        gender: "Male",
        tests: [{ id: "cbc-esr" }, { id: "hba1c" }]
      }
    ],
    collectionType: "HOME_COLLECTION",
    paymentMethod: "online"
  });

  try {
    assert.equal(booking.success, true);
    assert.ok(booking.orderId);
    assert.equal(booking.orderId, booking.bookingId);
    assert.ok(booking.bookingNumber.startsWith("SCX-"));
    // CBC (300) + HbA1c (500) = 800 subtotal -> >= 2 tests bundle slab applies & >= 600 free collection
    assert.equal(booking.quote.subtotal, 800);
    assert.equal(booking.quote.homeCollectionFee, 0);
    assert.ok(booking.payableAmount > 0 && booking.payableAmount <= 800);
    assert.ok(inMemoryBookings.has(booking.bookingId));
  } finally {
    inMemoryBookings.delete(booking.bookingId);
  }
});

test("Check 13: verifyRazorpaySignature validates HMAC-SHA256 signatures and rejects tampered payloads", () => {
  const prevSecret = process.env.RAZORPAY_KEY_SECRET;
  const prevKeyId = process.env.RAZORPAY_KEY_ID;
  process.env.RAZORPAY_KEY_ID = "rzp_test_verify_key";
  process.env.RAZORPAY_KEY_SECRET = "test_razorpay_secret_key_123";

  try {
    const orderId = "order_P9xTestOrder01";
    const paymentId = "pay_P9xTestPayment01";
    const validSig = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    assert.equal(
      verifyRazorpaySignature({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: validSig
      }),
      true
    );

    assert.equal(
      verifyRazorpaySignature({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: "tampered_signature_0000000000000000000000000000000000000000000000000000"
      }),
      false
    );
  } finally {
    if (prevSecret === undefined) delete process.env.RAZORPAY_KEY_SECRET;
    else process.env.RAZORPAY_KEY_SECRET = prevSecret;

    if (prevKeyId === undefined) delete process.env.RAZORPAY_KEY_ID;
    else process.env.RAZORPAY_KEY_ID = prevKeyId;
  }
});

// ---------------------------------------------------------------------------
// CHECK 14: SEO METADATA, STRUCTURED DATA & SITEMAP VALIDATION
// ---------------------------------------------------------------------------

test("Check 14: sitemap.xml and robots.txt produce valid canonical entries and exclude noindex/draft pages", () => {
  const robotsOutput = robots();
  assert.ok(Array.isArray(robotsOutput.rules));
  assert.ok(robotsOutput.sitemap);

  // Create a temporary noindex page through clinical governance workflow and ensure it does not leak into sitemap
  const created = createOrUpdateSeoPage({
    slug: "temp-hidden-noindex-check",
    canonicalPath: "/temp-hidden-noindex-check",
    kind: "custom",
    title: "Hidden Internal Test Page | ScopeX Diagnostics",
    metaDescription: "Internal verification page that must remain excluded from XML sitemap output.",
    status: "draft",
    robots: "noindex, nofollow"
  });

  try {
    submitForClinicalReview(created.id);
    approveClinicalReview(created.id, {
      reviewedBy: "Dr. Piyush Pathlab",
      reviewerCredentials: "MBBS, MD Pathology"
    });
    publishSeoPage(created.id);

    const entries = sitemap();
    assert.ok(entries.length > 10);
    const urls = entries.map((e) => e.url);
    assert.equal(new Set(urls).size, urls.length, "Sitemap URLs must be unique");
    assert.ok(urls.some((u) => u.endsWith("/tests")));
    assert.ok(urls.some((u) => u.endsWith("/packages")));
    assert.equal(
      urls.some((u) => u.includes("temp-hidden-noindex-check")),
      false,
      "noindex pages must be excluded from sitemap"
    );

    const publishedPages = listSeoPages({ status: "published" });
    assert.ok(publishedPages.length > 0);
    const samplePage = getSeoPageBySlug("packages/health-360-pro") || publishedPages[0];
    const schemas = buildPageStructuredData(samplePage);
    assert.equal(schemas["@context"], "https://schema.org");
    assert.ok(Array.isArray(schemas["@graph"]) && schemas["@graph"].length >= 2);
  } finally {
    deleteSeoPage(created.id);
  }
});
