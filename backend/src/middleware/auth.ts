import type { NextFunction, Request, Response } from "express";
import { isAppTokenRevoked, verifyAppToken, type AppJwtPayload } from "@/backend/src/lib/jwt";
import { HttpError } from "@/backend/src/lib/http-error";

export type AuthedRequest = Request & {
  auth?: AppJwtPayload;
};

const adminRoles = new Set([
  "admin",
  "manager",
  "super_admin",
  "super-admin",
  "booking_manager",
  "report_manager",
  "finance_manager",
  "customer_support"
]);

export function requireAuth(role?: "patient" | "admin") {
  return function authMiddleware(request: AuthedRequest, _response: Response, next: NextFunction) {
    try {
      const authHeader = request.headers.authorization;
      const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";
      if (!token) {
        throw new HttpError(401, "Missing authorization token.");
      }
      if (isAppTokenRevoked(token)) {
        throw new HttpError(401, "Session has been logged out.");
      }

      const payload = verifyAppToken(token);
      if (role === "patient" && payload.role !== "patient") {
        throw new HttpError(403, "Unauthorized.");
      }
      if (role === "admin" && !adminRoles.has(payload.role)) {
        throw new HttpError(403, "Unauthorized.");
      }

      request.auth = payload;
      next();
    } catch (error) {
      next(error);
    }
  };
}
