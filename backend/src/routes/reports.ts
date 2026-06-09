import { Router } from "express";
import { z } from "zod";
import { asyncRoute } from "@/backend/src/lib/async-route";
import { requireAuth, type AuthedRequest } from "@/backend/src/middleware/auth";
import { insforge } from "@/backend/src/lib/insforge";
import { HttpError } from "@/backend/src/lib/http-error";
import { logActivity, logAudit } from "@/backend/src/services/activity";
import { sendAdminNotification, sendReportReadyEmail } from "@/backend/src/services/email";

export const reportsRouter = Router();
const reportIdSchema = z.string().uuid();
const reportUploadSchema = z.object({
  bookingId: z.string().uuid(),
  bookingCode: z.string().optional().default(""),
  patientName: z.string().min(1),
  mobileNumber: z.string().min(10),
  files: z.array(z.object({
    fileName: z.string().min(1),
    fileSize: z.coerce.number().max(10 * 1024 * 1024),
    mimeType: z.literal("application/pdf"),
    fileData: z.string().min(1)
  })).min(1).max(10)
});
const uploadReportSchema = z.object({
  bookingId: z.string().uuid(),
  reportUrl: z.string().url(),
  fileName: z.string().optional(),
  status: z.enum(["pending", "ready", "completed"]).optional().default("ready")
});

function assertPdfPayload(file: { fileName: string; fileData: string; mimeType: string; fileSize: number }) {
  if (!file.fileName.toLowerCase().endsWith(".pdf")) {
    throw new HttpError(400, "Only PDF files are allowed.");
  }
  if (file.mimeType !== "application/pdf") {
    throw new HttpError(400, "Only PDF files are allowed.");
  }
  const header = Buffer.from(file.fileData.slice(0, 32), "base64").toString("utf8");
  if (!header.startsWith("%PDF")) {
    throw new HttpError(400, "Invalid PDF file signature.");
  }
}

reportsRouter.get(
  "/user",
  requireAuth("patient"),
  asyncRoute(async (request: AuthedRequest, response) => {
    const auth = request.auth;
    if (!auth?.userId) {
      throw new HttpError(401, "Patient session is missing.");
    }

    const { data, error } = await insforge.database
      .from("reports")
      .select("id, booking_id, report_url, file_name, status, generated_at, created_at, bookings(id, booking_id, user_id, preferred_date, patient_type, family_member_id, member_id, booking_items(item_name, item_type))")
      .order("created_at", { ascending: false });

    if (error) {
      throw new HttpError(500, error.message || "Unable to fetch reports.");
    }

    const reports = ((data ?? []) as Array<{ bookings?: { user_id?: string } | Array<{ user_id?: string }> }>).filter((report) => {
      const booking = Array.isArray(report.bookings) ? report.bookings[0] : report.bookings;
      return booking?.user_id === auth.userId;
    });

    response.json({ reports });
  })
);

reportsRouter.post(
  "/uploads",
  requireAuth("patient"),
  asyncRoute(async (request: AuthedRequest, response) => {
    const auth = request.auth;
    if (!auth?.userId) throw new HttpError(401, "Patient session is missing.");
    const parsed = reportUploadSchema.parse(request.body);
    parsed.files.forEach(assertPdfPayload);

    const { data: booking, error: bookingError } = await insforge.database
      .from("bookings")
      .select("id, user_id, booking_id, contact_name, contact_phone")
      .eq("id", parsed.bookingId)
      .eq("user_id", auth.userId)
      .maybeSingle();

    if (bookingError) throw new HttpError(500, bookingError.message || "Unable to validate booking.");
    if (!booking) throw new HttpError(404, "Booking not found for this account.");

    const { data, error } = await insforge.database.from("report_uploads").insert(
      parsed.files.map((file) => ({
        booking_id: parsed.bookingId,
        booking_code: parsed.bookingCode || (booking as { booking_id?: string }).booking_id || null,
        user_id: auth.userId,
        patient_name: parsed.patientName,
        mobile_number: parsed.mobileNumber.replace(/\D/g, "").slice(-10),
        file_name: file.fileName,
        file_size: file.fileSize,
        mime_type: file.mimeType,
        file_data: file.fileData,
        uploaded_by: auth.userId
      }))
    ).select("id, booking_id, booking_code, patient_name, mobile_number, file_name, file_size, created_at");

    if (error) throw new HttpError(500, error.message || "Unable to upload previous reports.");
    void logActivity({ userId: auth.userId, role: "patient", action: "report_uploaded", entityType: "booking", entityId: parsed.bookingId, metadata: { files: parsed.files.map((file) => file.fileName) }, request });
    void sendAdminNotification("admin_report_upload", "Previous report uploaded by patient", {
      bookingId: parsed.bookingCode || (booking as { booking_id?: string }).booking_id || parsed.bookingId,
      patientName: parsed.patientName,
      mobile: parsed.mobileNumber,
      files: parsed.files.map((file) => file.fileName).join(", ")
    });

    response.status(201).json({ success: true, reports: data ?? [] });
  })
);

reportsRouter.post(
  "/upload",
  requireAuth("admin"),
  asyncRoute(async (request: AuthedRequest, response) => {
    const auth = request.auth;
    const parsed = uploadReportSchema.parse(request.body);

    const { data, error } = await insforge.database
      .from("reports")
      .insert({
        booking_id: parsed.bookingId,
        report_url: parsed.reportUrl,
        file_name: parsed.fileName || null,
        status: parsed.status,
        generated_at: new Date().toISOString(),
        uploaded_by: auth?.userId || null
      })
      .select("id, booking_id, report_url, file_name, status, generated_at")
      .single();

    if (error || !data) {
      throw new HttpError(500, error?.message || "Unable to upload report.");
    }

    await insforge.database
      .from("bookings")
      .update({ booking_status: "completed", updated_at: new Date().toISOString() })
      .eq("id", parsed.bookingId);

    await insforge.database.from("booking_status_events").insert({
      booking_id: parsed.bookingId,
      status: "completed",
      note: "Report uploaded and ready",
      actor_id: auth?.userId || null,
      actor_role: "admin"
    });
    void logAudit({ adminId: auth?.userId, role: auth?.role, action: "report_uploaded", entityType: "report", entityId: data.id, metadata: { bookingId: parsed.bookingId, fileName: parsed.fileName }, request });
    const { data: bookingForEmail } = await insforge.database
      .from("bookings")
      .select("booking_id, contact_name, contact_email")
      .eq("id", parsed.bookingId)
      .maybeSingle();
    const bookingRow = bookingForEmail as { booking_id?: string; contact_name?: string; contact_email?: string } | null;
    void sendReportReadyEmail({
      to: bookingRow?.contact_email,
      patientName: bookingRow?.contact_name,
      bookingId: bookingRow?.booking_id || parsed.bookingId
    });
    void sendAdminNotification("admin_report_upload", "Lab report uploaded", {
      bookingId: bookingRow?.booking_id || parsed.bookingId,
      fileName: parsed.fileName || "",
      adminId: auth?.userId || ""
    });

    response.status(201).json({ success: true, report: data });
  })
);

reportsRouter.get(
  "/:id",
  requireAuth("patient"),
  asyncRoute(async (request: AuthedRequest, response) => {
    const auth = request.auth;
    const reportId = reportIdSchema.parse(request.params.id);

    const { data, error } = await insforge.database
      .from("reports")
      .select("id, booking_id, report_url, file_name, status, generated_at, bookings(user_id, patient_type, family_member_id, member_id)")
      .eq("id", reportId)
      .maybeSingle();

    if (error) {
      throw new HttpError(500, error.message || "Unable to fetch report.");
    }

    const relatedBooking = Array.isArray(data?.bookings) ? data.bookings[0] : data?.bookings;
    if (!data || !auth?.userId || relatedBooking?.user_id !== auth.userId) {
      throw new HttpError(404, "Report not found.");
    }
    void logActivity({ userId: auth.userId, role: "patient", action: "report_downloaded", entityType: "report", entityId: reportId, request });

    response.json({ report: data });
  })
);
