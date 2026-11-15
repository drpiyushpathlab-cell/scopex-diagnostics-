import { getSupabaseServiceClient } from "@/lib/supabase-server";
import { getSupabaseAnonServerClient, hasSupabasePublicConfig } from "@/lib/supabase";
import { HttpError } from "@/backend/src/lib/http-error";
import { signPhlebotomistAppToken } from "@/backend/src/lib/jwt";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HANDOVER_BUCKET = "partner-sample-handover";

export async function authenticatePhlebotomist(email: string, password: string) {
  if (!hasSupabasePublicConfig()) throw new HttpError(503, "Phlebotomist authentication is not configured on this server.");
  const { data, error } = await getSupabaseAnonServerClient().auth.signInWithPassword({
    email: email.trim().toLowerCase(), password
  });
  if (error || !data.user || !data.user.email) throw new HttpError(401, "Invalid email or password.");
  if (!data.user.email_confirmed_at) throw new HttpError(403, "Confirm your account before signing in.");
  const { data: profile, error: profileError } = await getSupabaseServiceClient().from("phlebotomists")
    .select("id,name,active,verification_status").eq("auth_user_id", data.user.id).maybeSingle();
  if (profileError) throwDbError(profileError, "Unable to verify phlebotomist profile.");
  if (!profile || !profile.active || profile.verification_status !== "active") {
    throw new HttpError(403, "This account is not linked to an active, approved phlebotomist profile.");
  }
  const token = signPhlebotomistAppToken({ userId: data.user.id, email: data.user.email, role: "phlebotomist" });
  return { token, user: { id: profile.id, name: profile.name, email: data.user.email, role: "phlebotomist" } };
}

function requireUuid(value: string, label: string) {
  if (!UUID.test(value)) throw new HttpError(400, `${label} is invalid.`);
  return value;
}

function throwDbError(error: { code?: string; message?: string } | null, fallback: string): never {
  if (error?.code === "23505") throw new HttpError(409, "Duplicate partner identifier or active booking assignment.");
  if (error?.code === "42501") throw new HttpError(403, "This account is not assigned to this collection record.");
  if (error?.code === "P0002") throw new HttpError(404, "The requested record was not found.");
  if (error?.code === "22023") throw new HttpError(422, "The requested workflow transition or assignment is not valid.");
  console.error("Supabase phlebotomy operation failed", { code: error?.code || "unknown" });
  throw new HttpError(503, fallback);
}

export async function listCollectionAssignmentOptions() {
  const db = getSupabaseServiceClient();
  const [phlebs, labs, locations] = await Promise.all([
    db.from("phlebotomists").select("id,name,phone,email,city,pincodes,status,active,verification_status,max_daily_slots,assigned_count")
      .eq("active", true).eq("verification_status", "active").in("status", ["available", "on_duty"]).order("name"),
    db.from("partner_labs").select("id,name,status").eq("status", "active").order("name"),
    db.from("partner_lab_locations").select("id,partner_lab_id,city,full_address,pincode,status")
      .eq("status", "active").order("city")
  ]);
  if (phlebs.error || labs.error || locations.error) throwDbError(phlebs.error || labs.error || locations.error, "Unable to load active assignment options.");
  return { phlebotomists: phlebs.data || [], partnerLabs: labs.data || [], locations: locations.data || [] };
}

export async function assignBookingCollectionWorkflow(input: {
  bookingId: string; phlebotomistId: string; partnerLabId: string; partnerLocationId: string;
  scheduledAt: string; actorId: string; remarks?: string;
}) {
  requireUuid(input.bookingId, "Booking ID");
  requireUuid(input.phlebotomistId, "Phlebotomist ID");
  requireUuid(input.actorId, "Actor ID");
  if (!input.partnerLabId || !input.partnerLocationId || !Number.isFinite(Date.parse(input.scheduledAt))) {
    throw new HttpError(400, "Partner lab, location, and collection date/time are required.");
  }
  const { data, error } = await getSupabaseServiceClient().rpc("assign_booking_collection_workflow", {
    p_booking_id: input.bookingId,
    p_phlebotomist_id: input.phlebotomistId,
    p_partner_lab_id: input.partnerLabId,
    p_partner_location_id: input.partnerLocationId,
    p_scheduled_at: input.scheduledAt,
    p_actor_id: input.actorId,
    p_remarks: input.remarks || null
  });
  if (error) throwDbError(error, "Unable to save the booking assignment.");
  return data;
}

export async function updateCollectionJobInDatabase(input: {
  jobId: string; actorId: string; action: string; notes?: string; exceptionReason?: string;
  temperatureVerified?: boolean; fastingVerified?: boolean; fastingHours?: number;
}) {
  requireUuid(input.jobId, "Collection job ID");
  requireUuid(input.actorId, "Actor ID");
  const { data, error } = await getSupabaseServiceClient().rpc("update_phlebotomist_collection_job", {
    p_job_id: input.jobId, p_actor_id: input.actorId, p_action: input.action,
    p_notes: input.notes || null, p_exception_reason: input.exceptionReason || null,
    p_temperature_verified: input.temperatureVerified ?? null,
    p_fasting_verified: input.fastingVerified ?? null,
    p_fasting_hours: input.fastingHours ?? null
  });
  if (error) throwDbError(error, "Unable to update collection status.");
  return data;
}

export async function listAssignedCollectionJobs(actorId: string) {
  requireUuid(actorId, "Actor ID");
  const db = getSupabaseServiceClient();
  const { data: phleb, error: phlebError } = await db.from("phlebotomists")
    .select("id,name,phone,city,shift,skills,service_areas,max_daily_slots,assigned_count,rating,vehicle_type")
    .eq("auth_user_id", actorId).eq("active", true).eq("verification_status", "active").maybeSingle();
  if (phlebError) throwDbError(phlebError, "Unable to verify phlebotomist account.");
  if (!phleb) throw new HttpError(403, "This account is not linked to an active phlebotomist profile.");
  const { data: jobs, error } = await db.from("collection_jobs").select("*")
    .eq("phlebotomist_id", phleb.id).order("scheduled_at", { ascending: true });
  if (error) throwDbError(error, "Unable to load assigned collection jobs.");
  const bookingIds = [...new Set((jobs || []).map((job: any) => job.booking_id))];
  const [bookingsResult, samplesResult] = await Promise.all([
    bookingIds.length ? db.from("bookings").select("*").in("id", bookingIds) : Promise.resolve({ data: [], error: null } as any),
    bookingIds.length ? db.from("partner_samples").select("id,booking_id,scopex_sample_id,test_names,test_ids,handover_status")
      .in("booking_id", bookingIds).order("created_at") : Promise.resolve({ data: [], error: null } as any)
  ]);
  if (bookingsResult.error || samplesResult.error) throwDbError(bookingsResult.error || samplesResult.error, "Unable to load assigned booking details.");
  const bookingById = new Map((bookingsResult.data || []).map((booking: any) => [booking.id, booking]));
  const patientIds = [...new Set((bookingsResult.data || []).map((booking: any) => booking.patient_id).filter(Boolean))];
  const { data: patients, error: patientError } = patientIds.length
    ? await db.from("patients").select("id,name,mobile,age,gender").in("id", patientIds)
    : { data: [], error: null };
  if (patientError) throwDbError(patientError, "Unable to load assigned patient details.");
  const patientById = new Map((patients || []).map((patient: any) => [patient.id, patient]));
  const samplesByBooking = new Map<string, any[]>();
  for (const sample of samplesResult.data || []) samplesByBooking.set(sample.booking_id, [...(samplesByBooking.get(sample.booking_id) || []), sample]);
  const labIds = [...new Set((jobs || []).map((job: any) => job.partner_lab_id).filter(Boolean))];
  const locationIds = [...new Set((jobs || []).map((job: any) => job.partner_location_id).filter(Boolean))];
  const [labsResult, locationsResult] = await Promise.all([
    labIds.length ? db.from("partner_labs").select("id,name").in("id", labIds) : Promise.resolve({ data: [], error: null } as any),
    locationIds.length ? db.from("partner_lab_locations").select("id,city,full_address,pincode").in("id", locationIds) : Promise.resolve({ data: [], error: null } as any)
  ]);
  if (labsResult.error || locationsResult.error) throwDbError(labsResult.error || locationsResult.error, "Unable to load assigned partner lab details.");
  const labs = new Map((labsResult.data || []).map((lab: any) => [lab.id, lab]));
  const locations = new Map((locationsResult.data || []).map((loc: any) => [loc.id, loc]));
  const result = (jobs || []).map((job: any) => {
    const booking: any = bookingById.get(job.booking_id) || {};
    const patient: any = patientById.get(booking.patient_id) || {};
    const lab: any = labs.get(job.partner_lab_id) || {};
    const location: any = locations.get(job.partner_location_id) || {};
    return {
      jobId: job.id, bookingId: job.booking_id, bookingNumber: booking.booking_number || job.booking_id,
      status: job.status, assignmentStatus: job.assignment_status, patientName: patient.name || booking.contact_name || "Patient",
      patientPhone: patient.mobile || booking.contact_phone || "", patientAge: patient.age, patientGender: patient.gender,
      address: booking.address || "", city: location.city || "",
      pincode: booking.pincode || location.pincode || "", scheduledDate: job.scheduled_at?.slice(0,10) || "",
      scheduledTime: job.scheduled_at || "", partnerLabId: job.partner_lab_id, partnerLabName: lab.name || "",
      partnerLocationId: job.partner_location_id, partnerLocationCity: location.city || "",
      partnerLocationAddress: location.full_address || "", sampleRecords: samplesByBooking.get(job.booking_id) || [],
      requiredSkills: [], specialInstructions: booking.notes || "",
      sampleRequirements: (samplesByBooking.get(job.booking_id) || []).map((sample: any) => ({
        sampleRecordId: sample.id, scopexSampleId: sample.scopex_sample_id,
        name: sample.test_names?.[0] || "Diagnostic test", sampleType: sample.sample_type || "",
        handoverStatus: sample.handover_status
      })),
      acceptedAt: job.accepted_at, enRouteAt: job.en_route_at, arrivedAt: job.arrived_at,
      collectedAt: job.collected_at, completedAt: job.completed_at, statusHistory: job.status_history || [],
      collectionNotes: job.collection_notes
    };
  });
  return { phlebotomist: phleb, jobs: result };
}

export async function submitPartnerSampleHandover(input: {
  sampleRecordId: string; actorId: string; remarks?: string; files: File[];
}) {
  requireUuid(input.actorId, "Actor ID");
  if (!input.sampleRecordId || input.files.length === 0) throw new HttpError(400, "Upload at least one handover photograph.");
  if (input.files.length > 6) throw new HttpError(400, "Upload no more than six handover photographs at once.");
  const db = getSupabaseServiceClient();
  const uploaded: string[] = [];
  for (const file of input.files) {
    if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) throw new HttpError(400, "Each handover image must be an image file no larger than 8 MB.");
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100) || "handover.jpg";
    const path = `${input.sampleRecordId}/${crypto.randomUUID()}-${safeName}`;
    const { error } = await db.storage.from(HANDOVER_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
    if (error) { console.error("Handover photo upload failed", { code: error.name || "storage_error" }); throw new HttpError(503, "Unable to upload handover photograph."); }
    uploaded.push(path);
  }
  const { data, error } = await db.rpc("submit_partner_sample_handover", {
    p_sample_record_id: input.sampleRecordId, p_actor_id: input.actorId,
    p_remarks: input.remarks || null, p_photo_paths: uploaded
  });
  if (error) {
    await db.storage.from(HANDOVER_BUCKET).remove(uploaded);
    throwDbError(error, "Unable to submit sample handover.");
  }
  return data;
}

export async function setPartnerSampleIdentifiers(input: {
  sampleRecordId: string; actorId: string; barcode?: string; accessionNumber?: string;
  verify: boolean; remarks?: string;
}) {
  requireUuid(input.actorId, "Actor ID");
  const { data, error } = await getSupabaseServiceClient().rpc("set_partner_sample_identifiers", {
    p_sample_record_id: input.sampleRecordId, p_actor_id: input.actorId,
    p_partner_barcode: input.barcode || null, p_accession_number: input.accessionNumber || null,
    p_verify: input.verify, p_remarks: input.remarks || null
  });
  if (error) throwDbError(error, "Unable to save partner identifiers.");
  return data;
}

export async function listPartnerHandoverSamples() {
  const db = getSupabaseServiceClient();
  const { data, error } = await db.from("partner_samples")
    .select("*, partner_lab:partner_labs(name), partner_location:partner_lab_locations(city,full_address), booking:bookings(booking_number,patient_id,patients(name,mobile))")
    .in("handover_status", ["Pending Admin Verification", "Handover Exception", "Barcode / Accession ID Entered"])
    .order("handover_submitted_at", { ascending: true });
  if (error) throwDbError(error, "Unable to load pending sample handovers.");
  const ids = (data || []).map((sample: any) => sample.id);
  const { data: photos, error: photoError } = ids.length
    ? await db.from("partner_sample_handover_photos").select("id,sample_record_id,storage_path,uploaded_by,uploaded_at").in("sample_record_id", ids)
    : { data: [], error: null };
  if (photoError) throwDbError(photoError, "Unable to load handover photographs.");
  const bookingIds = [...new Set((data || []).map((sample: any) => sample.booking_id))];
  const { data: jobs, error: jobError } = bookingIds.length
    ? await db.from("collection_jobs").select("booking_id,scheduled_at,collected_at,phlebotomist:phlebotomists(name)").in("booking_id", bookingIds)
    : { data: [], error: null };
  if (jobError) throwDbError(jobError, "Unable to load collection and assignment details.");
  const jobByBooking = new Map((jobs || []).map((job: any) => [job.booking_id, job]));
  return Promise.all((data || []).map(async (sample: any) => {
    const photoRows = (photos || []).filter((photo: any) => photo.sample_record_id === sample.id);
    const signedPhotos = await Promise.all(photoRows.map(async (photo: any) => {
      const { data: signed, error: signedError } = await db.storage.from(HANDOVER_BUCKET).createSignedUrl(photo.storage_path, 600);
      if (signedError) throwDbError(signedError, "Unable to open handover photograph.");
      return { ...photo, signedUrl: signed.signedUrl };
    }));
    return { ...sample, collectionJob: jobByBooking.get(sample.booking_id) || null, handoverPhotos: signedPhotos };
  }));
}
