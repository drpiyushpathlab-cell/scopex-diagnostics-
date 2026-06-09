import type { Request } from "express";
import { insforge } from "@/backend/src/lib/insforge";

type LogParams = {
  userId?: string | null;
  adminId?: string | null;
  role?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
};

function requestMeta(request?: Request) {
  return {
    ip_address: request?.ip || request?.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() || null,
    user_agent: request?.headers["user-agent"] || null
  };
}

export async function logLogin(params: {
  userId?: string | null;
  adminId?: string | null;
  role: string;
  event: "login" | "logout";
  request?: Request;
}) {
  try {
    await insforge.database.from("login_logs").insert({
      user_id: params.userId || null,
      admin_id: params.adminId || null,
      role: params.role,
      event: params.event,
      login_time: params.event === "login" ? new Date().toISOString() : null,
      logout_time: params.event === "logout" ? new Date().toISOString() : null,
      last_active_at: new Date().toISOString(),
      ...requestMeta(params.request)
    });
  } catch {
    // Activity logging must never break the primary auth flow.
  }
}

export async function logActivity(params: LogParams & { request?: Request }) {
  try {
    await insforge.database.from("user_activity_logs").insert({
      user_id: params.userId || null,
      admin_id: params.adminId || null,
      role: params.role || null,
      action: params.action,
      entity_type: params.entityType || null,
      entity_id: params.entityId || null,
      metadata: params.metadata || {},
      last_active_at: new Date().toISOString(),
      ...requestMeta(params.request)
    });
  } catch {
    // Non-blocking by design.
  }
}

export async function logAudit(params: LogParams & { request?: Request }) {
  try {
    await insforge.database.from("audit_logs").insert({
      admin_id: params.adminId || null,
      role: params.role || null,
      action: params.action,
      entity_type: params.entityType || null,
      entity_id: params.entityId || null,
      metadata: params.metadata || {},
      ...requestMeta(params.request)
    });
  } catch {
    // Non-blocking by design.
  }
}
