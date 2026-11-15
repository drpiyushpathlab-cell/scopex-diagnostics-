import { authorizeBackendRoute } from "@/lib/backend-route-auth";
import { enforceStoredAdminPermission } from "@/lib/admin-permissions";
import { HttpError } from "@/backend/src/lib/http-error";

export async function authorizeSeoRoute(request: Request) {
  const path = new URL(request.url).pathname.replace(/^\/api/, "");
  const admin = authorizeBackendRoute(request, path);
  if (!admin) throw new HttpError(401, "Administrator authentication is required.");
  await enforceStoredAdminPermission(path, request.method, admin.userId, admin.role);
  return admin;
}
