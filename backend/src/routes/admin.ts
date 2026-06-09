import { Router } from "express";
import { z } from "zod";
import { asyncRoute } from "@/backend/src/lib/async-route";
import { requireAuth, type AuthedRequest } from "@/backend/src/middleware/auth";
import { insforge } from "@/backend/src/lib/insforge";
import { HttpError } from "@/backend/src/lib/http-error";
import { authenticateAdmin } from "@/backend/src/services/admin";
import { signAppToken } from "@/backend/src/lib/jwt";
import { logAudit, logLogin } from "@/backend/src/services/activity";
import { hashPassword } from "@/backend/src/lib/password";
import { resendLoggedEmail, sendEmail, sendPasswordResetEmail } from "@/backend/src/services/email";
import crypto from "crypto";

export const adminRouter = Router();

const crudTables = new Set(["tests", "packages", "offers", "bookings", "phlebotomists", "reports"]);

const idSchema = z.object({ id: z.string().min(1) });
const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});
const passwordResetRequestSchema = z.object({ email: z.string().email() });
const passwordResetSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(8)
});
const emailLogQuerySchema = z.object({
  q: z.string().optional().default(""),
  status: z.string().optional().default(""),
  date: z.string().optional().default(""),
  format: z.string().optional().default("")
});
const testEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(2).default("ScopeX test email")
});

adminRouter.post(
  "/login",
  asyncRoute(async (request, response) => {
    const parsed = adminLoginSchema.parse(request.body);
    const admin = await authenticateAdmin(parsed.email, parsed.password);
    const token = signAppToken({
      userId: admin.id,
      email: admin.email,
      role: admin.role === "super-admin" ? "super_admin" : admin.role
    });
    void logLogin({ adminId: admin.id, role: admin.role, event: "login", request });

    response.json({
      success: true,
      token,
      user: {
        id: admin.id,
        email: admin.email,
        role: admin.role
      }
    });
  })
);

adminRouter.post(
  "/password-reset/request",
  asyncRoute(async (request, response) => {
    const parsed = passwordResetRequestSchema.parse(request.body);
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    await insforge.database
      .from("admins")
      .update({ reset_token: token, reset_expires_at: expiresAt, updated_at: new Date().toISOString() })
      .eq("email", parsed.email.toLowerCase());
    void sendPasswordResetEmail({
      to: parsed.email.toLowerCase(),
      resetUrl: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_ORIGIN || "https://www.scopexdiagnostics.in"}/admin/login?resetToken=${token}`,
      role: "admin"
    });

    response.json({
      success: true,
      message: "If an admin account exists, a password reset email has been sent.",
      ...(process.env.NODE_ENV !== "production" ? { resetToken: token } : {})
    });
  })
);

adminRouter.post(
  "/password-reset/confirm",
  asyncRoute(async (request, response) => {
    const parsed = passwordResetSchema.parse(request.body);
    const { data, error } = await insforge.database
      .from("admins")
      .select("id, reset_expires_at")
      .eq("reset_token", parsed.token)
      .maybeSingle();

    if (error) throw new HttpError(500, error.message || "Unable to validate reset token.");
    if (!data || new Date((data as { reset_expires_at?: string }).reset_expires_at || 0).getTime() < Date.now()) {
      throw new HttpError(400, "Password reset token is invalid or expired.");
    }

    const { error: updateError } = await insforge.database
      .from("admins")
      .update({
        password_hash: hashPassword(parsed.password),
        reset_token: null,
        reset_expires_at: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", (data as { id: string }).id);

    if (updateError) throw new HttpError(500, updateError.message || "Unable to reset password.");
    response.json({ success: true, message: "Password reset successfully." });
  })
);

adminRouter.get(
  "/overview",
  requireAuth("admin"),
  asyncRoute(async (_request, response) => {
    const [usersResult, bookingsResult, pendingResult, completedResult, reportsResult, loginResult, paymentsResult, recentBookings, recentReports, recentLogs] = await Promise.all([
      insforge.database.from("users").select("id", { count: "exact", head: true }),
      insforge.database.from("bookings").select("id", { count: "exact", head: true }),
      insforge.database.from("bookings").select("id", { count: "exact", head: true }).eq("booking_status", "pending_confirmation"),
      insforge.database.from("bookings").select("id", { count: "exact", head: true }).eq("booking_status", "completed"),
      insforge.database.from("reports").select("id", { count: "exact", head: true }),
      insforge.database.from("login_logs").select("id", { count: "exact", head: true }),
      insforge.database.from("payments").select("amount"),
      insforge.database.from("bookings").select("id, booking_id, contact_name, contact_phone, booking_status, created_at").order("created_at", { ascending: false }).limit(6),
      insforge.database.from("report_uploads").select("id, booking_id, patient_name, mobile_number, file_name, created_at").order("created_at", { ascending: false }).limit(6),
      insforge.database.from("audit_logs").select("id, action, entity_type, created_at, role").order("created_at", { ascending: false }).limit(8)
    ]);

    const paidRevenue = ((paymentsResult.data ?? []) as Array<{ amount?: number | string }>).reduce(
      (sum: number, row) => sum + Number(row.amount ?? 0),
      0
    );

    response.json({
      metrics: [
        {
          title: "Total orders",
          value: String(bookingsResult.count ?? 0),
          note: "All website bookings"
        },
        {
          title: "Pending confirmation",
          value: String(pendingResult.count ?? 0),
          note: "Bookings waiting for ops follow-up"
        },
        {
          title: "Paid revenue",
          value: `Rs. ${new Intl.NumberFormat("en-IN").format(paidRevenue)}`,
          note: "Captured online payments"
        }
      ]
    });
  })
);

adminRouter.get(
  "/dashboard",
  requireAuth("admin"),
  asyncRoute(async (_request, response) => {
    const [
      usersResult,
      bookingsResult,
      pendingResult,
      completedResult,
      reportsResult,
      loginResult,
      paymentsResult,
      recentBookings,
      recentReports,
      recentLogs
    ] = await Promise.all([
      insforge.database.from("users").select("id", { count: "exact", head: true }),
      insforge.database.from("bookings").select("id", { count: "exact", head: true }),
      insforge.database.from("bookings").select("id", { count: "exact", head: true }).eq("booking_status", "pending_confirmation"),
      insforge.database.from("bookings").select("id", { count: "exact", head: true }).eq("booking_status", "completed"),
      insforge.database.from("reports").select("id", { count: "exact", head: true }),
      insforge.database.from("login_logs").select("id", { count: "exact", head: true }),
      insforge.database.from("payments").select("amount"),
      insforge.database.from("bookings").select("id, booking_id, contact_name, contact_phone, booking_status, created_at").order("created_at", { ascending: false }).limit(6),
      insforge.database.from("report_uploads").select("id, booking_id, patient_name, mobile_number, file_name, created_at").order("created_at", { ascending: false }).limit(6),
      insforge.database.from("audit_logs").select("id, action, entity_type, created_at, role").order("created_at", { ascending: false }).limit(8)
    ]);

    const paidRevenue = ((paymentsResult.data ?? []) as Array<{ amount?: number | string }>).reduce(
      (sum: number, row) => sum + Number(row.amount ?? 0),
      0
    );

    response.json({
      metrics: [
        {
          title: "Total users",
          value: String(usersResult.count ?? 0),
          note: "Registered patient users"
        },
        {
          title: "Total bookings",
          value: String(bookingsResult.count ?? 0),
          note: "All website bookings"
        },
        {
          title: "Pending confirmation",
          value: String(pendingResult.count ?? 0),
          note: "Bookings waiting for ops follow-up"
        },
        {
          title: "Completed bookings",
          value: String(completedResult.count ?? 0),
          note: "Bookings marked completed"
        },
        {
          title: "Uploaded reports",
          value: String(reportsResult.count ?? 0),
          note: "Lab reports uploaded"
        },
        {
          title: "Active users",
          value: String(loginResult.count ?? 0),
          note: "Tracked login events"
        },
        {
          title: "Paid revenue",
          value: `Rs. ${new Intl.NumberFormat("en-IN").format(paidRevenue)}`,
          note: "Captured online payments"
        }
      ],
      recentActivities: recentLogs.data ?? [],
      recentBookings: recentBookings.data ?? [],
      recentUploads: recentReports.data ?? []
    });
  })
);

adminRouter.get(
  "/report-uploads",
  requireAuth("admin"),
  asyncRoute(async (request, response) => {
    const query = String(request.query.q || "").toLowerCase().trim();
    const date = String(request.query.date || "").trim();
    const { data, error } = await insforge.database
      .from("report_uploads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw new HttpError(500, error.message || "Unable to fetch uploaded reports.");

    const rows = ((data ?? []) as Array<Record<string, unknown>>).filter((row) => {
      const searchable = `${row.patient_name || ""} ${row.mobile_number || ""} ${row.booking_code || ""} ${row.booking_id || ""} ${row.file_name || ""}`.toLowerCase();
      const dateMatch = date ? String(row.created_at || "").startsWith(date) : true;
      return (!query || searchable.includes(query)) && dateMatch;
    });

    response.json({ reports: rows });
  })
);

adminRouter.delete(
  "/report-uploads/:id",
  requireAuth("admin"),
  asyncRoute(async (request: AuthedRequest, response) => {
    if (!["super_admin", "super-admin"].includes(String(request.auth?.role))) {
      throw new HttpError(403, "Only Super Admin can delete uploaded reports.");
    }

    const { id } = idSchema.parse(request.params);
    const { error } = await insforge.database.from("report_uploads").delete().eq("id", id);
    if (error) throw new HttpError(500, error.message || "Unable to delete report upload.");
    void logAudit({ adminId: request.auth?.userId, role: request.auth?.role, action: "report_deleted", entityType: "report_upload", entityId: id, request });
    response.json({ success: true });
  })
);

adminRouter.get(
  "/audit-logs",
  requireAuth("admin"),
  asyncRoute(async (request, response) => {
    const query = String(request.query.q || "").toLowerCase().trim();
    const date = String(request.query.date || "").trim();
    const format = String(request.query.format || "").toLowerCase();
    const { data, error } = await insforge.database
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) throw new HttpError(500, error.message || "Unable to fetch audit logs.");
    const logs = ((data ?? []) as Array<Record<string, unknown>>).filter((row) => {
      const searchable = `${row.action || ""} ${row.entity_type || ""} ${row.role || ""} ${JSON.stringify(row.metadata || {})}`.toLowerCase();
      const dateMatch = date ? String(row.created_at || "").startsWith(date) : true;
      return (!query || searchable.includes(query)) && dateMatch;
    });

    if (format === "csv") {
      const header = "created_at,role,action,entity_type,entity_id,ip_address\n";
      const csv = header + logs.map((row) => [row.created_at, row.role, row.action, row.entity_type, row.entity_id, row.ip_address].map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
      response.setHeader("Content-Type", "text/csv");
      response.setHeader("Content-Disposition", "attachment; filename=scopex-audit-logs.csv");
      return response.send(csv);
    }

    response.json({ logs });
  })
);


const permissionCatalog = [
  { group: "Dashboard", permissions: [
    ["dashboard.view", "View Dashboard"],
    ["dashboard.analytics", "View Analytics"],
    ["dashboard.revenue", "View Revenue"]
  ]},
  { group: "User Management", permissions: [
    ["users.view", "View Users"],
    ["users.create", "Create Users"],
    ["users.edit", "Edit Users"],
    ["users.delete", "Delete Users"],
    ["users.reset_password", "Reset Password"],
    ["users.activate", "Activate/Deactivate User"]
  ]},
  { group: "Booking Management", permissions: [
    ["bookings.view", "View Bookings"],
    ["bookings.create", "Create Booking"],
    ["bookings.edit", "Edit Booking"],
    ["bookings.delete", "Delete Booking"],
    ["bookings.assign_advisor", "Assign Advisor"],
    ["bookings.change_status", "Change Status"],
    ["bookings.export", "Export Bookings"]
  ]},
  { group: "Report Management", permissions: [
    ["reports.view", "View Reports"],
    ["reports.upload", "Upload PDF"],
    ["reports.replace", "Replace PDF"],
    ["reports.download", "Download PDF"],
    ["reports.delete", "Delete PDF"],
    ["reports.history", "View Upload History"]
  ]},
  { group: "Payment Management", permissions: [
    ["payments.view", "View Payments"],
    ["payments.edit", "Edit Payments"],
    ["payments.refund", "Refund Payments"],
    ["payments.revenue", "View Revenue Reports"]
  ]},
  { group: "Audit Logs", permissions: [
    ["audit.view", "View Logs"],
    ["audit.export", "Export Logs"],
    ["audit.delete", "Delete Logs"]
  ]},
  { group: "Settings", permissions: [
    ["settings.view", "View Settings"],
    ["settings.edit", "Edit Settings"],
    ["settings.email", "Email Configuration"],
    ["settings.sms", "SMS Configuration"]
  ]}
] as const;

const allPermissions = permissionCatalog.flatMap((group) => group.permissions.map(([key]) => key));

const roleSchema = z.object({
  role: z.string().min(2).regex(/^[a-z0-9_]+$/),
  display_name: z.string().min(2),
  description: z.string().optional().nullable(),
  permissions: z.array(z.string()).default([]),
  is_system: z.boolean().optional()
});

const assignRoleSchema = z.object({
  adminIds: z.array(z.string().min(1)),
  role: z.string().min(2)
});

const adminUserSchema = z.object({
  name: z.string().optional().nullable(),
  email: z.string().email(),
  mobile: z.string().optional().nullable(),
  password: z.string().min(8).optional(),
  role: z.string().min(2),
  is_active: z.boolean().optional(),
  custom_permissions_enabled: z.boolean().optional(),
  custom_permissions: z.array(z.string()).optional()
});

const bookingUpdateSchema = z.object({
  booking_status: z.enum(["new", "pending_confirmation", "confirmed", "sample_collected", "processing", "report_ready", "completed", "cancelled"]).optional(),
  contact_name: z.string().min(1).optional(),
  contact_phone: z.string().min(10).optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  preferred_date: z.string().optional(),
  preferred_time: z.string().optional(),
  payment_status: z.string().optional(),
  phlebotomist_id: z.string().optional().nullable(),
  eta_minutes: z.number().optional().nullable()
});

function normalizePermissions(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, allowed]) => Boolean(allowed))
      .map(([key]) => key);
  }
  return [];
}

const permissionAliases: Record<string, string[]> = {
  dashboard: ["dashboard.view"],
  users: ["users.view"],
  bookings: ["bookings.view"],
  reports: ["reports.view"],
  payments: ["payments.view", "payments.revenue", "dashboard.revenue"],
  audit: ["audit.view"]
};

async function resolveAdminPermissions(request: AuthedRequest) {
  const role = String(request.auth?.role || "");
  if (role === "super_admin" || role === "super-admin") return ["*"];

  const { data: admin } = await insforge.database
    .from("admins")
    .select("id, role, custom_permissions_enabled, custom_permissions")
    .eq("id", request.auth?.userId || "")
    .maybeSingle();

  const adminRow = (admin ?? {}) as { role?: string; custom_permissions_enabled?: boolean; custom_permissions?: unknown };
  if (adminRow.custom_permissions_enabled) return normalizePermissions(adminRow.custom_permissions);

  const effectiveRole = adminRow.role || role;
  const { data: roleRow } = await insforge.database
    .from("admin_roles")
    .select("permissions")
    .eq("role", effectiveRole)
    .maybeSingle();

  return normalizePermissions((roleRow as { permissions?: unknown } | null)?.permissions);
}

async function hasPermission(request: AuthedRequest, permission: string) {
  const required = permissionAliases[permission] || [permission];
  const granted = await resolveAdminPermissions(request);
  return granted.includes("*") || required.some((item) => granted.includes(item));
}

async function enforcePermission(request: AuthedRequest, permission: string) {
  if (!(await hasPermission(request, permission))) {
    throw new HttpError(403, "You do not have permission to perform this admin action.");
  }
}

function isSuperAdminRole(role: unknown) {
  return ["super_admin", "super-admin"].includes(String(role));
}

function textSearch(row: Record<string, unknown>, query: string) {
  if (!query) return true;
  return JSON.stringify(row).toLowerCase().includes(query.toLowerCase());
}

function paginateRows<T>(rows: T[], pageValue: unknown, pageSizeValue: unknown) {
  const page = Math.max(1, Number(pageValue || 1));
  const pageSize = Math.min(100, Math.max(5, Number(pageSizeValue || 25)));
  const start = (page - 1) * pageSize;
  return { rows: rows.slice(start, start + pageSize), page, pageSize, total: rows.length };
}

function sendCsv(response: Parameters<Parameters<typeof asyncRoute>[0]>[1], fileName: string, rows: Array<Record<string, unknown>>) {
  const keys = Array.from(rows.reduce((set, row) => {
    Object.keys(row).forEach((key) => set.add(key));
    return set;
  }, new Set<string>()));
  const header = keys.join(",");
  const body = rows.map((row) => keys.map((key) => `"${String(row[key] ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  response.setHeader("Content-Type", "text/csv");
  response.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
  response.send(`${header}\n${body}`);
}


adminRouter.get(
  "/roles-permissions",
  requireAuth("admin"),
  asyncRoute(async (request: AuthedRequest, response) => {
    await enforcePermission(request, "users");
    const [rolesResult, adminsResult] = await Promise.all([
      insforge.database.from("admin_roles").select("*").order("display_name", { ascending: true }),
      insforge.database.from("admins").select("id, name, email, mobile, role, is_active, custom_permissions_enabled, custom_permissions, last_login_at, created_at").order("created_at", { ascending: false })
    ]);
    if (rolesResult.error) throw new HttpError(500, rolesResult.error.message || "Unable to fetch roles.");
    if (adminsResult.error) throw new HttpError(500, adminsResult.error.message || "Unable to fetch admin users.");
    response.json({ catalog: permissionCatalog, allPermissions, roles: rolesResult.data ?? [], users: adminsResult.data ?? [] });
  })
);

adminRouter.post(
  "/roles-permissions",
  requireAuth("admin"),
  asyncRoute(async (request: AuthedRequest, response) => {
    if (!isSuperAdminRole(request.auth?.role)) throw new HttpError(403, "Only Super Admin can create roles.");
    const parsed = roleSchema.parse(request.body);
    const permissions = parsed.permissions.filter((permission) => allPermissions.includes(permission as (typeof allPermissions)[number]));
    const { data, error } = await insforge.database
      .from("admin_roles")
      .insert({ role: parsed.role, display_name: parsed.display_name, description: parsed.description, permissions, is_system: parsed.is_system ?? false })
      .select("*")
      .single();
    if (error || !data) throw new HttpError(500, error?.message || "Unable to create role.");
    void logAudit({ adminId: request.auth?.userId, role: request.auth?.role, action: "role_created", entityType: "admin_role", entityId: String((data as { id?: string }).id || parsed.role), metadata: { role: parsed.role, permissions }, request });
    response.status(201).json({ data });
  })
);

adminRouter.post(
  "/roles-permissions/:id/clone",
  requireAuth("admin"),
  asyncRoute(async (request: AuthedRequest, response) => {
    if (!isSuperAdminRole(request.auth?.role)) throw new HttpError(403, "Only Super Admin can clone roles.");
    const { id } = idSchema.parse(request.params);
    const parsed = z.object({ role: z.string().min(2).regex(/^[a-z0-9_]+$/), display_name: z.string().min(2) }).parse(request.body);
    const { data: source, error: sourceError } = await insforge.database.from("admin_roles").select("permissions, description").eq("id", id).maybeSingle();
    if (sourceError || !source) throw new HttpError(404, sourceError?.message || "Source role not found.");
    const { data, error } = await insforge.database
      .from("admin_roles")
      .insert({ role: parsed.role, display_name: parsed.display_name, description: (source as { description?: string }).description, permissions: (source as { permissions?: unknown }).permissions ?? [], is_system: false })
      .select("*")
      .single();
    if (error || !data) throw new HttpError(500, error?.message || "Unable to clone role.");
    void logAudit({ adminId: request.auth?.userId, role: request.auth?.role, action: "role_cloned", entityType: "admin_role", entityId: String((data as { id?: string }).id || parsed.role), metadata: { sourceRoleId: id }, request });
    response.status(201).json({ data });
  })
);

adminRouter.patch(
  "/roles-permissions/:id",
  requireAuth("admin"),
  asyncRoute(async (request: AuthedRequest, response) => {
    if (!isSuperAdminRole(request.auth?.role)) throw new HttpError(403, "Only Super Admin can change permissions.");
    const { id } = idSchema.parse(request.params);
    const parsed = roleSchema.partial().parse(request.body);
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (parsed.role) update.role = parsed.role;
    if (parsed.display_name) update.display_name = parsed.display_name;
    if (parsed.description !== undefined) update.description = parsed.description;
    if (parsed.permissions) update.permissions = parsed.permissions.filter((permission) => allPermissions.includes(permission as (typeof allPermissions)[number]));
    const { data, error } = await insforge.database.from("admin_roles").update(update).eq("id", id).select("*").single();
    if (error || !data) throw new HttpError(500, error?.message || "Unable to update role.");
    void logAudit({ adminId: request.auth?.userId, role: request.auth?.role, action: "role_updated", entityType: "admin_role", entityId: id, metadata: update, request });
    response.json({ data });
  })
);

adminRouter.delete(
  "/roles-permissions/:id",
  requireAuth("admin"),
  asyncRoute(async (request: AuthedRequest, response) => {
    if (!isSuperAdminRole(request.auth?.role)) throw new HttpError(403, "Only Super Admin can delete roles.");
    const { id } = idSchema.parse(request.params);
    const { data: roleRow, error: roleError } = await insforge.database.from("admin_roles").select("role, is_system").eq("id", id).maybeSingle();
    if (roleError || !roleRow) throw new HttpError(404, roleError?.message || "Role not found.");
    if ((roleRow as { is_system?: boolean }).is_system) throw new HttpError(400, "System roles cannot be deleted. Clone and customize instead.");
    const assigned = await insforge.database.from("admins").select("id", { count: "exact", head: true }).eq("role", (roleRow as { role: string }).role);
    if ((assigned.count ?? 0) > 0) throw new HttpError(400, "This role is assigned to users. Reassign users before deleting.");
    const { error } = await insforge.database.from("admin_roles").delete().eq("id", id);
    if (error) throw new HttpError(500, error.message || "Unable to delete role.");
    void logAudit({ adminId: request.auth?.userId, role: request.auth?.role, action: "role_deleted", entityType: "admin_role", entityId: id, request });
    response.json({ success: true });
  })
);

adminRouter.post(
  "/roles-permissions/assign-users",
  requireAuth("admin"),
  asyncRoute(async (request: AuthedRequest, response) => {
    if (!isSuperAdminRole(request.auth?.role)) throw new HttpError(403, "Only Super Admin can assign roles.");
    const parsed = assignRoleSchema.parse(request.body);
    const updatedAt = new Date().toISOString();
    const results = await Promise.all(parsed.adminIds.map((adminId) =>
      insforge.database
        .from("admins")
        .update({ role: parsed.role, custom_permissions_enabled: false, updated_at: updatedAt })
        .eq("id", adminId)
    ));
    const failed = results.find((result) => result.error);
    if (failed?.error) throw new HttpError(500, failed.error.message || "Unable to assign role.");
    void logAudit({ adminId: request.auth?.userId, role: request.auth?.role, action: "role_assigned", entityType: "admin", metadata: parsed, request });
    response.json({ success: true });
  })
);

adminRouter.get(
  "/users",
  requireAuth("admin"),
  asyncRoute(async (request: AuthedRequest, response) => {
    await enforcePermission(request, "users");
    const query = String(request.query.q || "").trim();
    const format = String(request.query.format || "").toLowerCase();
    const { data, error } = await insforge.database.from("users").select("id, phone, mobile, email, role, is_active, patient_id, created_at, updated_at").order("created_at", { ascending: false }).limit(500);
    if (error) throw new HttpError(500, error.message || "Unable to fetch users.");
    const rows = ((data ?? []) as Array<Record<string, unknown>>).filter((row) => textSearch(row, query));
    if (format === "csv") return sendCsv(response, "scopex-users.csv", rows);
    response.json({ ...paginateRows(rows, request.query.page, request.query.pageSize) });
  })
);

adminRouter.patch(
  "/users/:id",
  requireAuth("admin"),
  asyncRoute(async (request: AuthedRequest, response) => {
    await enforcePermission(request, "users");
    const { id } = idSchema.parse(request.params);
    const parsed = z.object({ email: z.string().email().optional().nullable(), is_active: z.boolean().optional(), role: z.string().optional() }).parse(request.body);
    const { data, error } = await insforge.database.from("users").update({ ...parsed, updated_at: new Date().toISOString() }).eq("id", id).select("*").single();
    if (error || !data) throw new HttpError(500, error?.message || "Unable to update user.");
    void logAudit({ adminId: request.auth?.userId, role: request.auth?.role, action: "user_updated", entityType: "user", entityId: id, metadata: parsed, request });
    response.json({ data });
  })
);

adminRouter.delete(
  "/users/:id",
  requireAuth("admin"),
  asyncRoute(async (request: AuthedRequest, response) => {
    if (!isSuperAdminRole(request.auth?.role)) {
      throw new HttpError(403, "Only Super Admin can delete users.");
    }
    const { id } = idSchema.parse(request.params);
    const { error } = await insforge.database.from("users").delete().eq("id", id);
    if (error) throw new HttpError(500, error.message || "Unable to delete user.");
    void logAudit({ adminId: request.auth?.userId, role: request.auth?.role, action: "user_deleted", entityType: "user", entityId: id, request });
    response.json({ success: true });
  })
);

adminRouter.get(
  "/users/:id/login-history",
  requireAuth("admin"),
  asyncRoute(async (request: AuthedRequest, response) => {
    await enforcePermission(request, "users");
    const { id } = idSchema.parse(request.params);
    const { data, error } = await insforge.database.from("login_logs").select("*").eq("user_id", id).order("created_at", { ascending: false }).limit(100);
    if (error) throw new HttpError(500, error.message || "Unable to fetch login history.");
    response.json({ logs: data ?? [] });
  })
);

adminRouter.get(
  "/admin-users",
  requireAuth("admin"),
  asyncRoute(async (request: AuthedRequest, response) => {
    await enforcePermission(request, "users");
    const { data, error } = await insforge.database.from("admins").select("id, name, email, mobile, role, is_active, custom_permissions_enabled, custom_permissions, last_login_at, created_at, updated_at").order("created_at", { ascending: false });
    if (error) throw new HttpError(500, error.message || "Unable to fetch admin users.");
    response.json({ users: data ?? [] });
  })
);

adminRouter.post(
  "/admin-users",
  requireAuth("admin"),
  asyncRoute(async (request: AuthedRequest, response) => {
    if (!["super_admin", "super-admin"].includes(String(request.auth?.role))) throw new HttpError(403, "Only Super Admin can create admin users.");
    const parsed = adminUserSchema.extend({ password: z.string().min(8) }).parse(request.body);
    const { data, error } = await insforge.database.from("admins").insert({ name: parsed.name, email: parsed.email.toLowerCase(), mobile: parsed.mobile, password_hash: hashPassword(parsed.password), role: parsed.role, is_active: parsed.is_active ?? true, custom_permissions_enabled: parsed.custom_permissions_enabled ?? false, custom_permissions: parsed.custom_permissions ?? [] }).select("id, email, role, is_active, created_at").single();
    if (error || !data) throw new HttpError(500, error?.message || "Unable to create admin user.");
    void logAudit({ adminId: request.auth?.userId, role: request.auth?.role, action: "admin_user_created", entityType: "admin", entityId: String((data as { id?: string }).id || ""), metadata: { email: parsed.email, role: parsed.role }, request });
    response.status(201).json({ data });
  })
);

adminRouter.patch(
  "/admin-users/:id",
  requireAuth("admin"),
  asyncRoute(async (request: AuthedRequest, response) => {
    if (!["super_admin", "super-admin"].includes(String(request.auth?.role))) throw new HttpError(403, "Only Super Admin can update admin users.");
    const { id } = idSchema.parse(request.params);
    const parsed = adminUserSchema.partial().parse(request.body);
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (parsed.name !== undefined) update.name = parsed.name;
    if (parsed.email) update.email = parsed.email.toLowerCase();
    if (parsed.mobile !== undefined) update.mobile = parsed.mobile;
    if (parsed.password) update.password_hash = hashPassword(parsed.password);
    if (parsed.role) update.role = parsed.role;
    if (typeof parsed.is_active === "boolean") update.is_active = parsed.is_active;
    if (typeof parsed.custom_permissions_enabled === "boolean") update.custom_permissions_enabled = parsed.custom_permissions_enabled;
    if (parsed.custom_permissions) update.custom_permissions = parsed.custom_permissions.filter((permission) => allPermissions.includes(permission as (typeof allPermissions)[number]));
    const { data, error } = await insforge.database.from("admins").update(update).eq("id", id).select("id, name, email, mobile, role, is_active, custom_permissions_enabled, custom_permissions, updated_at").single();
    if (error || !data) throw new HttpError(500, error?.message || "Unable to update admin user.");
    void logAudit({ adminId: request.auth?.userId, role: request.auth?.role, action: "admin_user_updated", entityType: "admin", entityId: id, metadata: { role: parsed.role, is_active: parsed.is_active }, request });
    response.json({ data });
  })
);

adminRouter.get(
  "/bookings-management",
  requireAuth("admin"),
  asyncRoute(async (request: AuthedRequest, response) => {
    await enforcePermission(request, "bookings");
    const query = String(request.query.q || "").trim();
    const status = String(request.query.status || "").trim();
    const format = String(request.query.format || "").toLowerCase();
    const { data, error } = await insforge.database.from("bookings").select("*").order("created_at", { ascending: false }).limit(500);
    if (error) throw new HttpError(500, error.message || "Unable to fetch bookings.");
    const rows = ((data ?? []) as Array<Record<string, unknown>>).filter((row) => (!status || String(row.booking_status) === status) && textSearch(row, query));
    if (format === "csv") return sendCsv(response, "scopex-bookings.csv", rows);
    response.json({ ...paginateRows(rows, request.query.page, request.query.pageSize) });
  })
);

adminRouter.patch(
  "/bookings-management/:id",
  requireAuth("admin"),
  asyncRoute(async (request: AuthedRequest, response) => {
    await enforcePermission(request, "bookings");
    const { id } = idSchema.parse(request.params);
    const parsed = bookingUpdateSchema.parse(request.body);
    const { data, error } = await insforge.database.from("bookings").update({ ...parsed, updated_at: new Date().toISOString() }).eq("id", id).select("*").single();
    if (error || !data) throw new HttpError(500, error?.message || "Unable to update booking.");
    void logAudit({ adminId: request.auth?.userId, role: request.auth?.role, action: "booking_updated", entityType: "booking", entityId: id, metadata: parsed, request });
    response.json({ data });
  })
);

adminRouter.delete(
  "/bookings-management/:id",
  requireAuth("admin"),
  asyncRoute(async (request: AuthedRequest, response) => {
    if (!["super_admin", "super-admin", "admin"].includes(String(request.auth?.role))) throw new HttpError(403, "Only Admin or Super Admin can delete bookings.");
    const { id } = idSchema.parse(request.params);
    const { error } = await insforge.database.from("bookings").delete().eq("id", id);
    if (error) throw new HttpError(500, error.message || "Unable to delete booking.");
    void logAudit({ adminId: request.auth?.userId, role: request.auth?.role, action: "booking_deleted", entityType: "booking", entityId: id, request });
    response.json({ success: true });
  })
);

adminRouter.get(
  "/revenue",
  requireAuth("admin"),
  asyncRoute(async (request: AuthedRequest, response) => {
    await enforcePermission(request, "payments");
    const query = String(request.query.q || "").trim();
    const format = String(request.query.format || "").toLowerCase();
    const { data, error } = await insforge.database.from("payments").select("*").order("created_at", { ascending: false }).limit(500);
    if (error) throw new HttpError(500, error.message || "Unable to fetch payments.");
    const rows = ((data ?? []) as Array<Record<string, unknown>>).filter((row) => textSearch(row, query));
    const total = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    if (format === "csv") return sendCsv(response, "scopex-revenue.csv", rows);
    response.json({ ...paginateRows(rows, request.query.page, request.query.pageSize), totalRevenue: total });
  })
);

adminRouter.get(
  "/sessions",
  requireAuth("admin"),
  asyncRoute(async (request: AuthedRequest, response) => {
    await enforcePermission(request, "audit");
    const query = String(request.query.q || "").trim();
    const format = String(request.query.format || "").toLowerCase();
    const { data, error } = await insforge.database.from("login_logs").select("*").order("created_at", { ascending: false }).limit(500);
    if (error) throw new HttpError(500, error.message || "Unable to fetch sessions.");
    const rows = ((data ?? []) as Array<Record<string, unknown>>).filter((row) => textSearch(row, query));
    if (format === "csv") return sendCsv(response, "scopex-login-sessions.csv", rows);
    response.json({ ...paginateRows(rows, request.query.page, request.query.pageSize) });
  })
);

adminRouter.get(
  "/email-logs",
  requireAuth("admin"),
  asyncRoute(async (request: AuthedRequest, response) => {
    await enforcePermission(request, "settings.view");
    const parsed = emailLogQuerySchema.parse(request.query);
    const query = parsed.q.toLowerCase().trim();
    const status = parsed.status.toLowerCase().trim();
    const date = parsed.date.trim();

    const { data, error } = await insforge.database
      .from("email_logs")
      .select("id, recipient_email, subject, event_type, status, sent_at, error_message, created_at, metadata")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) throw new HttpError(500, error.message || "Unable to fetch email logs.");
    const rows = ((data ?? []) as Array<Record<string, unknown>>).filter((row) => {
      const searchable = `${row.recipient_email || ""} ${row.subject || ""} ${row.event_type || ""} ${row.error_message || ""}`.toLowerCase();
      const statusMatch = status ? String(row.status || "").toLowerCase() === status : true;
      const dateMatch = date ? String(row.created_at || "").startsWith(date) : true;
      return (!query || searchable.includes(query)) && statusMatch && dateMatch;
    });

    if (parsed.format.toLowerCase() === "csv") return sendCsv(response, "scopex-email-logs.csv", rows);
    response.json({ ...paginateRows(rows, request.query.page, request.query.pageSize) });
  })
);

adminRouter.post(
  "/email-logs/:id/resend",
  requireAuth("admin"),
  asyncRoute(async (request: AuthedRequest, response) => {
    await enforcePermission(request, "settings.email");
    const { id } = idSchema.parse(request.params);
    const { data, error } = await insforge.database.from("email_logs").select("*").eq("id", id).maybeSingle();
    if (error) throw new HttpError(500, error.message || "Unable to fetch email log.");
    if (!data) throw new HttpError(404, "Email log not found.");
    const result = await resendLoggedEmail(data as Record<string, unknown>);
    void logAudit({ adminId: request.auth?.userId, role: request.auth?.role, action: "email_resent", entityType: "email_log", entityId: id, request });
    response.json(result);
  })
);

adminRouter.post(
  "/email-logs/test",
  requireAuth("admin"),
  asyncRoute(async (request: AuthedRequest, response) => {
    await enforcePermission(request, "settings.email");
    const parsed = testEmailSchema.parse(request.body);
    const result = await sendEmail({
      to: parsed.to,
      subject: parsed.subject,
      eventType: "test_email",
      html: "<p>This is a ScopeX Diagnostics test email from the production notification system.</p>",
      metadata: { adminId: request.auth?.userId }
    });
    void logAudit({ adminId: request.auth?.userId, role: request.auth?.role, action: "test_email_sent", entityType: "email_log", metadata: { to: parsed.to }, request });
    response.json(result);
  })
);

adminRouter.get(
  "/:resource",
  requireAuth("admin"),
  asyncRoute(async (request, response) => {
    const resource = String(request.params.resource);
    if (!crudTables.has(resource)) {
      throw new HttpError(404, "Admin resource not found.");
    }

    const { data, error } = await insforge.database
      .from(resource)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new HttpError(500, error.message || "Unable to fetch resource.");
    }

    response.json({ data: data ?? [] });
  })
);

adminRouter.post(
  "/:resource",
  requireAuth("admin"),
  asyncRoute(async (request, response) => {
    const resource = String(request.params.resource);
    if (!crudTables.has(resource) || resource === "bookings") {
      throw new HttpError(404, "Admin resource not writable.");
    }

    const { data, error } = await insforge.database.from(resource).insert(request.body).select("*").single();
    if (error || !data) {
      throw new HttpError(500, error?.message || "Unable to create resource.");
    }

    response.status(201).json({ data });
  })
);

adminRouter.patch(
  "/:resource/:id",
  requireAuth("admin"),
  asyncRoute(async (request, response) => {
    const resource = String(request.params.resource);
    const { id } = idSchema.parse(request.params);
    if (!crudTables.has(resource)) {
      throw new HttpError(404, "Admin resource not found.");
    }

    const { data, error } = await insforge.database.from(resource).update(request.body).eq("id", id).select("*").single();
    if (error || !data) {
      throw new HttpError(500, error?.message || "Unable to update resource.");
    }

    response.json({ data });
  })
);

adminRouter.delete(
  "/:resource/:id",
  requireAuth("admin"),
  asyncRoute(async (request, response) => {
    const resource = String(request.params.resource);
    const { id } = idSchema.parse(request.params);
    if (!crudTables.has(resource) || resource === "bookings") {
      throw new HttpError(404, "Admin resource not deletable.");
    }

    const { error } = await insforge.database.from(resource).delete().eq("id", id);
    if (error) {
      throw new HttpError(500, error.message || "Unable to delete resource.");
    }

    response.json({ success: true });
  })
);



