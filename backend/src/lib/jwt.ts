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

const defaultJwtSecret = "scopex-jwt-authentication-secret-key-32chars";

function getEffectiveJwtSecret(): string {
  // Never let the development fallback sign production tokens. A known secret
  // would let anyone mint an admin or patient token without authenticating.
  if (process.env.NODE_ENV === "production") {
    const productionSecret = process.env.APP_JWT_SECRET;
    if (!productionSecret || productionSecret.length < 32) {
      throw new Error("APP_JWT_SECRET must be configured with at least 32 characters in production.");
    }
    return productionSecret;
  }
  if (backendEnv.APP_JWT_SECRET && backendEnv.APP_JWT_SECRET.length >= 16) {
    return backendEnv.APP_JWT_SECRET;
  }
  if (process.env.APP_JWT_SECRET && process.env.APP_JWT_SECRET.length >= 16) {
    return process.env.APP_JWT_SECRET;
  }
  return defaultJwtSecret;
}

export function signAppToken(payload: AppJwtPayload) {
  const secret = getEffectiveJwtSecret();

  return jwt.sign(payload, secret, {
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
  const secret = getEffectiveJwtSecret();

  return jwt.verify(token, secret, {
    issuer: "scopex-backend",
    audience: "scopex-app"
  }) as AppJwtPayload;
}
