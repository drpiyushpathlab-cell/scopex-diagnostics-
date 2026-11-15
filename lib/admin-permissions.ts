import { HttpError } from "@/backend/src/lib/http-error";
import { getSupabaseServiceClient } from "@/lib/supabase-server";

export const ADMIN_PERMISSION_GROUPS = [
  { group: "Overview", permissions: [["overview.view", "View dashboard"]] },
  { group: "Bookings", permissions: [["bookings.view", "View bookings"], ["bookings.manage", "Manage bookings"]] },
  { group: "Revenue", permissions: [["revenue.view", "View revenue"]] },
  { group: "Patients", permissions: [["patients.view", "View patient accounts"], ["patients.manage", "Manage patient accounts"]] },
  { group: "Catalog", permissions: [["tests.view", "View tests"], ["tests.manage", "Manage tests"], ["packages.view", "View packages"], ["packages.manage", "Manage packages"], ["catalog.manage", "Manage categories and service areas"]] },
  { group: "Operations", permissions: [["customer-care.view", "View customer care"], ["customer-care.manage", "Manage customer care and dispatch"], ["phlebotomists.view", "View phlebotomists"], ["phlebotomists.manage", "Manage phlebotomists"]] },
  { group: "Partners", permissions: [["partners.view", "View partner labs"], ["partners.manage", "Manage partner labs"]] },
  { group: "CRM", permissions: [["crm.view", "View CRM"], ["crm.manage", "Manage CRM"]] },
  { group: "Reports", permissions: [["reports.view", "View reports"], ["reports.manage", "Manage reports"]] },
  { group: "SEO", permissions: [["seo.view", "View SEO content"], ["seo.manage", "Manage SEO content"]] },
  { group: "Administration", permissions: [["users.view", "View admin and patient accounts"], ["users.manage", "Manage admin accounts"], ["audit.view", "View audit and session history"]] }
] as const;

export const ADMIN_PERMISSION_KEYS = ADMIN_PERMISSION_GROUPS.flatMap((group) => group.permissions.map(([key]) => key));

const BUILT_IN_ROLES = ["super_admin", "admin", "manager", "booking_manager", "report_manager", "finance_manager", "customer_support"] as const;

function permissionFor(path: string, method: string): string | null {
  if (path === "/admin/overview" || path === "/admin/dashboard") return "overview.view";
  if (path.startsWith("/admin/bookings") || path === "/admin/bookings-management") return method === "GET" ? "bookings.view" : "bookings.manage";
  if (path.startsWith("/admin/revenue")) return "revenue.view";
  if (path === "/admin/users") return method === "GET" ? "patients.view" : "patients.manage";
  if (path === "/admin/admin-users" || path.startsWith("/admin/admin-users/")) return method === "GET" ? "users.view" : "users.manage";
  if (path.startsWith("/admin/tests")) return method === "GET" ? "tests.view" : "tests.manage";
  if (path.startsWith("/admin/packages")) return method === "GET" ? "packages.view" : "packages.manage";
  if (path.startsWith("/admin/categories") || path.startsWith("/admin/service-areas") || path.startsWith("/admin/assignment-settings")) return method === "GET" ? "catalog.manage" : "catalog.manage";
  if (path.startsWith("/admin/crm")) return method === "GET" ? "crm.view" : "crm.manage";
  if (path.startsWith("/admin/customer-care") || path.startsWith("/admin/allocation")) return method === "GET" ? "customer-care.view" : "customer-care.manage";
  if (path.startsWith("/phlebotomist/jobs") || path.startsWith("/admin/partner-samples")) return method === "GET" ? "phlebotomists.view" : "phlebotomists.manage";
  if (path.startsWith("/admin/phlebotomists")) return method === "GET" ? "phlebotomists.view" : "phlebotomists.manage";
  if (path.startsWith("/admin/partner-labs") || path.startsWith("/admin/partner-test-master") || path.startsWith("/admin/partner-reports") || path.startsWith("/admin/partner-invoices") || path.startsWith("/admin/partner-financials")) return method === "GET" ? "partners.view" : "partners.manage";
  if (path.startsWith("/admin/reports") || path.startsWith("/admin/report-uploads")) return method === "GET" ? "reports.view" : "reports.manage";
  if (path.startsWith("/admin/seo")) return method === "GET" ? "seo.view" : "seo.manage";
  if (path.startsWith("/admin/audit-logs") || path.startsWith("/admin/sessions")) return "audit.view";
  return null;
}

export async function enforceStoredAdminPermission(path: string, method: string, userId: string, role: string) {
  if (role === "super_admin") return;
  const permission = permissionFor(path, method.toUpperCase());
  if (!permission) return;
  const supabase = getSupabaseServiceClient();
  const { data: userOverride, error: overrideError } = await supabase.from("admin_user_permission_overrides").select("allowed").eq("user_id", userId).eq("permission", permission).maybeSingle();
  if (overrideError) throw new HttpError(503, "Unable to verify administrator permissions.");
  if (userOverride && userOverride.allowed === false) throw new HttpError(403, "Access denied for this administrator account.");
  if (userOverride?.allowed === true) return;
  const { data: rolePermission, error: roleError } = await supabase.from("admin_role_permissions").select("allowed").eq("role", role).eq("permission", permission).maybeSingle();
  if (roleError) throw new HttpError(503, "Unable to verify role permissions.");
  if (rolePermission && rolePermission.allowed === false) throw new HttpError(403, "Access denied for this administrator role.");
}

export function validateBuiltInRole(role: unknown): (typeof BUILT_IN_ROLES)[number] {
  if (typeof role !== "string" || !BUILT_IN_ROLES.includes(role as (typeof BUILT_IN_ROLES)[number])) throw new HttpError(400, "Select one of the supported administrator roles.");
  return role as (typeof BUILT_IN_ROLES)[number];
}

export function validatePermissionList(value: unknown): string[] {
  if (!Array.isArray(value)) throw new HttpError(400, "Permissions must be a list.");
  const values = [...new Set(value.map(String))];
  if (values.some((permission) => !ADMIN_PERMISSION_KEYS.includes(permission as (typeof ADMIN_PERMISSION_KEYS)[number]))) throw new HttpError(400, "The request includes an unsupported permission.");
  return values;
}
