import jwt from "jsonwebtoken";
import { backendEnv } from "@/backend/src/config/env";

export type AppJwtPayload = {
  userId: string;
  patientId?: string | null;
  mobile?: string | null;
  email?: string | null;
  role:
    | "patient"
    | "admin"
    | "manager"
    | "super_admin"
    | "super-admin"
    | "booking_manager"
    | "report_manager"
    | "finance_manager"
    | "customer_support"
    | string;
};

const revokedTokens = new Set<string>();

export function signAppToken(payload: AppJwtPayload) {
  if (!backendEnv.APP_JWT_SECRET || backendEnv.APP_JWT_SECRET.length < 16) {
    throw new Error("APP_JWT_SECRET is not configured.");
  }

  return jwt.sign(payload, backendEnv.APP_JWT_SECRET, {
    expiresIn: "365d",
    issuer: "scopex-backend",
    audience: "scopex-app"
  });
}

export function revokeAppToken(token: string) {
  revokedTokens.add(token);
}

export function isAppTokenRevoked(token: string) {
  return revokedTokens.has(token);
}

export function verifyAppToken(token: string) {
  if (!backendEnv.APP_JWT_SECRET || backendEnv.APP_JWT_SECRET.length < 16) {
    throw new Error("APP_JWT_SECRET is not configured.");
  }

  return jwt.verify(token, backendEnv.APP_JWT_SECRET, {
    issuer: "scopex-backend",
    audience: "scopex-app"
  }) as AppJwtPayload;
}
