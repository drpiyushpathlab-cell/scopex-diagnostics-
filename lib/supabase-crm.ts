import { HttpError } from "@/backend/src/lib/http-error";
import { getSupabaseServiceClient } from "@/lib/supabase-server";
import type { LeadRecord, LeadStatus, LeadPriority, ContactPreferences, LeadActivity, CrmTeamMember } from "@/lib/crm-service";

type DbRow = Record<string, any>;

function fail(message: string): never {
  throw new HttpError(500, message);
}

function mapLead(row: DbRow): LeadRecord {
  const metadata = row.metadata && typeof row.metadata === "object" ? row.metadata : {};
  const contactPreferences = (row.contact_preferences || metadata.contactPreferences || {}) as Partial<ContactPreferences>;
  return {
    id: row.id,
    name: row.name || "",
    phone: row.phone || row.mobile || row.mobile_number || "",
    normalizedPhone: row.normalized_phone || String(row.phone || row.mobile || row.mobile_number || "").replace(/\D/g, ""),
    email: row.email || undefined,
    location: row.location || row.address || undefined,
    city: row.city || undefined,
    pincode: row.pincode || undefined,
    interestedItems: Array.isArray(row.interested_items) ? row.interested_items : [],
    source: row.source || row.lead_type || "unknown",
    campaign: row.campaign || undefined,
    utmSource: row.utm_source || undefined,
    utmMedium: row.utm_medium || undefined,
    utmCampaign: row.utm_campaign || undefined,
    consent: row.consent !== false,
    contactPreferences: {
      phone: contactPreferences.phone !== false,
      whatsapp: contactPreferences.whatsapp !== false,
      email: contactPreferences.email !== false,
      ...(contactPreferences.preferredTimeSlot ? { preferredTimeSlot: contactPreferences.preferredTimeSlot } : {})
    },
    assignedEmployeeId: row.assigned_employee_id || null,
    assignedEmployeeName: row.assigned_employee_name || null,
    assignedAt: row.assigned_at || null,
    assignmentMode: row.assignment_mode || "unassigned",
    assignmentReason: row.assignment_reason || null,
    status: (row.status || "New") as LeadStatus,
    priority: (row.priority || "Medium") as LeadPriority,
    notes: row.notes || row.message || undefined,
    followUpDate: row.follow_up_date || null,
    followUpNotes: row.follow_up_notes || undefined,
    isDuplicate: row.is_duplicate === true,
    duplicateCount: Number(row.duplicate_count || 0),
    primaryLeadId: row.primary_lead_id || null,
    patientId: row.patient_id || null,
    bookingId: row.booking_id || null,
    bookingNumber: row.booking_number || undefined,
    convertedAmount: row.converted_amount == null ? null : Number(row.converted_amount),
    convertedAt: row.converted_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at
  };
}

function mapActivity(row: DbRow): LeadActivity {
  return {
    id: row.id,
    leadId: row.lead_id,
    activityType: row.activity_type,
    title: row.title || row.activity_type,
    notes: row.notes || "",
    performedBy: row.performed_by || "system",
    createdAt: row.created_at,
    metadata: row.metadata || {}
  };
}

function mapTeamMember(row: DbRow): CrmTeamMember {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    city: row.city,
    coveredPincodes: row.covered_pincodes || [],
    active: row.active,
    status: row.status,
    maxDailyWorkload: row.max_daily_workload,
    currentWorkload: row.current_workload
  };
}

export async function listCrmLeadsFromDatabase(params: {
  q?: string; status?: string; priority?: string; assignedTo?: string; unassignedOnly?: boolean;
  followUpStatus?: "all" | "today" | "overdue" | "upcoming"; source?: string; campaign?: string; page?: number; pageSize?: number;
}) {
  const supabase = getSupabaseServiceClient();
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(params.pageSize) || 25));
  let query = supabase.from("leads").select("*", { count: "exact" }).order("updated_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false });
  if (params.status && params.status !== "all") query = query.eq("status", params.status);
  if (params.priority && params.priority !== "all") query = query.eq("priority", params.priority);
  if (params.assignedTo && params.assignedTo !== "all") query = query.eq("assigned_employee_id", params.assignedTo);
  if (params.unassignedOnly) query = query.is("assigned_employee_id", null);
  if (params.source && params.source !== "all") query = query.eq("source", params.source);
  if (params.campaign && params.campaign !== "all") query = query.eq("campaign", params.campaign);
  const q = (params.q || "").replace(/[,%()"\\]/g, " ").trim();
  if (q) query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%,city.ilike.%${q}%,pincode.ilike.%${q}%,campaign.ilike.%${q}%,source.ilike.%${q}%`);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  if (params.followUpStatus === "today") query = query.gte("follow_up_date", today.toISOString()).lt("follow_up_date", tomorrow.toISOString());
  if (params.followUpStatus === "overdue") query = query.lt("follow_up_date", today.toISOString()).not("status", "in", '("Converted","Closed")');
  if (params.followUpStatus === "upcoming") query = query.gte("follow_up_date", tomorrow.toISOString());
  const start = (page - 1) * pageSize;
  const { data, error, count } = await query.range(start, start + pageSize - 1);
  if (error) fail("Unable to load CRM leads.");
  const rows = (data || []).map(mapLead);
  return { rows, total: count || 0, page, pageSize, totalPages: Math.ceil((count || 0) / pageSize) };
}

export async function createCrmLeadInDatabase(input: Record<string, any>, performedBy: string) {
  const phone = String(input.phone || "").trim();
  const normalizedPhone = phone.replace(/\D/g, "");
  if (!input.name?.trim() || normalizedPhone.length < 10) throw new HttpError(400, "Name and a valid phone number are required.");
  const { data, error } = await getSupabaseServiceClient().rpc("create_or_merge_crm_lead", {
    p_lead: {
      ...input,
      name: input.name.trim(),
      phone,
      normalizedPhone,
      email: input.email?.trim().toLowerCase() || null,
      performedBy
    },
    p_performed_by: performedBy
  });
  if (error) fail("Unable to save CRM lead.");
  const leadRow = data?.lead;
  if (!leadRow) fail("CRM lead save did not return a record.");
  let lead = mapLead(leadRow);
  let assignment: { assigned: boolean; lead: LeadRecord } | undefined;
  if (!data.is_duplicate && input.autoAssign !== false) {
    assignment = await assignCrmLeadInDatabase(lead.id, null, "", performedBy, true);
    lead = assignment.lead;
  }
  return {
    lead,
    isDuplicate: data.is_duplicate === true,
    ...(assignment ? { assignment: { assigned: assignment.assigned } } : {}),
    ...(data.duplicate_message ? { duplicateMessage: data.duplicate_message } : {})
  };
}

export async function assignCrmLeadInDatabase(leadId: string, memberId: string | null, reason: string, performedBy: string, automatic = false) {
  const { data, error } = await getSupabaseServiceClient().rpc("assign_crm_lead", {
    p_lead_id: leadId,
    p_member_id: memberId,
    p_reason: reason,
    p_performed_by: performedBy,
    p_auto: automatic
  });
  if (error) {
    if (error.code === "P0002") throw new HttpError(404, "Lead or available CRM team member not found.");
    fail("Unable to assign CRM lead.");
  }
  return { lead: mapLead(data.lead), assigned: data.assigned === true };
}

export async function bulkAutoAssignCrmLeadsFromDatabase(performedBy: string) {
  const supabase = getSupabaseServiceClient();
  const { data: leads, error } = await supabase.from("leads").select("id").is("assigned_employee_id", null).not("status", "in", '("Closed","Converted","Not Interested")').order("created_at", { ascending: true }).limit(200);
  if (error) fail("Unable to load unassigned CRM leads.");
  let assigned = 0;
  for (const lead of leads || []) {
    const result = await assignCrmLeadInDatabase(lead.id, null, "Bulk auto-assignment", performedBy, true);
    if (result.assigned) assigned += 1;
  }
  return { total: (leads || []).length, assigned, unassigned: (leads || []).length - assigned };
}

export async function getCrmLeadFromDatabase(id: string) {
  const { data, error } = await getSupabaseServiceClient().from("leads").select("*").eq("id", id).maybeSingle();
  if (error) fail("Unable to load CRM lead.");
  return data ? mapLead(data) : null;
}

export async function updateCrmLeadInDatabase(id: string, patch: Record<string, any>, performedBy: string) {
  const dbPatch: DbRow = { updated_at: new Date().toISOString() };
  const fields: Record<string, string> = {
    status: "status", priority: "priority", notes: "notes", followUpDate: "follow_up_date",
    location: "location", city: "city", pincode: "pincode", contactPreferences: "contact_preferences"
  };
  for (const [key, column] of Object.entries(fields)) if (Object.hasOwn(patch, key)) dbPatch[column] = patch[key];
  if (patch.followUpNotes !== undefined) dbPatch.follow_up_notes = String(patch.followUpNotes).slice(0, 2000);
  if (Object.keys(dbPatch).length === 1) throw new HttpError(400, "No supported CRM lead fields were provided.");

  const supabase = getSupabaseServiceClient();
  const { data: existing, error: readError } = await supabase.from("leads").select("id,status,priority").eq("id", id).maybeSingle();
  if (readError) fail("Unable to load CRM lead.");
  if (!existing) throw new HttpError(404, "Lead not found.");
  const { data, error } = await supabase.from("leads").update(dbPatch).eq("id", id).select("*").maybeSingle();
  if (error) fail("Unable to update CRM lead.");
  if (!data) throw new HttpError(404, "Lead not found.");
  if (patch.status && patch.status !== existing.status) {
    const { error: activityError } = await supabase.from("lead_activities").insert({
      lead_id: id, activity_type: "status_changed", title: "Status Updated",
      notes: `Status changed from ${existing.status} to ${patch.status}`, performed_by: performedBy,
      metadata: { oldStatus: existing.status, newStatus: patch.status }
    });
    if (activityError) fail("Lead updated, but the status activity could not be saved.");
  }
  return mapLead(data);
}

export async function getCrmAnalyticsFromDatabase(timeframeDays = 30) {
  const days = Math.min(180, Math.max(7, Number(timeframeDays) || 30));
  const supabase = getSupabaseServiceClient();
  const leads: DbRow[] = [];
  const teams: DbRow[] = [];
  for (let page = 0; ; page += 1) {
    const { data, error } = await supabase.from("leads")
      .select("id,status,priority,assigned_employee_id,assigned_employee_name,city,pincode,source,campaign,follow_up_date,converted_amount,converted_at,created_at")
      .order("created_at", { ascending: true }).range(page * 1000, page * 1000 + 999);
    if (error) fail("Unable to load CRM analytics data.");
    leads.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  const { data: teamData, error: teamError } = await supabase.from("crm_team_members").select("*").order("name");
  if (teamError) fail("Unable to load CRM team analytics.");
  teams.push(...(teamData || []));

  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const now = today.getTime();
  const converted = leads.filter((lead) => lead.status === "Converted");
  const unassigned = leads.filter((lead) => !lead.assigned_employee_id && !["Closed", "Not Interested", "Converted"].includes(lead.status));
  const todayFollowUps = leads.filter((lead) => String(lead.follow_up_date || "").slice(0, 10) === todayKey && !["Closed", "Converted"].includes(lead.status)).length;
  const overdueFollowUps = leads.filter((lead) => lead.follow_up_date && new Date(lead.follow_up_date).getTime() < now && !["Closed", "Converted"].includes(lead.status)).length;
  const statusOrder = ["New", "Contacted", "Qualified", "Follow-up", "Booking Pending", "Converted", "Not Interested", "Closed"];
  const counts = new Map<string, number>();
  for (const lead of leads) counts.set(String(lead.status || "New"), (counts.get(String(lead.status || "New")) || 0) + 1);
  const sourceBreakdown: Record<string, { total: number; converted: number; revenue: number }> = {};
  const teamStats = new Map<string, { totalAssigned: number; converted: number }>();
  for (const lead of leads) {
    const source = String(lead.campaign || lead.source || "unknown");
    const sourceItem = sourceBreakdown[source] || { total: 0, converted: 0, revenue: 0 };
    sourceItem.total += 1;
    if (lead.status === "Converted") {
      sourceItem.converted += 1;
      sourceItem.revenue += Number(lead.converted_amount || 0);
    }
    sourceBreakdown[source] = sourceItem;
    if (lead.assigned_employee_id) {
      const stats = teamStats.get(lead.assigned_employee_id) || { totalAssigned: 0, converted: 0 };
      stats.totalAssigned += 1;
      if (lead.status === "Converted") stats.converted += 1;
      teamStats.set(lead.assigned_employee_id, stats);
    }
  }

  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  const perDay = new Map<string, { newLeads: number; contacted: number; qualified: number; bookingPending: number; converted: number; dropOff: number; revenue: number }>();
  for (const lead of leads) {
    const createdDay = String(lead.created_at || "").slice(0, 10);
    if (createdDay >= start.toISOString().slice(0, 10)) {
      const item = perDay.get(createdDay) || { newLeads: 0, contacted: 0, qualified: 0, bookingPending: 0, converted: 0, dropOff: 0, revenue: 0 };
      item.newLeads += 1;
      if (lead.status === "Contacted") item.contacted += 1;
      if (lead.status === "Qualified") item.qualified += 1;
      if (lead.status === "Booking Pending") item.bookingPending += 1;
      if (lead.status === "Closed" || lead.status === "Not Interested") item.dropOff += 1;
      perDay.set(createdDay, item);
    }
    const convertedDay = String(lead.converted_at || "").slice(0, 10);
    if (lead.status === "Converted" && convertedDay >= start.toISOString().slice(0, 10)) {
      const item = perDay.get(convertedDay) || { newLeads: 0, contacted: 0, qualified: 0, bookingPending: 0, converted: 0, dropOff: 0, revenue: 0 };
      item.converted += 1;
      item.revenue += Number(lead.converted_amount || 0);
      perDay.set(convertedDay, item);
    }
  }
  const timeline = Array.from({ length: days }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    const dateKey = date.toISOString().slice(0, 10);
    const item = perDay.get(dateKey) || { newLeads: 0, contacted: 0, qualified: 0, bookingPending: 0, converted: 0, dropOff: 0, revenue: 0 };
    return {
      date: dateKey,
      displayDate: date.toLocaleDateString("en-IN", { month: "short", day: "numeric", timeZone: "UTC" }),
      ...item,
      conversionRate: item.newLeads ? Math.round(item.converted / item.newLeads * 100) : 0
    };
  });
  const periodNew = timeline.reduce((sum, item) => sum + item.newLeads, 0);
  const periodConverted = timeline.reduce((sum, item) => sum + item.converted, 0);
  const periodRevenue = timeline.reduce((sum, item) => sum + item.revenue, 0);
  const funnel = statusOrder.map((stage) => ({ stage, count: counts.get(stage) || 0, pct: leads.length ? Math.round((counts.get(stage) || 0) / leads.length * 100) : 0 }));
  const teamPerformance = teams.map((team) => {
    const stats = teamStats.get(team.id) || { totalAssigned: 0, converted: 0 };
    return { ...mapTeamMember(team), ...stats };
  });
  const transitions = statusOrder.slice(0, -1).map((fromStatus, index) => {
    const toStatus = statusOrder[index + 1];
    const count = counts.get(toStatus) || 0;
    return { stage: `${fromStatus} → ${toStatus}`, fromStatus, toStatus, count, dropCount: 0, conversionRate: counts.get(fromStatus) ? Math.round(count / counts.get(fromStatus)! * 100) : 0, avgDurationHours: 0 };
  });
  return {
    summary: {
      totalLeads: leads.length,
      newCount: counts.get("New") || 0,
      unassignedCount: unassigned.length,
      todayFollowUps,
      overdueFollowUps,
      convertedCount: converted.length,
      conversionRate: leads.length ? Math.round(converted.length / leads.length * 100) : 0,
      totalConvertedRevenue: converted.reduce((sum, lead) => sum + Number(lead.converted_amount || 0), 0)
    },
    funnel,
    sourceBreakdown,
    teamPerformance,
    transitionReport: {
      timeframeDays: days,
      timeline,
      transitions,
      summary: {
        totalNewInPeriod: periodNew,
        totalConvertedInPeriod: periodConverted,
        periodConversionRate: periodNew ? Math.round(periodConverted / periodNew * 100) : 0,
        totalRevenueInPeriod: periodRevenue,
        avgHoursToConvert: 0,
        directConversions: 0,
        funnelVelocityPerDay: Number((periodConverted / days).toFixed(1))
      }
    }
  };
}

export async function listCrmLeadActivitiesFromDatabase(leadId: string) {
  const { data, error } = await getSupabaseServiceClient().from("lead_activities").select("*").eq("lead_id", leadId).order("created_at", { ascending: false }).limit(200);
  if (error) fail("Unable to load CRM lead activity.");
  return (data || []).map(mapActivity);
}

export async function addCrmLeadActivityToDatabase(leadId: string, input: Record<string, any>, performedBy: string) {
  const typeMap: Record<string, string> = {
    created: "created", assigned: "assigned", transferred: "transferred", status_changed: "status_changed",
    call: "call", whatsapp: "whatsapp", email: "email", note: "note", follow_up_scheduled: "follow_up_scheduled",
    follow_up_completed: "follow_up_completed", duplicate_detected: "duplicate_detected", booking_converted: "booking_converted",
    auto_assignment_failed: "auto_assignment_failed"
  };
  const activityType = typeMap[String(input.activityType || "note")];
  if (!activityType) throw new HttpError(400, "Unsupported CRM activity type.");
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.from("lead_activities").insert({
    lead_id: leadId,
    activity_type: activityType,
    title: String(input.title || `${activityType} logged`).slice(0, 200),
    notes: String(input.notes || "").slice(0, 4000),
    performed_by: performedBy,
    metadata: input.metadata || {}
  }).select("*").single();
  if (error) {
    if (error.code === "23503") throw new HttpError(404, "Lead not found.");
    fail("Unable to save CRM activity.");
  }
  return mapActivity(data);
}

export async function listCrmTeamFromDatabase() {
  const { data, error } = await getSupabaseServiceClient().from("crm_team_members").select("*").order("name");
  if (error) fail("Unable to load CRM team members.");
  return (data || []).map(mapTeamMember);
}

export async function convertCrmLeadToBookingInDatabase(leadId: string, input: Record<string, any>, performedBy: string) {
  const bookingId = String(input.bookingId || "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(bookingId)) {
    throw new HttpError(400, "A valid existing booking ID is required to convert a lead.");
  }
  const supabase = getSupabaseServiceClient();
  const [{ data: booking, error: bookingError }, { data: existing, error: leadError }] = await Promise.all([
    supabase.from("bookings").select("id,booking_number,payable_amount,total_amount").eq("id", bookingId).maybeSingle(),
    supabase.from("leads").select("id,status").eq("id", leadId).maybeSingle()
  ]);
  if (bookingError || leadError) fail("Unable to verify the CRM conversion records.");
  if (!existing) throw new HttpError(404, "Lead not found.");
  if (!booking) throw new HttpError(404, "The linked booking does not exist.");
  const { data, error } = await supabase.from("leads").update({
    status: "Converted", booking_id: booking.id, booking_number: booking.booking_number,
    converted_amount: Number(booking.payable_amount ?? booking.total_amount ?? input.convertedAmount ?? 0),
    converted_at: new Date().toISOString(), updated_at: new Date().toISOString()
  }).eq("id", leadId).select("*").single();
  if (error) fail("Unable to link CRM lead to booking.");
  const { error: activityError } = await supabase.from("lead_activities").insert({
    lead_id: leadId, activity_type: "booking_converted", title: "Lead linked to booking",
    notes: `Linked to booking ${booking.booking_number || booking.id}.`, performed_by: performedBy,
    metadata: { bookingId: booking.id, bookingNumber: booking.booking_number }
  });
  if (activityError) fail("Lead was updated, but conversion history could not be saved.");
  return mapLead(data);
}

export async function upsertCrmTeamMemberInDatabase(input: Record<string, any>) {
  if (!String(input.name || "").trim() || !String(input.city || "").trim()) throw new HttpError(400, "Name and city are required.");
  const record = {
    ...(input.id ? { id: String(input.id) } : {}),
    name: String(input.name).trim(),
    email: String(input.email || "").trim().toLowerCase(),
    phone: String(input.phone || "").trim(),
    role: input.role || "customer_support",
    city: String(input.city).trim(),
    covered_pincodes: Array.isArray(input.coveredPincodes) ? input.coveredPincodes.map(String) : [],
    active: input.active !== false,
    status: input.status || "available",
    max_daily_workload: Math.max(1, Number(input.maxDailyWorkload) || 20),
    current_workload: Math.max(0, Number(input.currentWorkload) || 0),
    updated_at: new Date().toISOString()
  };
  const { data, error } = await getSupabaseServiceClient().from("crm_team_members").upsert(record).select("*").single();
  if (error) fail("Unable to save CRM team member.");
  return mapTeamMember(data);
}
