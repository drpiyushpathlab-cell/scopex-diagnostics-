import { requireAdminRole } from "@/lib/backend-service";
import type { AppJwtPayload } from "@/backend/src/lib/jwt";

const ADMIN_LOGIN_PATHS = new Set(["/admin/login"]);

/** Enforce authentication at the route boundary, including handlers that omit local guards. */
export function authorizeBackendRoute(request: Request, path: string): AppJwtPayload | null {
  const method = request.method.toUpperCase();
  if (ADMIN_LOGIN_PATHS.has(path) && method === "POST") return null;

  if (path === "/admin" || path.startsWith("/admin/")) {
    // These two partner sample endpoints are intentionally available to
    // assigned phlebotomists; the handlers apply the record ownership filter.
    const phlebotomistSampleRead = path === "/admin/partner-samples" && method === "GET";
    const phlebotomistSampleHandover =
      /^\/admin\/partner-samples\/[^/]+\/handover$/.test(path) && method === "POST";
    if (phlebotomistSampleRead || phlebotomistSampleHandover) {
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
