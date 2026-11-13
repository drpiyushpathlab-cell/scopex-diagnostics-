import crypto from "crypto";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getSupabaseServiceClient, hasSupabasePublicConfig } from "@/lib/supabase";
import { HttpError } from "@/backend/src/lib/http-error";
import { signAppToken, verifyAppToken, type AppJwtPayload } from "@/backend/src/lib/jwt";
import { packagesData, testsData, type PackageItem, type TestItem } from "@/lib/data";
import {
  calculateRealPriceQuote,
  defaultBundleSlabs,
  type BundleDiscountSlab,
  type PriceSnapshot
} from "@/lib/pricing";
import {
  calculateAdjustedItem,
  validateBulkAdjustmentConfig,
  type BulkPriceAdjustmentConfig
} from "@/lib/test-price-adjustment";

export type AdminRole =
  | "super_admin"
  | "admin"
  | "manager"
  | "booking_manager"
  | "report_manager"
  | "finance_manager"
  | "customer_support"
  | "phlebotomist";

export type BookingStatus =
  | "new"
  | "pending_confirmation"
  | "confirmed"
  | "assigned"
  | "on_the_way"
  | "sample_collected"
  | "processing"
  | "report_ready"
  | "completed"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "cod_pending";

export type AssignmentSettings = {
  mode: "auto" | "manual";
  radius_km: number;
  max_daily_collections_per_agent: number;
  prioritize_same_pincode: boolean;
  auto_reassign_on_cancel: boolean;
};

// In-memory fallback stores for when Supabase is not provisioned or offline during dev/demo
export const inMemoryBookings = new Map<string, Record<string, unknown>>();
export const inMemoryBookingItems = new Map<string, Array<Record<string, unknown>>>();
export const inMemoryAdmins = new Map<string, Record<string, unknown>>();
export const inMemoryAuditLogs: Array<Record<string, unknown>> = [];
export const inMemoryLeadActivities = new Map<string, Array<Record<string, unknown>>>();
let inMemoryBundleSlabs: BundleDiscountSlab[] = [...defaultBundleSlabs];
export const inMemoryTests = new Map<string, TestItem>(
  testsData.map((t) => [t.id, { ...t, isActive: t.isActive ?? true }])
);
export const inMemoryPackages = new Map<string, PackageItem>(
  packagesData.map((p) => {
    const mrp = typeof p.mrp === "number" && p.mrp > p.price ? p.mrp : Math.round(p.price * 1.5);
    const savings = mrp > p.price ? mrp - p.price : 0;
    const discount = mrp > p.price ? Math.round(((mrp - p.price) / mrp) * 100) : 0;
    return [
      p.id,
      {
        ...p,
        packageType: "fixed" as const,
        allowExtraDiscount: p.allowExtraDiscount ?? false,
        mrp,
        savings,
        discount,
        testIds: p.testIds || (p.overview || []).map((name) => {
          const matched = testsData.find((t) => t.name.toLowerCase() === name.toLowerCase());
          return matched ? matched.id : name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        }),
        isActive: p.isActive !== false
      }
    ];
  })
);
const inMemoryCategories = new Map<string, { id: string; slug: string; name: string; sort_order: number; active: boolean }>(
  [
    { id: "cat-1", slug: "blood", name: "Blood Tests", sort_order: 1, active: true },
    { id: "cat-2", slug: "profile", name: "Profile Tests", sort_order: 2, active: true },
    { id: "cat-3", slug: "organ-function", name: "Organ Function Tests", sort_order: 3, active: true },
    { id: "cat-4", slug: "hormone", name: "Hormone & Special Tests", sort_order: 4, active: true }
  ].map((c) => [c.id, c])
);
const inMemoryServiceAreas = new Map<string, {
  id: string;
  pincode: string;
  city: string;
  area: string;
  home_collection_enabled: boolean;
  centre_visit_enabled: boolean;
  collection_charge: number;
  minimum_order_value: number;
  active: boolean;
}>([
  {
    id: "sa-ind-1",
    pincode: "452001",
    city: "Indore",
    area: "Vijay Nagar / MG Road",
    home_collection_enabled: true,
    centre_visit_enabled: true,
    collection_charge: 99,
    minimum_order_value: 600,
    active: true
  },
  {
    id: "sa-ind-2",
    pincode: "452010",
    city: "Indore",
    area: "Palasia / Old Town",
    home_collection_enabled: true,
    centre_visit_enabled: false,
    collection_charge: 99,
    minimum_order_value: 600,
    active: true
  },
  {
    id: "sa-bhp-1",
    pincode: "462001",
    city: "Bhopal",
    area: "MP Nagar / City Centre",
    home_collection_enabled: true,
    centre_visit_enabled: true,
    collection_charge: 99,
    minimum_order_value: 600,
    active: true
  },
  {
    id: "sa-lko-1",
    pincode: "226001",
    city: "Lucknow",
    area: "Hazratganj",
    home_collection_enabled: true,
    centre_visit_enabled: true,
    collection_charge: 99,
    minimum_order_value: 600,
    active: true
  },
  {
    id: "sa-del-1",
    pincode: "110001",
    city: "Delhi",
    area: "Central Delhi / Connaught Place",
    home_collection_enabled: true,
    centre_visit_enabled: true,
    collection_charge: 99,
    minimum_order_value: 600,
    active: true
  }
].map((s) => [s.id, s]));
export const inMemoryPhlebotomists: Array<Record<string, unknown>> = [
  {
    id: "phleb-001",
    name: "Ramesh Sharma",
    phone: "9876543210",
    email: "ramesh.phleb@scopexdiagnostics.in",
    city: "Indore",
    pincodes: ["452001", "452010", "452011"],
    status: "available",
    max_daily_slots: 15,
    assigned_count: 3,
    rating: 4.95,
    active: true
  },
  {
    id: "phleb-002",
    name: "Anil Verma",
    phone: "9876543211",
    email: "anil.phleb@scopexdiagnostics.in",
    city: "Bhopal",
    pincodes: ["462001", "462016", "462022"],
    status: "available",
    max_daily_slots: 15,
    assigned_count: 2,
    rating: 4.88,
    active: true
  }
];

let inMemorySettings: AssignmentSettings = {
  mode: "auto",
  radius_km: 15,
  max_daily_collections_per_agent: 12,
  prioritize_same_pincode: true,
  auto_reassign_on_cancel: true
};

function getServiceClient() {
  return getSupabaseServiceClient();
}

function nowIso() {
  return new Date().toISOString();
}

export function generateBookingNumber(): string {
  const year = new Date().getFullYear();
  const randomPart = Math.floor(100000 + Math.random() * 900000);
  return `SCX-${year}-${randomPart}`;
}

// -----------------------------------------------------------------------------
// 1. AUTHENTICATION & ROLE-BASED ACCESS CONTROL
// -----------------------------------------------------------------------------

export function requireAuthToken(request: Request): AppJwtPayload {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) throw new HttpError(401, "Authentication token required.");
  return verifyAppToken(token);
}

const DEFAULT_ADMIN_ROLES: AdminRole[] = [
  "super_admin",
  "admin",
  "manager",
  "booking_manager",
  "report_manager",
  "finance_manager",
  "customer_support"
];

export function requireAdminRole(request: Request, allowedRoles?: AdminRole[]): AppJwtPayload {
  const payload = requireAuthToken(request);
  const normalizedRole = payload.role === "super-admin" ? "super_admin" : payload.role;
  const isSuper = normalizedRole === "super_admin";
  const rolesToCheck = allowedRoles && allowedRoles.length > 0 ? allowedRoles : DEFAULT_ADMIN_ROLES;

  if (!isSuper && !rolesToCheck.includes(normalizedRole as AdminRole)) {
    throw new HttpError(403, `Access denied. Requires one of: ${rolesToCheck.join(", ")}`);
  }

  return { ...payload, role: normalizedRole };
}

export async function authenticateAdmin(email: string, passwordPlain: string, clientIp?: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const defaultAdminEmail = (process.env.ADMIN_EMAIL || "admin@scopexdiagnostics.in").toLowerCase();
  const defaultAdminPassword = process.env.ADMIN_PASSWORD || "ScopexAdmin#2026";

  // 1. Try querying Supabase
  try {
    const supabase = getServiceClient();
    const { data: adminRecord, error } = await supabase
      .from("admins")
      .select("id, email, password_hash, role, is_active, name")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (!error && adminRecord) {
      if (!adminRecord.is_active) throw new HttpError(403, "Account is disabled.");
      const match = await bcrypt.compare(passwordPlain, adminRecord.password_hash);
      if (!match) throw new HttpError(401, "Invalid email or password.");

      const token = signAppToken({
        userId: adminRecord.id,
        email: adminRecord.email,
        role: adminRecord.role
      });

      void logAuditAction({
        actorEmail: adminRecord.email,
        role: adminRecord.role,
        action: "login",
        entityType: "admin_session",
        entityId: adminRecord.id,
        ipAddress: clientIp
      });

      return { token, admin: { id: adminRecord.id, email: adminRecord.email, role: adminRecord.role, name: adminRecord.name } };
    }
  } catch (err) {
    if (err instanceof HttpError) throw err;
    // Continue to fallback
  }

  // 2. Fallback to in-memory / default super_admin account for seamless operations
  if (
    process.env.NODE_ENV !== "production" &&
    normalizedEmail === defaultAdminEmail &&
    passwordPlain === defaultAdminPassword
  ) {
    const defaultSuperAdmin = {
      id: "admin-super-001",
      email: defaultAdminEmail,
      role: "super_admin" as AdminRole,
      name: "ScopeX Super Administrator"
    };

    const token = signAppToken({
      userId: defaultSuperAdmin.id,
      email: defaultSuperAdmin.email,
      role: defaultSuperAdmin.role
    });

    void logAuditAction({
      actorEmail: defaultSuperAdmin.email,
      role: defaultSuperAdmin.role,
      action: "login",
      entityType: "admin_session",
      entityId: defaultSuperAdmin.id,
      ipAddress: clientIp
    });

    return { token, admin: defaultSuperAdmin };
  }

  // Check in-memory store
  const stored = inMemoryAdmins.get(normalizedEmail);
  if (stored && (await bcrypt.compare(passwordPlain, String(stored.password_hash)))) {
    const token = signAppToken({
      userId: String(stored.id),
      email: String(stored.email),
      role: String(stored.role)
    });
    return { token, admin: { id: stored.id, email: stored.email, role: stored.role, name: stored.name } };
  }

  throw new HttpError(401, "Invalid email or password.");
}

export async function createAdminStaff(
  data: { email: string; password: string; role: AdminRole; name?: string },
  creator: AppJwtPayload
) {
  if (creator.role !== "super_admin") {
    throw new HttpError(403, "Only super administrators can create admin staff.");
  }

  const normalizedEmail = data.email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(data.password, 10);
  const newId = crypto.randomUUID();

  try {
    const supabase = getServiceClient();
    const { data: created, error } = await supabase
      .from("admins")
      .insert({
        id: newId,
        email: normalizedEmail,
        password_hash: passwordHash,
        role: data.role,
        name: data.name || normalizedEmail.split("@")[0],
        is_active: true
      })
      .select("id, email, role, name, is_active, created_at")
      .single();

    if (error) throw error;
    return created;
  } catch {
    const inMem = {
      id: newId,
      email: normalizedEmail,
      password_hash: passwordHash,
      role: data.role,
      name: data.name || normalizedEmail.split("@")[0],
      is_active: true,
      created_at: nowIso()
    };
    inMemoryAdmins.set(normalizedEmail, inMem);
    return inMem;
  }
}

// -----------------------------------------------------------------------------
// 2. PRICING RULES & QUOTE CALCULATION
// -----------------------------------------------------------------------------

export type QuoteItem = {
  id: string;
  kind: "package" | "test";
  packageType?: "fixed" | "custom";
  allowExtraDiscount?: boolean;
  discountCapPercent?: number;
  discountCapRupees?: number;
  isBundleEligible?: boolean;
  testIds?: string[];
  name: string;
  price: number;
  mrp?: number;
  quantity?: number;
  patientId?: string;
  patientName?: string;
};

export type PricingQuote = {
  subtotal: number;
  bundleDiscount: number;
  bundlePercentage: number;
  homeCollectionFee: number;
  totalMrp: number;
  totalSavings: number;
  payableAmount: number;
  tierMessage?: string;
  priceSnapshot?: PriceSnapshot;
};

export function calculateRealPricingQuote(items: QuoteItem[], _city?: string): PricingQuote {
  const bookingItems = items.map((it) => ({
    id: it.id,
    kind: it.kind,
    slug: it.id,
    name: it.name,
    description: "",
    price: it.price,
    mrp: it.mrp ?? 0,
    discount: 0,
    category: "",
    href: "",
    packageType: it.packageType,
    allowExtraDiscount: it.allowExtraDiscount,
    discountCapPercent: it.discountCapPercent,
    discountCapRupees: it.discountCapRupees,
    isBundleEligible: it.isBundleEligible,
    quantity: it.quantity || 1
  }));

  const fullQuote = calculateRealPriceQuote({
    items: bookingItems,
    bundleSlabs: inMemoryBundleSlabs
  });

  const eligibleCount = items.filter((it) =>
    it.kind === "test" ? it.isBundleEligible !== false : it.allowExtraDiscount === true
  ).reduce((c, it) => c + (it.quantity || 1), 0);

  let tierMessage = "Add eligible tests to unlock progressive bundle savings!";
  if (fullQuote.appliedSlab) {
    tierMessage = `${fullQuote.appliedSlab.title} applied!`;
  } else if (eligibleCount === 1) {
    tierMessage = "Add 1 more eligible test to unlock bundle savings!";
  }

  return {
    subtotal: fullQuote.realPriceSubtotal,
    bundleDiscount: fullQuote.bundleSaving,
    bundlePercentage: fullQuote.appliedSlab?.discountType === "percent" ? fullQuote.appliedSlab.value : 0,
    homeCollectionFee: fullQuote.collectionCharge,
    totalMrp: fullQuote.referenceTotal,
    totalSavings: fullQuote.validSavingsAmount,
    payableAmount: fullQuote.payableAmount,
    tierMessage,
    priceSnapshot: fullQuote.priceSnapshot
  };
}

// -----------------------------------------------------------------------------
// BUNDLE DISCOUNT SLABS ADMIN OPERATIONS
// -----------------------------------------------------------------------------

export function getAdminBundleSlabs(): BundleDiscountSlab[] {
  return inMemoryBundleSlabs;
}

export function createAdminBundleSlab(data: Partial<BundleDiscountSlab>, adminUser: AppJwtPayload): BundleDiscountSlab {
  if (!data.title?.trim()) throw new HttpError(400, "Slab title is required.");
  if (typeof data.value !== "number" || data.value <= 0) {
    throw new HttpError(400, "Valid discount percentage or amount greater than 0 is required.");
  }

  const id = data.id || `slab-${Date.now()}`;
  const criteriaType = data.criteriaType || "test_count";

  const newSlab: BundleDiscountSlab = {
    id,
    title: data.title.trim(),
    criteriaType,
    minCount: typeof data.minCount === "number" ? data.minCount : undefined,
    maxCount: typeof data.maxCount === "number" ? data.maxCount : undefined,
    minSpend: typeof data.minSpend === "number" ? data.minSpend : undefined,
    maxSpend: typeof data.maxSpend === "number" ? data.maxSpend : undefined,
    discountType: data.discountType || "percent",
    value: data.value,
    active: data.active !== false,
    priority: data.priority ?? (inMemoryBundleSlabs.length + 1)
  };

  inMemoryBundleSlabs.push(newSlab);

  logAuditAction({
    actorEmail: adminUser.email || adminUser.userId,
    role: adminUser.role,
    action: "create_bundle_slab",
    entityType: "bundle_slabs",
    entityId: id,
    newVal: newSlab
  });

  return newSlab;
}

export function updateAdminBundleSlab(
  id: string,
  patch: Partial<BundleDiscountSlab>,
  adminUser: AppJwtPayload
): BundleDiscountSlab {
  const index = inMemoryBundleSlabs.findIndex((s) => s.id === id);
  if (index === -1) throw new HttpError(404, "Bundle discount slab not found.");

  const existing = inMemoryBundleSlabs[index];
  const updated: BundleDiscountSlab = {
    ...existing,
    ...patch,
    id: existing.id
  };

  inMemoryBundleSlabs[index] = updated;

  logAuditAction({
    actorEmail: adminUser.email || adminUser.userId,
    role: adminUser.role,
    action: "update_bundle_slab",
    entityType: "bundle_slabs",
    entityId: id,
    oldVal: existing,
    newVal: updated
  });

  return updated;
}

export function deleteAdminBundleSlab(id: string, adminUser: AppJwtPayload) {
  const index = inMemoryBundleSlabs.findIndex((s) => s.id === id);
  if (index === -1) throw new HttpError(404, "Bundle discount slab not found.");

  const deleted = inMemoryBundleSlabs[index];
  inMemoryBundleSlabs = inMemoryBundleSlabs.filter((s) => s.id !== id);

  logAuditAction({
    actorEmail: adminUser.email || adminUser.userId,
    role: adminUser.role,
    action: "delete_bundle_slab",
    entityType: "bundle_slabs",
    entityId: id,
    oldVal: deleted
  });

  return { success: true };
}

export function resetAdminBundleSlabsToDefault(adminUser: AppJwtPayload): BundleDiscountSlab[] {
  inMemoryBundleSlabs = [...defaultBundleSlabs];
  logAuditAction({
    actorEmail: adminUser.email || adminUser.userId,
    role: adminUser.role,
    action: "reset_bundle_slabs",
    entityType: "bundle_slabs",
    entityId: "default",
    newVal: inMemoryBundleSlabs
  });
  return inMemoryBundleSlabs;
}

// -----------------------------------------------------------------------------
// 3. CATALOG & TEST CATEGORIES
// -----------------------------------------------------------------------------

export async function getBackendCatalog() {
  try {
    const supabase = getServiceClient();
    const [testsRes, packagesRes, categoriesRes] = await Promise.all([
      supabase.from("tests").select("*").eq("active", true),
      supabase.from("packages").select("*").eq("active", true),
      supabase.from("test_categories").select("*").eq("active", true).order("sort_order")
    ]);

    if (!testsRes.error && testsRes.data && testsRes.data.length > 0) {
      return {
        tests: testsRes.data,
        packages: packagesRes.data || [],
        categories: categoriesRes.data || []
      };
    }
  } catch {
    // Supabase unavailable or table empty -> fallback to in-memory store
  }

  return {
    tests: Array.from(inMemoryTests.values()).filter((t) => t.isActive !== false),
    packages: Array.from(inMemoryPackages.values()).filter((p) => p.isActive !== false),
    categories: Array.from(inMemoryCategories.values()).filter((c) => c.active !== false)
  };
}

// -----------------------------------------------------------------------------
// TEST MASTER & SERVICE AREA ADMIN MANAGEMENT
// -----------------------------------------------------------------------------

export async function getAdminTestsList(params: { q?: string; category?: string; status?: string }) {
  let list = Array.from(inMemoryTests.values());

  if (params.category && params.category !== "All") {
    list = list.filter((t) => t.category.toLowerCase() === params.category!.toLowerCase());
  }
  if (params.status === "active") {
    list = list.filter((t) => t.isActive !== false);
  } else if (params.status === "inactive") {
    list = list.filter((t) => t.isActive === false);
  }
  if (params.q) {
    const needle = params.q.trim().toLowerCase();
    list = list.filter(
      (t) =>
        t.name.toLowerCase().includes(needle) ||
        t.id.toLowerCase().includes(needle) ||
        t.category.toLowerCase().includes(needle) ||
        (t.components || []).some((c) => c.toLowerCase().includes(needle))
    );
  }

  return list;
}

export async function createAdminTest(
  data: Partial<TestItem>,
  adminUser: AppJwtPayload
): Promise<TestItem> {
  if (!data.name || !data.name.trim()) throw new HttpError(400, "Test name is required.");
  if (typeof data.price !== "number" || data.price < 0) throw new HttpError(400, "Valid price is required.");

  const rawSlug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const code = (data.code || "").trim().toLowerCase();
  const id = data.id || code || rawSlug || crypto.randomUUID();

  if (inMemoryTests.has(id)) {
    throw new HttpError(409, `Test with ID/code/slug "${id}" already exists.`);
  }

  const mrp = typeof data.mrp === "number" && data.mrp > data.price ? data.mrp : Math.round(data.price * 1.5);
  const discount = Math.round(((mrp - data.price) / mrp) * 100);

  const newTest: TestItem = {
    id,
    code: code || rawSlug,
    name: data.name.trim(),
    slug: rawSlug,
    price: data.price,
    mrp,
    discount,
    discountCapPercent: data.discountCapPercent ?? 20,
    discountCapRupees: typeof data.discountCapRupees === "number" ? data.discountCapRupees : undefined,
    isBundleEligible: data.isBundleEligible !== false,
    category: (data.category as any) || "Blood",
    group: (data.group as any) || "Basic Tests",
    components: data.components || [data.name.trim()],
    specimenType: data.specimenType || "Blood Serum",
    preparation: data.preparation || "Maintain standard hydration before collection.",
    fastingHours: data.fastingHours || "No fasting required",
    tat: data.tat || "12-24 Hrs",
    isActive: data.isActive !== false,
    seoTitle: data.seoTitle || `${data.name.trim()} at Home | ScopeX Diagnostics`,
    seoDescription: data.seoDescription || `Book ${data.name.trim()} with ScopeX Diagnostics with home sample collection.`
  };

  inMemoryTests.set(id, newTest);

  try {
    const supabase = getServiceClient();
    await supabase.from("tests").insert({
      id: crypto.randomUUID(),
      slug: newTest.slug || newTest.id,
      name: newTest.name,
      price: newTest.mrp,
      real_price: newTest.price,
      sample_type: newTest.specimenType,
      preparation_instructions: newTest.preparation,
      fasting_required: Boolean(newTest.fastingHours && !newTest.fastingHours.toLowerCase().includes("no")),
      seo_title: newTest.seoTitle,
      seo_description: newTest.seoDescription,
      active: newTest.isActive,
      schema_json: {
        components: newTest.components,
        discountCapPercent: newTest.discountCapPercent,
        discountCapRupees: newTest.discountCapRupees,
        isBundleEligible: newTest.isBundleEligible,
        tat: newTest.tat,
        group: newTest.group
      }
    });
  } catch {
    // In-memory fallback
  }

  logAuditAction({
    actorEmail: adminUser.email || adminUser.userId,
    role: adminUser.role,
    action: "create_test",
    entityType: "tests",
    entityId: id,
    newVal: newTest
  });

  return newTest;
}

export async function updateAdminTest(
  id: string,
  patch: Partial<TestItem>,
  adminUser: AppJwtPayload
): Promise<TestItem> {
  const existing = inMemoryTests.get(id);
  if (!existing) throw new HttpError(404, `Test "${id}" not found.`);

  const price = typeof patch.price === "number" ? patch.price : existing.price;
  const mrp = typeof patch.mrp === "number" ? patch.mrp : existing.mrp;
  const discount = mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const discountCapPercent = typeof patch.discountCapPercent === "number" ? patch.discountCapPercent : existing.discountCapPercent;
  const discountCapRupees = typeof patch.discountCapRupees === "number" ? patch.discountCapRupees : existing.discountCapRupees;
  const isBundleEligible = typeof patch.isBundleEligible === "boolean" ? patch.isBundleEligible : existing.isBundleEligible;

  const updated: TestItem = {
    ...existing,
    ...patch,
    id: existing.id, // preserve immutable ID to protect historical booking references
    code: patch.code !== undefined ? ((patch.code || "").trim().toLowerCase() || undefined) : existing.code,
    price,
    mrp,
    discount,
    discountCapPercent,
    discountCapRupees,
    isBundleEligible
  };

  inMemoryTests.set(id, updated);

  try {
    const supabase = getServiceClient();
    await supabase
      .from("tests")
      .update({
        name: updated.name,
        real_price: updated.price,
        price: updated.mrp,
        sample_type: updated.specimenType,
        preparation_instructions: updated.preparation,
        seo_title: updated.seoTitle,
        seo_description: updated.seoDescription,
        active: updated.isActive,
        updated_at: new Date().toISOString()
      })
      .eq("slug", existing.slug || existing.id);
  } catch {
    // In-memory fallback
  }

  logAuditAction({
    actorEmail: adminUser.email || adminUser.userId,
    role: adminUser.role,
    action: "update_test",
    entityType: "tests",
    entityId: id,
    oldVal: existing,
    newVal: updated
  });

  return updated;
}

export async function deleteAdminTest(id: string, adminUser: AppJwtPayload) {
  const existing = inMemoryTests.get(id);
  if (!existing) throw new HttpError(404, `Test "${id}" not found.`);

  // Soft deactivate to preserve referential integrity and historical bookings
  existing.isActive = false;
  inMemoryTests.set(id, existing);

  logAuditAction({
    actorEmail: adminUser.email || adminUser.userId,
    role: adminUser.role,
    action: "deactivate_test",
    entityType: "tests",
    entityId: id,
    oldVal: { isActive: true },
    newVal: { isActive: false }
  });

  return { success: true, message: `Test "${existing.name}" deactivated.` };
}

export type BulkUpsertTestResult = {
  id: string;
  name: string;
  action: "created" | "updated";
  status: "success" | "error";
  error?: string;
};

export async function bulkUpsertAdminTests(
  rows: Array<Record<string, unknown>>,
  adminUser: AppJwtPayload
): Promise<{
  success: boolean;
  totalProcessed: number;
  createdCount: number;
  updatedCount: number;
  results: BulkUpsertTestResult[];
}> {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new HttpError(400, "No CSV test records provided for bulk upload.");
  }

  let createdCount = 0;
  let updatedCount = 0;
  const results: BulkUpsertTestResult[] = [];
  const createdItems: TestItem[] = [];
  const updatedItems: TestItem[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = String(row.name || row.test_name || "").trim();
    if (!name) {
      results.push({
        id: `row-${i + 1}`,
        name: "Unknown",
        action: "created",
        status: "error",
        error: "Missing test name"
      });
      continue;
    }

    const rawPrice = row.price ?? row.real_price ?? row.sellingPrice ?? row.selling_price;
    const price = Number(rawPrice);
    if (isNaN(price) || price < 0) {
      results.push({
        id: `row-${i + 1}`,
        name,
        action: "created",
        status: "error",
        error: "Invalid or missing selling price"
      });
      continue;
    }

    const rawCode = String(row.id || row.code || row.slug || "").trim();
    const slug = rawCode
      ? rawCode.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
      : name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const id = rawCode || slug || crypto.randomUUID();

    // Check if test exists by id, slug, or matching name
    const existing =
      inMemoryTests.get(id) ||
      Array.from(inMemoryTests.values()).find(
        (t) => (t.slug && t.slug === slug) || t.name.toLowerCase() === name.toLowerCase()
      );

    const rawMrp = row.mrp ?? row.price_mrp ?? row.reference_price ?? row.market_price;
    const mrp = Number(rawMrp);
    const validMrp = !isNaN(mrp) && mrp >= price ? mrp : Math.round(price * 1.5);
    const discount = validMrp > price ? Math.round(((validMrp - price) / validMrp) * 100) : 0;

    const rawCap = row.discountCapPercent ?? row.discount_cap ?? row.discount_cap_percent;
    const discountCapPercent =
      typeof rawCap === "number" && !isNaN(rawCap)
        ? Math.min(100, Math.max(0, rawCap))
        : existing?.discountCapPercent ?? 20;

    let components: string[] = [];
    if (Array.isArray(row.components)) {
      components = row.components.map(String);
    } else if (typeof row.components === "string" && row.components.trim()) {
      components = row.components.split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
    } else if (existing?.components) {
      components = existing.components;
    } else {
      components = [name];
    }

    const rawActive = row.isActive ?? row.is_active ?? row.active;
    const isActive =
      rawActive !== undefined
        ? String(rawActive).toLowerCase() === "true" || String(rawActive).toLowerCase() === "yes" || rawActive === true
        : existing !== undefined
        ? existing.isActive !== false
        : true;

    const specimenType = String(row.specimenType || row.sample_type || row.specimen || existing?.specimenType || "Blood Serum").trim();
    const fastingHours = String(row.fastingHours || row.fasting || existing?.fastingHours || "No fasting required").trim();
    const preparation = String(
      row.preparation || row.preparation_instructions || existing?.preparation || "Maintain standard hydration before collection."
    ).trim();
    const tat = String(row.tat || row.tat_hours || existing?.tat || "12-24 Hrs").trim();
    const category = (String(row.category || existing?.category || "Blood").trim()) as any;
    const group = (String(row.group || existing?.group || "Basic Tests").trim()) as any;
    const seoTitle = String(row.seoTitle || row.seo_title || existing?.seoTitle || `${name} at Home | ScopeX Diagnostics`).trim();
    const seoDescription = String(
      row.seoDescription || row.seo_description || existing?.seoDescription || `Book ${name} with ScopeX Diagnostics with home sample collection.`
    ).trim();

    if (existing) {
      const updated: TestItem = {
        ...existing,
        name,
        price,
        mrp: validMrp,
        discount,
        discountCapPercent,
        category,
        group,
        specimenType,
        fastingHours,
        preparation,
        tat,
        components,
        isActive,
        seoTitle,
        seoDescription
      };
      inMemoryTests.set(existing.id, updated);
      updatedCount++;
      updatedItems.push(updated);
      results.push({ id: existing.id, name, action: "updated", status: "success" });
    } else {
      const created: TestItem = {
        id,
        name,
        slug,
        price,
        mrp: validMrp,
        discount,
        discountCapPercent,
        category,
        group,
        specimenType,
        fastingHours,
        preparation,
        tat,
        components,
        isActive,
        seoTitle,
        seoDescription
      };
      inMemoryTests.set(id, created);
      createdCount++;
      createdItems.push(created);
      results.push({ id, name, action: "created", status: "success" });
    }
  }

  // Supabase sync if client is available
  try {
    const supabase = getServiceClient();
    const allToSync = [...createdItems, ...updatedItems];
    if (allToSync.length > 0) {
      await supabase.from("tests").upsert(
        allToSync.map((t) => ({
          slug: t.slug || t.id,
          name: t.name,
          price: t.mrp,
          real_price: t.price,
          sample_type: t.specimenType,
          preparation_instructions: t.preparation,
          fasting_required: Boolean(t.fastingHours && !t.fastingHours.toLowerCase().includes("no")),
          seo_title: t.seoTitle,
          seo_description: t.seoDescription,
          active: t.isActive,
          schema_json: {
            components: t.components,
            discountCapPercent: t.discountCapPercent,
            tat: t.tat,
            group: t.group
          }
        })),
        { onConflict: "slug" }
      );
    }
  } catch {
    // In-memory fallback
  }

  logAuditAction({
    actorEmail: adminUser.email || adminUser.userId,
    role: adminUser.role,
    action: "bulk_upsert_tests",
    entityType: "tests",
    entityId: `batch_${Date.now()}`,
    newVal: { createdCount, updatedCount, total: rows.length }
  });

  return {
    success: true,
    totalProcessed: rows.length,
    createdCount,
    updatedCount,
    results
  };
}

export interface BulkPriceAdjustmentParams extends BulkPriceAdjustmentConfig {
  testIds: string[];
}

export async function bulkAdjustAdminTestPrices(
  params: BulkPriceAdjustmentParams,
  adminUser: AppJwtPayload
): Promise<{
  success: boolean;
  totalUpdated: number;
  updatedTests: TestItem[];
  summary: {
    totalOriginalValue: number;
    totalNewValue: number;
    netDelta: number;
    averagePercentChange: number;
  };
  message: string;
}> {
  const { testIds, ...config } = params;

  if (!Array.isArray(testIds) || testIds.length === 0) {
    throw new HttpError(400, "No tests selected for price adjustment.");
  }

  const validation = validateBulkAdjustmentConfig(config);
  if (!validation.valid) {
    throw new HttpError(400, validation.error || "Invalid price adjustment parameters.");
  }

  const updatedTests: TestItem[] = [];
  let totalOriginalValue = 0;
  let totalNewValue = 0;

  for (const id of testIds) {
    const existing = inMemoryTests.get(id);
    if (!existing) continue;

    const adjustment = calculateAdjustedItem(
      {
        id: existing.id,
        name: existing.name,
        price: existing.price,
        mrp: existing.mrp
      },
      config
    );

    totalOriginalValue += adjustment.originalPrice;
    totalNewValue += adjustment.newPrice;

    const updated: TestItem = {
      ...existing,
      price: adjustment.newPrice,
      mrp: adjustment.newMrp,
      discount: adjustment.newDiscountPercent
    };

    inMemoryTests.set(existing.id, updated);
    updatedTests.push(updated);
  }

  if (updatedTests.length === 0) {
    throw new HttpError(404, "None of the selected tests were found in the database.");
  }

  // Attempt Supabase sync if service client is configured
  try {
    const supabase = getServiceClient();
    await supabase.from("tests").upsert(
      updatedTests.map((t) => ({
        slug: t.slug || t.id,
        name: t.name,
        price: t.mrp,
        real_price: t.price,
        active: t.isActive
      })),
      { onConflict: "slug" }
    );
  } catch {
    // In-memory fallback
  }

  const netDelta = totalNewValue - totalOriginalValue;
  const averagePercentChange =
    totalOriginalValue > 0 ? Math.round((netDelta / totalOriginalValue) * 1000) / 10 : 0;

  logAuditAction({
    actorEmail: adminUser.email || adminUser.userId,
    role: adminUser.role,
    action: "bulk_adjust_test_prices",
    entityType: "tests",
    entityId: `batch_${Date.now()}`,
    newVal: {
      count: updatedTests.length,
      direction: config.direction,
      percentage: config.percentage,
      rounding: config.rounding || "round",
      netDelta,
      updatedTestIds: updatedTests.map((t) => t.id)
    }
  });

  const sign = config.direction === "increase" ? "+" : "-";
  return {
    success: true,
    totalUpdated: updatedTests.length,
    updatedTests,
    summary: {
      totalOriginalValue,
      totalNewValue,
      netDelta,
      averagePercentChange
    },
    message: `Successfully adjusted prices for ${updatedTests.length} tests (${sign}${config.percentage}%).`
  };
}

// -----------------------------------------------------------------------------
// FIXED PACKAGES MANAGEMENT (TYPE 1: FIXED PACKAGES)
// -----------------------------------------------------------------------------

export async function getAdminPackagesList(params: { q?: string; category?: string; status?: string }) {
  let list = Array.from(inMemoryPackages.values());

  if (params.category && params.category !== "All") {
    list = list.filter((p) => p.section?.toLowerCase() === params.category!.toLowerCase());
  }
  if (params.status === "active") {
    list = list.filter((p) => p.isActive !== false);
  } else if (params.status === "inactive") {
    list = list.filter((p) => p.isActive === false);
  }
  if (params.q) {
    const needle = params.q.trim().toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(needle) ||
        p.id.toLowerCase().includes(needle) ||
        p.tagline.toLowerCase().includes(needle) ||
        (p.overview || []).some((o) => o.toLowerCase().includes(needle))
    );
  }

  return list;
}

export async function createAdminFixedPackage(
  data: Partial<PackageItem>,
  adminUser: AppJwtPayload
): Promise<PackageItem> {
  if (!data.name || !data.name.trim()) throw new HttpError(400, "Package name is required.");
  if (typeof data.price !== "number" || data.price < 0) throw new HttpError(400, "Valid selling price is required.");
  if ((!data.testIds || data.testIds.length === 0) && (!data.overview || data.overview.length === 0)) {
    throw new HttpError(400, "At least one diagnostic test must be included in the fixed package.");
  }

  const rawSlug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const id = data.id || rawSlug || crypto.randomUUID();

  if (inMemoryPackages.has(id)) {
    throw new HttpError(409, `Package with ID "${id}" already exists.`);
  }

  // Calculate reference market price (MRP) and valid savings automatically
  const mrp = typeof data.mrp === "number" && data.mrp >= data.price ? data.mrp : Math.round(data.price * 1.5);
  const savings = mrp > data.price ? mrp - data.price : 0;
  const discount = mrp > data.price ? Math.round(((mrp - data.price) / mrp) * 100) : 0;

  // Resolve test names from testIds
  const resolvedOverview = data.overview && data.overview.length > 0
    ? data.overview
    : (data.testIds || []).map((tid) => {
        const test = inMemoryTests.get(tid);
        return test ? test.name : tid;
      });

  const newPkg: PackageItem = {
    id,
    name: data.name.trim(),
    section: data.section || "Preventive Health",
    badge: data.badge || "Best Value",
    packageType: "fixed",
    allowExtraDiscount: Boolean(data.allowExtraDiscount),
    price: data.price,
    mrp,
    savings,
    discount,
    tagline: data.tagline?.trim() || "Pathologist-curated fixed health panel",
    overview: resolvedOverview,
    testIds: data.testIds || [],
    whyPackage: data.whyPackage && data.whyPackage.length > 0
      ? data.whyPackage
      : ["Pathologist-reviewed digital report", "Doorstep sample collection included"],
    bestFor: data.bestFor && data.bestFor.length > 0 ? data.bestFor : ["All Age Groups"],
    featured: Boolean(data.featured),
    isActive: data.isActive !== false
  };

  inMemoryPackages.set(id, newPkg);

  logAuditAction({
    actorEmail: adminUser.email || adminUser.userId,
    role: adminUser.role,
    action: "create_fixed_package",
    entityType: "packages",
    entityId: id,
    newVal: newPkg
  });

  return newPkg;
}

export async function updateAdminFixedPackage(
  id: string,
  patch: Partial<PackageItem>,
  adminUser: AppJwtPayload
): Promise<PackageItem> {
  const existing = inMemoryPackages.get(id);
  if (!existing) throw new HttpError(404, `Package "${id}" not found.`);

  const price = typeof patch.price === "number" ? patch.price : existing.price;
  const mrp = typeof patch.mrp === "number" ? patch.mrp : existing.mrp;
  const savings = mrp > price ? mrp - price : 0;
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  let overview = existing.overview;
  if (patch.overview && patch.overview.length > 0) {
    overview = patch.overview;
  } else if (patch.testIds && patch.testIds.length > 0) {
    overview = patch.testIds.map((tid) => {
      const test = inMemoryTests.get(tid);
      return test ? test.name : tid;
    });
  }

  const updated: PackageItem = {
    ...existing,
    ...patch,
    id: existing.id, // Preserve immutable ID for historical bookings
    packageType: "fixed",
    allowExtraDiscount: typeof patch.allowExtraDiscount === "boolean" ? patch.allowExtraDiscount : existing.allowExtraDiscount ?? false,
    price,
    mrp,
    savings,
    discount,
    overview
  };

  inMemoryPackages.set(id, updated);

  logAuditAction({
    actorEmail: adminUser.email || adminUser.userId,
    role: adminUser.role,
    action: "update_fixed_package",
    entityType: "packages",
    entityId: id,
    oldVal: existing,
    newVal: updated
  });

  return updated;
}

export async function deleteAdminFixedPackage(id: string, adminUser: AppJwtPayload) {
  const existing = inMemoryPackages.get(id);
  if (!existing) throw new HttpError(404, `Package "${id}" not found.`);

  // Soft deactivate to preserve historical booking references
  existing.isActive = false;
  inMemoryPackages.set(id, existing);

  logAuditAction({
    actorEmail: adminUser.email || adminUser.userId,
    role: adminUser.role,
    action: "deactivate_fixed_package",
    entityType: "packages",
    entityId: id,
    oldVal: { isActive: true },
    newVal: { isActive: false }
  });

  return { success: true, message: `Package "${existing.name}" deactivated.` };
}

export function getAdminCategoriesList() {
  return Array.from(inMemoryCategories.values());
}

export function createAdminCategory(data: { name: string; slug?: string; sort_order?: number }, adminUser: AppJwtPayload) {
  const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const newCat = {
    id: `cat-${slug}`,
    name: data.name.trim(),
    slug,
    sort_order: data.sort_order || 10,
    active: true
  };
  inMemoryCategories.set(newCat.id, newCat);
  logAuditAction({
    actorEmail: adminUser.email || adminUser.userId,
    role: adminUser.role,
    action: "create_category",
    entityType: "test_categories",
    entityId: newCat.id,
    newVal: newCat
  });
  return newCat;
}

export function getAdminServiceAreas(city?: string) {
  const areas = Array.from(inMemoryServiceAreas.values());
  if (city) {
    return areas.filter((a) => a.city.toLowerCase() === city.toLowerCase());
  }
  return areas;
}

export function createAdminServiceArea(
  data: {
    city: string;
    pincode: string;
    area?: string;
    home_collection_enabled?: boolean;
    centre_visit_enabled?: boolean;
    collection_charge?: number;
    minimum_order_value?: number;
  },
  adminUser: AppJwtPayload
) {
  if (!data.city || !data.pincode) throw new HttpError(400, "City and PIN code are required.");
  if (!/^\d{6}$/.test(data.pincode.trim())) throw new HttpError(400, "PIN code must be a valid 6-digit number.");

  const id = `sa-${data.city.slice(0, 3).toLowerCase()}-${data.pincode.trim()}`;
  const record = {
    id,
    pincode: data.pincode.trim(),
    city: data.city.trim(),
    area: data.area?.trim() || "Main Sector",
    home_collection_enabled: data.home_collection_enabled !== false,
    centre_visit_enabled: Boolean(data.centre_visit_enabled),
    collection_charge: typeof data.collection_charge === "number" ? data.collection_charge : 99,
    minimum_order_value: typeof data.minimum_order_value === "number" ? data.minimum_order_value : 600,
    active: true
  };

  inMemoryServiceAreas.set(id, record);

  logAuditAction({
    actorEmail: adminUser.email || adminUser.userId,
    role: adminUser.role,
    action: "create_service_area",
    entityType: "service_areas",
    entityId: id,
    newVal: record
  });

  return record;
}

export function updateAdminServiceArea(
  id: string,
  patch: Partial<{
    home_collection_enabled: boolean;
    centre_visit_enabled: boolean;
    collection_charge: number;
    minimum_order_value: number;
    active: boolean;
    area: string;
  }>,
  adminUser: AppJwtPayload
) {
  const existing = inMemoryServiceAreas.get(id);
  if (!existing) throw new HttpError(404, "Service area not found.");

  const updated = {
    ...existing,
    ...patch
  };

  inMemoryServiceAreas.set(id, updated);

  logAuditAction({
    actorEmail: adminUser.email || adminUser.userId,
    role: adminUser.role,
    action: "update_service_area",
    entityType: "service_areas",
    entityId: id,
    oldVal: existing,
    newVal: updated
  });

  return updated;
}

// -----------------------------------------------------------------------------
// 4. BOOKING CREATION & CUSTOMER-CARE OPERATIONS
// -----------------------------------------------------------------------------

const bookingPatientItemSchema = z.union([
  z.string(),
  z.object({ id: z.string() }).passthrough()
]);

export const bookingCreateInputSchema = z.object({
  customer: z.object({
    fullName: z.string().trim().min(2),
    phone: z.string().trim().min(10),
    email: z.string().trim().email().optional().or(z.literal("")),
    city: z.string().trim().min(2),
    address: z.string().trim().min(4),
    pincode: z.string().trim().optional(),
    preferredDate: z.string().trim().min(4),
    preferredTime: z.string().trim().min(2)
  }),
  bookingPatients: z.array(
    z.object({
      patientId: z.string().optional(),
      name: z.string().trim().min(2),
      relation: z.string().trim().default("Self"),
      age: z.union([z.number(), z.string()]).optional(),
      dob: z.string().optional(),
      gender: z.string().optional(),
      mobile: z.string().optional(),
      itemIds: z.array(z.string()).optional(),
      tests: z.array(bookingPatientItemSchema).optional()
    })
  ).min(1),
  items: z.array(bookingPatientItemSchema).optional(),
  collectionType: z.enum(["HOME_COLLECTION", "CENTRE_VISIT"]).default("HOME_COLLECTION"),
  paymentMethod: z.enum(["online", "cod"]).default("online"),
  notes: z.string().trim().optional()
});

export async function createBooking(
  rawInput: z.input<typeof bookingCreateInputSchema>,
  authUser?: AppJwtPayload | null,
  clientIp?: string
) {
  const input = bookingCreateInputSchema.parse(rawInput);
  const bookingNumber = generateBookingNumber();
  const bookingId = crypto.randomUUID();

  // Assemble all quote items from patient selections
  const { tests, packages } = await getBackendCatalog();
  const testMap = new Map<string, TestItem>(tests.map((t) => [t.id, t]));
  const pkgMap = new Map<string, PackageItem>(packages.map((p) => [p.id, p]));

  const flatItems: QuoteItem[] = [];
  const patientWiseItems: Array<{
    patientName: string;
    patientRelation: string;
    patientAge?: string | number;
    patientGender?: string;
    items: QuoteItem[];
  }> = [];

  for (const patient of input.bookingPatients) {
    const currentPatientItems: QuoteItem[] = [];
    const resolvedIds: string[] =
      patient.itemIds && patient.itemIds.length > 0
        ? patient.itemIds
        : (patient.tests || []).map((t) => (typeof t === "string" ? t : t.id));

    for (const itemId of resolvedIds) {
      const pkg = pkgMap.get(itemId);
      const test = testMap.get(itemId);

      if (pkg) {
        const itemObj: QuoteItem = {
          id: pkg.id,
          kind: "package",
          packageType: "fixed",
          allowExtraDiscount: Boolean(pkg.allowExtraDiscount),
          testIds: pkg.testIds || [],
          name: pkg.name,
          price: pkg.price,
          mrp: pkg.mrp,
          patientName: patient.name
        };
        flatItems.push(itemObj);
        currentPatientItems.push(itemObj);
      } else if (test) {
        const itemObj: QuoteItem = {
          id: test.id,
          kind: "test",
          packageType: "custom",
          discountCapPercent: test.discountCapPercent ?? 20,
          discountCapRupees: test.discountCapRupees,
          isBundleEligible: test.isBundleEligible !== false,
          name: test.name,
          price: test.price,
          mrp: test.mrp,
          patientName: patient.name
        };
        flatItems.push(itemObj);
        currentPatientItems.push(itemObj);
      }
    }

    patientWiseItems.push({
      patientName: patient.name,
      patientRelation: patient.relation,
      patientAge: patient.age,
      patientGender: patient.gender,
      items: currentPatientItems
    });
  }

  if (flatItems.length === 0) {
    throw new HttpError(400, "Add at least one valid test or package before booking.");
  }

  const quote = calculateRealPricingQuote(flatItems, input.customer.city);

  // Auto-assign phlebotomist if settings are 'auto'
  let assignedPhleb: Record<string, unknown> | null = null;
  if (inMemorySettings.mode === "auto" && input.collectionType === "HOME_COLLECTION") {
    assignedPhleb = inMemoryPhlebotomists.find(
      (p) => String(p.city || "").toLowerCase() === input.customer.city.toLowerCase() && p.status === "available"
    ) || inMemoryPhlebotomists[0];
  }

  const newBookingRecord = {
    id: bookingId,
    booking_id: bookingId,
    booking_number: bookingNumber,
    customer_name: input.customer.fullName,
    customer_phone: input.customer.phone.replace(/\D/g, "").slice(-10),
    contact_name: input.customer.fullName,
    contact_phone: input.customer.phone.replace(/\D/g, "").slice(-10),
    customer_email: input.customer.email || null,
    address: input.customer.address,
    city: input.customer.city,
    pincode: input.customer.pincode || null,
    preferred_date: input.customer.preferredDate,
    preferred_time: input.customer.preferredTime,
    collection_type: input.collectionType,
    booking_status: "confirmed" as BookingStatus,
    payment_status: (input.paymentMethod === "cod" ? "cod_pending" : "pending") as PaymentStatus,
    payment_method: input.paymentMethod,
    subtotal: quote.subtotal,
    bundle_discount: quote.bundleDiscount,
    home_collection_charge: quote.homeCollectionFee,
    payable_amount: quote.payableAmount,
    price_snapshot: quote.priceSnapshot,
    valid_savings: quote.totalSavings,
    assigned_phlebotomist_id: assignedPhleb ? assignedPhleb.id : null,
    assigned_phlebotomist_name: assignedPhleb ? assignedPhleb.name : null,
    assigned_phlebotomist_phone: assignedPhleb ? assignedPhleb.phone : null,
    booking_patients: patientWiseItems,
    items_count: flatItems.length,
    user_id: authUser?.userId || null,
    internal_notes: input.notes || null,
    created_at: nowIso(),
    updated_at: nowIso()
  };

  // Try writing to Supabase
  try {
    const supabase = getServiceClient();
    await supabase.from("bookings").insert({
      id: bookingId,
      booking_number: bookingNumber,
      customer_name: newBookingRecord.customer_name,
      customer_phone: newBookingRecord.customer_phone,
      address: newBookingRecord.address,
      city: newBookingRecord.city,
      pincode: newBookingRecord.pincode,
      preferred_date: newBookingRecord.preferred_date,
      preferred_time: newBookingRecord.preferred_time,
      booking_status: newBookingRecord.booking_status,
      payment_status: newBookingRecord.payment_status,
      payable_amount: newBookingRecord.payable_amount,
      price_snapshot: quote.priceSnapshot,
      booking_patients: patientWiseItems
    });
  } catch {
    // Continue in memory
  }

  inMemoryBookings.set(bookingId, newBookingRecord);
  inMemoryBookingItems.set(bookingId, flatItems.map((item) => ({ ...item, booking_id: bookingId })));

  void logAuditAction({
    actorEmail: authUser?.email || input.customer.phone,
    role: authUser?.role || "patient",
    action: "create_booking",
    entityType: "booking",
    entityId: bookingId,
    ipAddress: clientIp,
    newVal: { bookingNumber, payableAmount: quote.payableAmount, items: flatItems.length }
  });

  return {
    success: true,
    orderId: bookingId,
    bookingId,
    bookingNumber,
    payableAmount: quote.payableAmount,
    quote,
    priceSnapshot: quote.priceSnapshot,
    assignedPhlebotomist: assignedPhleb ? { name: assignedPhleb.name, phone: assignedPhleb.phone } : null
  };
}

export async function getPatientBookings(auth: AppJwtPayload) {
  const patientMobile = auth.mobile ? auth.mobile.replace(/\D/g, "").slice(-10) : "";

  try {
    const supabase = getServiceClient();
    const query = supabase
      .from("bookings")
      .select("*, reports(*)")
      .order("created_at", { ascending: false });

    if (patientMobile) {
      query.or(`customer_phone.eq.${patientMobile},patient_id.eq.${auth.userId}`);
    } else {
      query.eq("user_id", auth.userId);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) return data;
  } catch {
    // Fall through to in-memory lookup
  }

  const results: Array<Record<string, unknown>> = [];
  for (const booking of inMemoryBookings.values()) {
    if (
      (patientMobile && String(booking.customer_phone).includes(patientMobile)) ||
      (auth.userId && booking.user_id === auth.userId)
    ) {
      results.push(booking);
    }
  }

  // Sort by created_at desc
  return results.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
}

// -----------------------------------------------------------------------------
// 5. ADMIN OPERATIONS & METRICS
// -----------------------------------------------------------------------------

export async function getAdminMetrics() {
  const allBookings = Array.from(inMemoryBookings.values());
  const completed = allBookings.filter((b) => b.booking_status === "completed");
  const pending = allBookings.filter((b) => b.booking_status === "pending_confirmation" || b.booking_status === "new");
  const totalRevenue = allBookings
    .filter((b) => b.payment_status === "paid")
    .reduce((sum, b) => sum + Number(b.payable_amount || 0), 0);

  return {
    totalBookings: allBookings.length,
    pendingBookings: pending.length,
    completedBookings: completed.length,
    totalRevenue,
    activePhlebotomists: inMemoryPhlebotomists.filter((p) => p.status === "available").length,
    activePincodes: 45
  };
}

export async function getAdminBookingsList(params: { q?: string; status?: string }) {
  let list = Array.from(inMemoryBookings.values());

  if (params.status) {
    list = list.filter((b) => String(b.booking_status).toLowerCase() === params.status?.toLowerCase());
  }

  if (params.q) {
    const query = params.q.toLowerCase();
    list = list.filter(
      (b) =>
        String(b.booking_number || "").toLowerCase().includes(query) ||
        String(b.customer_name || "").toLowerCase().includes(query) ||
        String(b.customer_phone || "").includes(query) ||
        String(b.city || "").toLowerCase().includes(query)
    );
  }

  return list.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
}

export async function updateBookingAdmin(
  id: string,
  patch: Partial<{
    booking_status: BookingStatus;
    payment_status: PaymentStatus;
    preferred_date: string;
    preferred_time: string;
    assigned_phlebotomist_id: string;
    internal_notes: string;
  }>,
  adminUser: AppJwtPayload
) {
  const existing = inMemoryBookings.get(id);
  if (!existing) throw new HttpError(404, "Booking not found.");

  const updated: Record<string, unknown> = {
    ...existing,
    ...patch,
    updated_at: nowIso()
  };

  // If phlebotomist was assigned, attach their name and phone
  if (patch.assigned_phlebotomist_id) {
    const phleb = inMemoryPhlebotomists.find((p) => p.id === patch.assigned_phlebotomist_id);
    if (phleb) {
      updated.assigned_phlebotomist_name = phleb.name;
      updated.assigned_phlebotomist_phone = phleb.phone;
    }
  }

  inMemoryBookings.set(id, updated);

  void logAuditAction({
    actorEmail: adminUser.email || adminUser.userId,
    role: adminUser.role,
    action: "update_booking",
    entityType: "booking",
    entityId: id,
    oldVal: existing,
    newVal: updated
  });

  return updated;
}

// -----------------------------------------------------------------------------
// 6. PHLEBOTOMIST & ASSIGNMENT SETTINGS
// -----------------------------------------------------------------------------

export function getPhlebotomistList(city?: string) {
  if (city) {
    return inMemoryPhlebotomists.filter(
      (p) => String(p.city || "").toLowerCase() === city.toLowerCase() && Boolean(p.active)
    );
  }
  return inMemoryPhlebotomists;
}

export function getAssignmentSettings(): AssignmentSettings {
  return inMemorySettings;
}

export function updateAssignmentSettings(settings: Partial<AssignmentSettings>, adminUser: AppJwtPayload): AssignmentSettings {
  const old = { ...inMemorySettings };
  inMemorySettings = {
    ...inMemorySettings,
    ...settings
  };

  void logAuditAction({
    actorEmail: adminUser.email || adminUser.userId,
    role: adminUser.role,
    action: "update_assignment_settings",
    entityType: "app_settings",
    entityId: "assignment_settings",
    oldVal: old,
    newVal: inMemorySettings
  });

  return inMemorySettings;
}

// -----------------------------------------------------------------------------
// 7. CRM LEADS & ACTIVITIES
// -----------------------------------------------------------------------------

export async function addLeadActivity(
  leadId: string,
  activity: { activityType: "call" | "whatsapp" | "email" | "note"; notes: string; performedBy?: string },
  adminUser: AppJwtPayload
) {
  const record = {
    id: crypto.randomUUID(),
    lead_id: leadId,
    activity_type: activity.activityType,
    notes: activity.notes,
    performed_by: activity.performedBy || adminUser.email || "staff",
    created_at: nowIso()
  };

  const existing = inMemoryLeadActivities.get(leadId) || [];
  existing.unshift(record);
  inMemoryLeadActivities.set(leadId, existing);

  return record;
}

export function getLeadActivities(leadId: string) {
  return inMemoryLeadActivities.get(leadId) || [];
}

// -----------------------------------------------------------------------------
// 8. AUDIT LOGGING
// -----------------------------------------------------------------------------

export function logAuditAction(params: {
  actorEmail?: string;
  role?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldVal?: unknown;
  newVal?: unknown;
  ipAddress?: string;
}) {
  const log = {
    id: crypto.randomUUID(),
    actor_email: params.actorEmail || "system",
    role: params.role || "system",
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId || null,
    old_value: params.oldVal ? JSON.stringify(params.oldVal) : null,
    new_value: params.newVal ? JSON.stringify(params.newVal) : null,
    ip_address: params.ipAddress || null,
    created_at: nowIso()
  };

  inMemoryAuditLogs.unshift(log);
  if (inMemoryAuditLogs.length > 500) inMemoryAuditLogs.pop();
}

export function getAuditLogsList(limit = 100) {
  return inMemoryAuditLogs.slice(0, limit);
}
