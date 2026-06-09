import nodemailer from "nodemailer";
import crypto from "crypto";
import { backendEnv } from "@/backend/src/config/env";
import { insforge } from "@/backend/src/lib/insforge";

type EmailEventType =
  | "user_welcome"
  | "email_verification"
  | "password_reset"
  | "booking_created"
  | "booking_status_update"
  | "report_ready"
  | "admin_new_booking"
  | "admin_new_user"
  | "admin_report_upload"
  | "admin_payment_received"
  | "test_email";

type EmailPayload = {
  to: string;
  subject: string;
  eventType: EmailEventType | string;
  html: string;
  text?: string;
  metadata?: Record<string, unknown>;
};

type BookingEmailInput = {
  to?: string | null;
  patientName?: string | null;
  bookingId?: string | null;
  city?: string | null;
  address?: string | null;
  preferredDate?: string | null;
  preferredTime?: string | null;
  amount?: string | number | null;
  status?: string | null;
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function siteUrl() {
  return (backendEnv.NEXT_PUBLIC_SITE_URL || backendEnv.FRONTEND_ORIGIN || "https://www.scopexdiagnostics.in").replace(/\/$/, "");
}

function brandShell(title: string, content: string) {
  return `<!doctype html><html><body style="margin:0;background:#f4faf8;font-family:Arial,Helvetica,sans-serif;color:#102a2d;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4faf8;padding:24px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #deece9;border-radius:24px;overflow:hidden;box-shadow:0 16px 36px rgba(16,24,40,.06);">
          <tr><td style="padding:28px 30px 12px;"><p style="margin:0;color:#0f8f7c;font-weight:800;letter-spacing:.16em;text-transform:uppercase;font-size:12px;">SCOPEX DIAGNOSTICS</p><h1 style="margin:10px 0 0;font-size:28px;line-height:1.2;color:#102a2d;">${escapeHtml(title)}</h1></td></tr>
          <tr><td style="padding:8px 30px 30px;font-size:16px;line-height:1.7;color:#456568;">${content}</td></tr>
          <tr><td style="background:#eef8f5;padding:18px 30px;font-size:12px;color:#5a7273;">ScopeX Diagnostics | Home sample collection and preventive diagnostics.</td></tr>
        </table>
      </td></tr>
    </table>
  </body></html>`;
}

function button(label: string, href: string) {
  return `<p style="margin:24px 0 0;"><a href="${escapeHtml(href)}" style="display:inline-block;background:#f37021;color:#fff;text-decoration:none;border-radius:999px;padding:13px 22px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;font-size:13px;">${escapeHtml(label)}</a></p>`;
}

function plainFromHtml(html: string) {
  return html.replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function adminRecipients() {
  return backendEnv.NOTIFICATION_EMAIL_TO.split(/[;,]/).map((item) => item.trim()).filter(Boolean);
}

function isSmtpConfigured() {
  return Boolean(backendEnv.SMTP_HOST && backendEnv.SMTP_USER && backendEnv.SMTP_PASSWORD && backendEnv.SMTP_SENDER_EMAIL);
}

function createTransporter() {
  if (!isSmtpConfigured()) return null;
  return nodemailer.createTransport({
    host: backendEnv.SMTP_HOST,
    port: backendEnv.SMTP_PORT,
    secure: backendEnv.SMTP_PORT === 465,
    auth: {
      user: backendEnv.SMTP_USER,
      pass: backendEnv.SMTP_PASSWORD
    }
  });
}

async function logEmail(payload: EmailPayload, status: "success" | "failed", errorMessage = "", providerMessageId = "") {
  try {
    await insforge.database.from("email_logs").insert({
      recipient_email: payload.to,
      subject: payload.subject,
      event_type: payload.eventType,
      status,
      sent_at: status === "success" ? new Date().toISOString() : null,
      error_message: errorMessage || null,
      provider_message_id: providerMessageId || null,
      body_html: payload.html,
      body_text: payload.text || plainFromHtml(payload.html),
      metadata: payload.metadata || {}
    });
  } catch (error) {
    console.error("[Email] Unable to log email", error);
  }
}

export async function sendEmail(payload: EmailPayload) {
  const normalizedTo = String(payload.to || "").trim().toLowerCase();
  const safePayload = { ...payload, to: normalizedTo, text: payload.text || plainFromHtml(payload.html) };

  if (!normalizedTo || !normalizedTo.includes("@")) {
    await logEmail(safePayload, "failed", "Missing or invalid recipient email.");
    return { success: false, error: "Missing or invalid recipient email." };
  }

  const transporter = createTransporter();
  if (!transporter) {
    await logEmail(safePayload, "failed", "SMTP is not configured.");
    return { success: false, error: "SMTP is not configured." };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${backendEnv.SMTP_SENDER_NAME}" <${backendEnv.SMTP_SENDER_EMAIL}>`,
      to: safePayload.to,
      subject: safePayload.subject,
      html: safePayload.html,
      text: safePayload.text
    });
    await logEmail(safePayload, "success", "", info.messageId || "");
    return { success: true, messageId: info.messageId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send email.";
    await logEmail(safePayload, "failed", message);
    return { success: false, error: message };
  }
}

export async function resendLoggedEmail(log: Record<string, unknown>) {
  return sendEmail({
    to: String(log.recipient_email || ""),
    subject: String(log.subject || "ScopeX Diagnostics"),
    eventType: String(log.event_type || "resend"),
    html: String(log.body_html || ""),
    text: String(log.body_text || ""),
    metadata: { resendOf: log.id }
  });
}

export function createVerificationToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function sendWelcomeAndVerificationEmail(params: { to: string; name?: string | null; verificationUrl: string; userId?: string | null }) {
  const name = params.name || "there";
  const html = brandShell(
    "Welcome to ScopeX Diagnostics",
    `<p>Hi ${escapeHtml(name)},</p><p>Your ScopeX account is ready. Verify your email to keep booking updates, reports, and payment notifications secure.</p>${button("Verify Email", params.verificationUrl)}<p style="font-size:13px;color:#6b7f80;">If the button does not work, open this link: ${escapeHtml(params.verificationUrl)}</p>`
  );
  return sendEmail({ to: params.to, subject: "Welcome to ScopeX Diagnostics - Verify your email", eventType: "email_verification", html, metadata: { userId: params.userId } });
}

export async function sendPasswordResetEmail(params: { to: string; resetUrl: string; role?: string }) {
  const html = brandShell(
    "Reset your ScopeX password",
    `<p>We received a request to reset your ScopeX admin password. This secure link will expire soon.</p>${button("Reset Password", params.resetUrl)}<p style="font-size:13px;color:#6b7f80;">If you did not request this, please ignore this email.</p>`
  );
  return sendEmail({ to: params.to, subject: "ScopeX password reset link", eventType: "password_reset", html, metadata: { role: params.role || "admin" } });
}

export async function sendBookingConfirmationEmail(params: BookingEmailInput) {
  if (!params.to) return;
  const html = brandShell(
    "Booking confirmed",
    `<p>Hi ${escapeHtml(params.patientName || "Patient")},</p><p>Your home collection booking has been created successfully.</p><ul><li><strong>Booking ID:</strong> ${escapeHtml(params.bookingId)}</li><li><strong>Date:</strong> ${escapeHtml(params.preferredDate)}</li><li><strong>Time:</strong> ${escapeHtml(params.preferredTime)}</li><li><strong>Address:</strong> ${escapeHtml(params.address)}, ${escapeHtml(params.city)}</li><li><strong>Amount:</strong> Rs. ${escapeHtml(params.amount ?? "")}</li></ul>${button("View Booking", `${siteUrl()}/patient/dashboard`)}`
  );
  return sendEmail({ to: params.to, subject: `Booking confirmed - ${params.bookingId || "ScopeX"}`, eventType: "booking_created", html, metadata: params as Record<string, unknown> });
}

export async function sendBookingStatusEmail(params: BookingEmailInput) {
  if (!params.to) return;
  const statusLabel = String(params.status || "updated").replace(/_/g, " ");
  const html = brandShell(
    `Booking ${statusLabel}`,
    `<p>Hi ${escapeHtml(params.patientName || "Patient")},</p><p>Your ScopeX booking status is now <strong>${escapeHtml(statusLabel)}</strong>.</p><p><strong>Booking ID:</strong> ${escapeHtml(params.bookingId)}</p>${button("Track Booking", `${siteUrl()}/patient/dashboard`)}`
  );
  return sendEmail({ to: params.to, subject: `Booking update - ${statusLabel}`, eventType: "booking_status_update", html, metadata: params as Record<string, unknown> });
}

export async function sendReportReadyEmail(params: BookingEmailInput) {
  if (!params.to) return;
  const html = brandShell(
    "Your report is ready",
    `<p>Hi ${escapeHtml(params.patientName || "Patient")},</p><p>Your ScopeX diagnostic report is ready. For privacy, we do not attach reports by email.</p><p>Please login to your account to view or download the report.</p>${button("Login to View Report", `${siteUrl()}/patient/dashboard`)}`
  );
  return sendEmail({ to: params.to, subject: `Your ScopeX report is ready - ${params.bookingId || ""}`.trim(), eventType: "report_ready", html, metadata: params as Record<string, unknown> });
}

export async function sendAdminNotification(eventType: EmailEventType, subject: string, rows: Record<string, unknown>) {
  const recipients = adminRecipients();
  if (recipients.length === 0) return;
  const htmlRows = Object.entries(rows).map(([key, value]) => `<li><strong>${escapeHtml(key)}:</strong> ${escapeHtml(value)}</li>`).join("");
  await Promise.all(recipients.map((to) => sendEmail({
    to,
    subject,
    eventType,
    html: brandShell(subject, `<p>ScopeX operations alert:</p><ul>${htmlRows}</ul>${button("Open Admin", `${siteUrl()}/admin/dashboard`)}`),
    metadata: rows
  })));
}
