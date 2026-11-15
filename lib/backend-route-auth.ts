import { requireAdminRole } from "@/lib/backend-service";
import type { AppJwtPayload } from "@/backend/src/lib/jwt";

const ADMIN_LOGIN_PATHS = new Set(["/admin/login", "/phlebotomist/login"]);

/** Enforce authentication at the route boundary, including handlers that omit local guards. */
export function authorizeBackendRoute(request: Request, path: string): AppJwtPayload | null {
  const method = request.method.toUpperCase();
  if (ADMIN_LOGIN_PATHS.has(path) && method === "POST") return null;

  if (path === "/admin" || path.startsWith("/admin/")) {
    // Handover submission is available to phlebotomists only after the SQL RPC
    // checks the authenticated identity against the assigned collection job.
    const phlebotomistSampleHandover =
      /^\/admin\/partner-samples\/[^/]+\/handover$/.test(path) && method === "POST";
    if (phlebotomistSampleHandover) {
      return requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager", "customer_support", "phlebotomist"]);
    }
    return requireAdminRole(request);
  }

  if (path === "/phlebotomist/team") {
    return requireAdminRole(request, ["super_admin", "admin", "manager", "booking_manager", "customer_support"]);
  }

  if (path === "/phlebotomist/jobs" || path.startsWith("/phlebotomist/jobs/")) {
    return requireAdminRole(request, ["phlebotomist", "super_admin", "admin", "manager", "booking_manager"]);
  }

  return null;
}
