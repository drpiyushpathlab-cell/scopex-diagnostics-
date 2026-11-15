-- Local draft only: persistent admin module storage.
-- Apply only after review in a non-production Supabase project.
-- Existing public tables are reused where possible; this file does not seed demo data.

create extension if not exists pgcrypto;

-- Lock down the SECURITY DEFINER helper used by existing RLS policies.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_roles as ar
    where ar.user_id = auth.uid()
      and ar.role in ('super_admin','admin','manager','booking_manager','report_manager','finance_manager','customer_support')
  );
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

-- Existing pending migrations create these. RLS intentionally has no browser policies:
-- only the server service client may access them, after verifying the application JWT.
alter table public.phlebotomists
  add column if not exists shift text not null default 'full_day' check (shift in ('morning','evening','full_day')),
  add column if not exists skills text[] not null default '{}'::text[],
  add column if not exists service_areas text[] not null default '{}'::text[],
  add column if not exists vehicle_type text not null default 'two_wheeler' check (vehicle_type in ('two_wheeler','four_wheeler','transit'));

alter table public.crm_team_members enable row level security;
alter table public.crm_team_members force row level security;
alter table public.lead_activities enable row level security;
alter table public.lead_activities force row level security;
alter table public.audit_logs enable row level security;
alter table public.audit_logs force row level security;
alter table public.login_logs enable row level security;
alter table public.login_logs force row level security;
alter table public.phlebotomists enable row level security;
alter table public.phlebotomists force row level security;

create table if not exists public.collection_jobs (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete restrict,
  phlebotomist_id uuid references public.phlebotomists(id) on delete set null,
  status text not null default 'Assigned' check (status in ('Assigned','Accepted','En Route','Arrived','Collected','Completed','Exception')),
  status_history jsonb not null default '[]'::jsonb,
  allocation_mode text not null default 'unassigned' check (allocation_mode in ('auto','manual','unassigned')),
  exception_queue boolean not null default false,
  accepted_at timestamptz,
  en_route_at timestamptz,
  arrived_at timestamptz,
  collected_at timestamptz,
  completed_at timestamptz,
  exception_at timestamptz,
  decline_reason text,
  exception_reason text,
  collection_notes text,
  barcodes text[] not null default '{}'::text[],
  vials_collected jsonb not null default '[]'::jsonb,
  temperature_verified boolean,
  fasting_status_verified boolean,
  fasting_hours_reported integer check (fasting_hours_reported is null or fasting_hours_reported >= 0),
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_care_interactions (
  id uuid primary key default gen_random_uuid(),
  target_kind text not null check (target_kind in ('lead','booking')),
  target_id text not null,
  interaction_kind text not null check (interaction_kind in ('call','message','note','follow_up')),
  channel text check (channel is null or channel in ('phone','whatsapp','sms','email','internal')),
  outcome text,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  subject text,
  notes text,
  follow_up_at timestamptz,
  delivery_status text check (delivery_status is null or delivery_status in ('queued','sent','delivered','failed','not_applicable')),
  performed_by text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.partner_labs (
  id text primary key,
  name text not null,
  brand_name text not null,
  legal_name text,
  registration_number text not null unique,
  is_nabl_accredited boolean not null default false,
  nabl_number text,
  gstin text,
  registered_address text not null,
  primary_contact_person text not null,
  mobile text not null,
  email text not null,
  status text not null default 'pending_verification' check (status in ('pending_verification','active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.partner_lab_locations (
  id text primary key,
  partner_lab_id text not null references public.partner_labs(id) on delete restrict,
  city text not null,
  full_address text not null,
  pincode text not null,
  contact_person text not null,
  mobile text not null,
  email text not null,
  sample_receiving_timings text not null,
  operating_days text[] not null default '{}'::text[],
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.partner_test_mappings (
  id text primary key,
  partner_lab_id text not null references public.partner_labs(id) on delete restrict,
  applicability text not null check (applicability in ('pan_india','selected_cities','single_city')),
  city text,
  applicable_cities text[] not null default '{}'::text[],
  location_id text references public.partner_lab_locations(id) on delete set null,
  scopex_test_id uuid not null references public.tests(id) on delete restrict,
  partner_test_name text not null,
  partner_test_code text,
  category text,
  partner_processing_rate numeric(12,2) not null check (partner_processing_rate >= 0),
  sample_type text,
  tat_hours text,
  effective_from date not null,
  effective_to date,
  version integer not null default 1 check (version > 0),
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (effective_to is null or effective_to >= effective_from),
  check ((applicability <> 'single_city') or city is not null),
  check ((applicability <> 'selected_cities') or cardinality(applicable_cities) > 0)
);

create table if not exists public.partner_samples (
  id text primary key,
  booking_id uuid not null references public.bookings(id) on delete restrict,
  scopex_sample_id text not null,
  partner_barcode text,
  barcode_photo_url text,
  partner_lab_id text not null references public.partner_labs(id) on delete restrict,
  location_id text not null references public.partner_lab_locations(id) on delete restrict,
  patient_name text not null,
  patient_phone text not null,
  test_ids uuid[] not null default '{}'::uuid[],
  test_names text[] not null default '{}'::text[],
  rate_snapshot jsonb not null default '[]'::jsonb,
  total_processing_cost numeric(12,2) not null default 0 check (total_processing_cost >= 0),
  status text not null default 'Assigned to Partner Lab' check (status in ('Sample Collected','Assigned to Partner Lab','Ready for Handover','Dispatched','Received by Partner Lab','Processing','Completed','Report Pending','Report Uploaded','Exception / Rejected')),
  status_history jsonb not null default '[]'::jsonb,
  handover_confirmed_by text,
  handover_confirmed_at timestamptz,
  handover_gps jsonb,
  admin_verified boolean not null default false,
  admin_verified_by text,
  admin_verified_at timestamptz,
  exception_type text,
  exception_remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (scopex_sample_id)
);

create table if not exists public.partner_reports (
  id text primary key,
  sample_id text not null references public.partner_samples(id) on delete restrict,
  booking_id uuid not null references public.bookings(id) on delete restrict,
  partner_lab_id text not null references public.partner_labs(id) on delete restrict,
  report_type text not null check (report_type in ('individual','combined','revised')),
  current_file_url text not null,
  current_file_name text not null,
  status text not null default 'Awaiting Report' check (status in ('Awaiting Report','Report Uploaded','Pending Verification','Verified','Published to Patient')),
  version_history jsonb not null default '[]'::jsonb,
  verified_by text,
  verified_at timestamptz,
  published_at timestamptz,
  rejection_remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.partner_invoices (
  id text primary key,
  partner_lab_id text not null references public.partner_labs(id) on delete restrict,
  invoice_number text not null,
  invoice_date date not null,
  due_date date,
  related_booking_ids uuid[] not null default '{}'::uuid[],
  related_sample_ids text[] not null default '{}'::text[],
  invoice_amount numeric(12,2) not null check (invoice_amount >= 0),
  approved_amount numeric(12,2) not null default 0 check (approved_amount >= 0),
  rejected_amount numeric(12,2) not null default 0 check (rejected_amount >= 0),
  paid_amount numeric(12,2) not null default 0 check (paid_amount >= 0),
  status text not null default 'Pending' check (status in ('Pending','Under Review','Approved','Partially Approved','Partially Paid','Paid','Rejected','Disputed')),
  invoice_pdf_url text,
  remarks text,
  discrepancies jsonb not null default '[]'::jsonb,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (partner_lab_id, invoice_number)
);

create table if not exists public.partner_invoice_payments (
  id text primary key,
  invoice_id text not null references public.partner_invoices(id) on delete restrict,
  payment_amount numeric(12,2) not null check (payment_amount > 0),
  payment_date date not null,
  payment_mode text not null check (payment_mode in ('NEFT','RTGS','UPI','Cheque','Bank Transfer')),
  transaction_reference text not null,
  receipt_url text,
  remarks text,
  recorded_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.seo_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  canonical_path text not null unique,
  entity_kind text not null,
  content jsonb not null,
  status text not null default 'draft' check (status in ('draft','in_review','approved','published')),
  version integer not null default 1 check (version > 0),
  clinical_review jsonb,
  published_at timestamptz,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.seo_redirects (
  id uuid primary key default gen_random_uuid(),
  source_path text not null unique,
  destination_path text not null,
  status_code integer not null check (status_code in (301,302)),
  active boolean not null default true,
  hit_count bigint not null default 0 check (hit_count >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (source_path <> destination_path)
);

create table if not exists public.admin_role_permissions (
  role text not null check (role in ('super_admin','admin','manager','booking_manager','report_manager','finance_manager','customer_support','phlebotomist')),
  permission text not null,
  allowed boolean not null default false,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (role, permission)
);

create table if not exists public.admin_user_permission_overrides (
  user_id uuid not null references auth.users(id) on delete cascade,
  permission text not null,
  allowed boolean not null,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (user_id, permission)
);

-- Existing notification_logs is the source of truth for email delivery events.
alter table public.notification_logs
  add column if not exists subject text,
  add column if not exists event_type text;

-- Duplicate detection and initial activity are committed in the same transaction.
create or replace function public.create_or_merge_crm_lead(p_lead jsonb, p_performed_by text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone text := pg_catalog.regexp_replace(coalesce(p_lead->>'normalizedPhone', p_lead->>'phone', ''), '[^0-9]', '', 'g');
  v_existing public.leads%rowtype;
  v_created public.leads%rowtype;
  v_now timestamptz := pg_catalog.now();
begin
  if pg_catalog.length(v_phone) < 10 or pg_catalog.length(v_phone) > 15 then
    raise exception 'invalid_phone' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_phone, 0));

  select l.* into v_existing
  from public.leads as l
  where l.normalized_phone = v_phone
    and l.status not in ('Closed','Not Interested')
  order by l.created_at desc
  limit 1
  for update;

  if found then
    update public.leads as l
      set duplicate_count = l.duplicate_count + 1,
          interested_items = l.interested_items || coalesce(p_lead->'interestedItems', '[]'::jsonb),
          updated_at = v_now
      where l.id = v_existing.id
      returning l.* into v_existing;

    insert into public.lead_activities (lead_id, activity_type, title, notes, performed_by, metadata, created_at)
    values (
      v_existing.id, 'duplicate_detected', 'Repeat enquiry received',
      'A repeat enquiry was merged into the existing lead.', coalesce(nullif(p_performed_by, ''), 'System'),
      pg_catalog.jsonb_build_object('source', coalesce(p_lead->>'source', 'website'), 'campaign', p_lead->>'campaign'), v_now
    );
    return pg_catalog.jsonb_build_object('lead', pg_catalog.to_jsonb(v_existing), 'is_duplicate', true,
      'duplicate_message', 'Repeat enquiry merged into the existing open lead.');
  end if;

  insert into public.leads (
    name, phone, normalized_phone, mobile, mobile_number, email, location, address, city, pincode,
    interested_items, source, lead_type, campaign, utm_source, utm_medium, utm_campaign, consent,
    contact_preferences, assignment_mode, priority, notes, follow_up_date, status, is_duplicate, duplicate_count,
    created_at, updated_at, metadata
  ) values (
    pg_catalog.btrim(coalesce(p_lead->>'name', '')),
    pg_catalog.btrim(coalesce(p_lead->>'phone', '')),
    v_phone,
    pg_catalog.btrim(coalesce(p_lead->>'phone', '')),
    pg_catalog.btrim(coalesce(p_lead->>'phone', '')),
    nullif(pg_catalog.lower(pg_catalog.btrim(coalesce(p_lead->>'email', ''))), ''),
    nullif(pg_catalog.btrim(coalesce(p_lead->>'location', '')), ''),
    nullif(pg_catalog.btrim(coalesce(p_lead->>'location', '')), ''),
    nullif(pg_catalog.btrim(coalesce(p_lead->>'city', '')), ''),
    nullif(pg_catalog.btrim(coalesce(p_lead->>'pincode', '')), ''),
    coalesce(p_lead->'interestedItems', '[]'::jsonb),
    coalesce(nullif(p_lead->>'source', ''), 'website'),
    coalesce(nullif(p_lead->>'source', ''), 'website'),
    nullif(p_lead->>'campaign', ''), nullif(p_lead->>'utmSource', ''), nullif(p_lead->>'utmMedium', ''), nullif(p_lead->>'utmCampaign', ''),
    coalesce((p_lead->>'consent')::boolean, true),
    coalesce(p_lead->'contactPreferences', '{"phone":true,"whatsapp":true,"email":true}'::jsonb),
    'unassigned', coalesce(nullif(p_lead->>'priority', ''), 'Medium'),
    nullif(pg_catalog.btrim(coalesce(p_lead->>'notes', '')), ''),
    nullif(p_lead->>'followUpDate', '')::timestamptz,
    'New', false, 0, v_now, v_now, '{}'::jsonb
  ) returning * into v_created;

  insert into public.lead_activities (lead_id, activity_type, title, notes, performed_by, created_at)
  values (v_created.id, 'created', 'Lead captured',
    pg_catalog.format('Captured from %s', coalesce(v_created.source, 'website')),
    coalesce(nullif(p_performed_by, ''), 'System'), v_now);

  return pg_catalog.jsonb_build_object('lead', pg_catalog.to_jsonb(v_created), 'is_duplicate', false);
end;
$$;
revoke all on function public.create_or_merge_crm_lead(jsonb, text) from public, anon, authenticated;
grant execute on function public.create_or_merge_crm_lead(jsonb, text) to service_role;

create or replace function public.assign_crm_lead(
  p_lead_id uuid,
  p_member_id text,
  p_reason text,
  p_performed_by text,
  p_auto boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lead public.leads%rowtype;
  v_member public.crm_team_members%rowtype;
  v_old_member_id text;
  v_reason text;
begin
  select l.* into v_lead from public.leads as l where l.id = p_lead_id for update;
  if not found then raise exception 'lead_not_found' using errcode = 'P0002'; end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('crm-team-assignment', 0));

  if p_auto then
    select tm.* into v_member
    from public.crm_team_members as tm
    where tm.active = true and tm.status = 'available'
      and tm.current_workload < tm.max_daily_workload
      and (tm.city = v_lead.city or v_lead.pincode = any(tm.covered_pincodes))
    order by
      case when v_lead.pincode = any(tm.covered_pincodes) then 0 else 1 end,
      tm.current_workload::numeric / tm.max_daily_workload,
      tm.current_workload,
      tm.id
    limit 1 for update skip locked;
  else
    select tm.* into v_member from public.crm_team_members as tm
      where tm.id = p_member_id and tm.active = true and tm.status = 'available'
        and tm.current_workload < tm.max_daily_workload
      for update;
  end if;

  if not found then
    if not p_auto then raise exception 'crm_team_member_unavailable' using errcode = 'P0002'; end if;
    update public.leads as l
      set assigned_employee_id = null, assigned_employee_name = null, assigned_at = null,
          assignment_mode = 'unassigned', assignment_reason = coalesce(nullif(p_reason, ''), 'No available team member matches this lead.'),
          updated_at = pg_catalog.now()
      where l.id = p_lead_id returning l.* into v_lead;
    insert into public.lead_activities (lead_id, activity_type, title, notes, performed_by)
      values (p_lead_id, 'auto_assignment_failed', 'Lead left unassigned', v_lead.assignment_reason, coalesce(nullif(p_performed_by, ''), 'System'));
    return pg_catalog.jsonb_build_object('lead', pg_catalog.to_jsonb(v_lead), 'assigned', false);
  end if;

  v_old_member_id := v_lead.assigned_employee_id;
  if v_old_member_id is distinct from v_member.id then
    if v_old_member_id is not null then
      update public.crm_team_members set current_workload = greatest(0, current_workload - 1), updated_at = pg_catalog.now()
        where id = v_old_member_id;
    end if;
    update public.crm_team_members set current_workload = current_workload + 1, updated_at = pg_catalog.now()
      where id = v_member.id;
  end if;

  v_reason := coalesce(nullif(p_reason, ''), case when p_auto then 'Automatically assigned by workload and location.' else 'Assigned by administrator.' end);
  update public.leads as l
    set assigned_employee_id = v_member.id, assigned_employee_name = v_member.name,
        assigned_at = pg_catalog.now(), assignment_mode = case when p_auto then 'auto' else 'manual' end,
        assignment_reason = v_reason, updated_at = pg_catalog.now()
    where l.id = p_lead_id returning l.* into v_lead;

  insert into public.lead_activities (lead_id, activity_type, title, notes, performed_by)
    values (p_lead_id, case when v_old_member_id is null then 'assigned' else 'transferred' end,
      case when v_old_member_id is null then 'Lead assigned' else 'Lead transferred' end,
      pg_catalog.format('%s (%s)', v_member.name, v_reason), coalesce(nullif(p_performed_by, ''), 'System'));
  return pg_catalog.jsonb_build_object('lead', pg_catalog.to_jsonb(v_lead), 'assigned', true);
end;
$$;
revoke all on function public.assign_crm_lead(uuid, text, text, text, boolean) from public, anon, authenticated;
grant execute on function public.assign_crm_lead(uuid, text, text, text, boolean) to service_role;

-- Confirm/cancel a booking and create its operational interaction in one transaction.
create or replace function public.customer_care_update_booking(
  p_booking_id uuid,
  p_action text,
  p_notes text,
  p_performed_by text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings%rowtype;
  v_status public.booking_status;
begin
  if p_action = 'confirm' then
    v_status := 'CONFIRMED'::public.booking_status;
  elsif p_action = 'cancel' then
    v_status := 'CANCELLED'::public.booking_status;
  else
    raise exception 'unsupported_action' using errcode = '22023';
  end if;

  select b.* into v_booking from public.bookings as b where b.id = p_booking_id for update;
  if not found then raise exception 'booking_not_found' using errcode = 'P0002'; end if;
  if p_action = 'confirm' and v_booking.booking_status in ('CANCELLED','REFUNDED','COMPLETED') then
    raise exception 'booking_transition_not_allowed' using errcode = '22023';
  end if;
  if p_action = 'cancel' and v_booking.booking_status in ('CANCELLED','REFUNDED','COMPLETED') then
    raise exception 'booking_transition_not_allowed' using errcode = '22023';
  end if;

  update public.bookings as b
    set booking_status = v_status,
        phlebotomist_id = case when p_action = 'cancel' then null else b.phlebotomist_id end,
        cancellation_reason = case when p_action = 'cancel' then nullif(pg_catalog.btrim(p_notes), '') else b.cancellation_reason end,
        cancelled_at = case when p_action = 'cancel' then pg_catalog.now() else b.cancelled_at end,
        updated_at = pg_catalog.now()
    where b.id = p_booking_id
    returning b.* into v_booking;
  if not found then raise exception 'booking_not_found' using errcode = 'P0002'; end if;

  insert into public.customer_care_interactions (
    target_id, target_kind, interaction_kind, channel, outcome, notes, performed_by, metadata
  ) values (
    p_booking_id::text, 'booking', 'note', 'internal', p_action,
    nullif(pg_catalog.left(pg_catalog.btrim(coalesce(p_notes, '')), 4000), ''),
    coalesce(nullif(pg_catalog.btrim(p_performed_by), ''), 'Customer Care'),
    pg_catalog.jsonb_build_object('bookingStatus', v_status::text)
  );

  return pg_catalog.to_jsonb(v_booking);
end;
$$;
revoke all on function public.customer_care_update_booking(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.customer_care_update_booking(uuid, text, text, text) to service_role;

-- Keep package data and its test links in one transaction.
create or replace function public.admin_upsert_fixed_package(p_package jsonb, p_test_ids uuid[] default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_package public.packages%rowtype;
  v_schema jsonb;
begin
  if pg_catalog.length(pg_catalog.btrim(coalesce(p_package->>'name', ''))) = 0 then
    raise exception 'package_name_required' using errcode = '22023';
  end if;
  if coalesce((p_package->>'sellingPrice')::numeric, (p_package->>'price')::numeric, -1) < 0 then
    raise exception 'package_price_invalid' using errcode = '22023';
  end if;

  v_schema := coalesce(p_package->'schema_json', '{}'::jsonb) || pg_catalog.jsonb_build_object(
    'section', p_package->'section', 'badge', p_package->'badge', 'packageType', 'fixed',
    'allowExtraDiscount', coalesce((p_package->>'allowExtraDiscount')::boolean, false),
    'discount', p_package->'discount', 'savings', p_package->'savings', 'overview', p_package->'overview',
    'testIds', coalesce(p_package->'testIds', '[]'::jsonb), 'whyPackage', p_package->'whyPackage', 'bestFor', p_package->'bestFor'
  );

  if nullif(p_package->>'id', '') is not null then
    v_id := (p_package->>'id')::uuid;
    update public.packages as p
      set slug = coalesce(nullif(p_package->>'slug', ''), p.slug),
          name = p_package->>'name', description = nullif(p_package->>'tagline', ''),
          regular_price = coalesce((p_package->>'mrp')::numeric, p.regular_price),
          selling_price = coalesce((p_package->>'price')::numeric, p.selling_price),
          real_price = coalesce((p_package->>'price')::numeric, p.real_price),
          featured = coalesce((p_package->>'featured')::boolean, p.featured),
          active = coalesce((p_package->>'active')::boolean, p.active),
          schema_json = v_schema,
          updated_at = pg_catalog.now()
      where p.id = v_id returning p.* into v_package;
    if not found then raise exception 'package_not_found' using errcode = 'P0002'; end if;
  else
    insert into public.packages (slug, name, description, regular_price, selling_price, real_price, featured, active, schema_json)
    values (
      coalesce(nullif(p_package->>'slug', ''), pg_catalog.trim(both '-' from pg_catalog.regexp_replace(pg_catalog.lower(p_package->>'name'), '[^a-z0-9]+', '-', 'g'))),
      pg_catalog.btrim(p_package->>'name'), nullif(p_package->>'tagline', ''),
      coalesce((p_package->>'mrp')::numeric, (p_package->>'price')::numeric),
      (p_package->>'price')::numeric, (p_package->>'price')::numeric,
      coalesce((p_package->>'featured')::boolean, false), coalesce((p_package->>'active')::boolean, true), v_schema
    ) returning * into v_package;
    v_id := v_package.id;
  end if;

  if p_test_ids is not null then
    delete from public.package_tests where package_id = v_id;
    insert into public.package_tests (package_id, test_id)
      select v_id, t.test_id from pg_catalog.unnest(p_test_ids) as t(test_id)
      on conflict (package_id, test_id) do nothing;
  end if;

  return pg_catalog.to_jsonb(v_package);
end;
$$;
revoke all on function public.admin_upsert_fixed_package(jsonb, uuid[]) from public, anon, authenticated;
grant execute on function public.admin_upsert_fixed_package(jsonb, uuid[]) to service_role;

create or replace function public.admin_bulk_set_test_prices(p_prices jsonb)
returns setof public.tests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_price jsonb;
  v_test public.tests%rowtype;
begin
  if pg_catalog.jsonb_typeof(p_prices) <> 'array' or pg_catalog.jsonb_array_length(p_prices) = 0 then
    raise exception 'test_prices_required' using errcode = '22023';
  end if;
  for v_price in select value from pg_catalog.jsonb_array_elements(p_prices)
  loop
    if nullif(v_price->>'id', '') is null or nullif(v_price->>'price', '') is null or nullif(v_price->>'mrp', '') is null
      or (v_price->>'price')::numeric < 0 or (v_price->>'mrp')::numeric < 0 then
      raise exception 'test_price_invalid' using errcode = '22023';
    end if;
    update public.tests as t
      set real_price = (v_price->>'price')::numeric,
          discounted_price = (v_price->>'price')::numeric,
          price = (v_price->>'mrp')::numeric,
          updated_at = pg_catalog.now()
      where t.id = (v_price->>'id')::uuid
      returning t.* into v_test;
    if not found then raise exception 'test_not_found' using errcode = 'P0002'; end if;
    return next v_test;
  end loop;
  return;
end;
$$;
revoke all on function public.admin_bulk_set_test_prices(jsonb) from public, anon, authenticated;
grant execute on function public.admin_bulk_set_test_prices(jsonb) to service_role;

create index if not exists collection_jobs_staff_status_idx on public.collection_jobs(phlebotomist_id, status, updated_at desc);
create index if not exists customer_care_target_idx on public.customer_care_interactions(target_kind, target_id, created_at desc);
create index if not exists partner_locations_lab_city_idx on public.partner_lab_locations(partner_lab_id, city, status);
create index if not exists partner_mapping_test_status_idx on public.partner_test_mappings(scopex_test_id, status, effective_from desc);
create index if not exists partner_samples_booking_idx on public.partner_samples(booking_id, created_at desc);
create index if not exists partner_reports_booking_idx on public.partner_reports(booking_id, created_at desc);
create index if not exists partner_invoices_lab_status_idx on public.partner_invoices(partner_lab_id, status, invoice_date desc);
create index if not exists seo_pages_status_idx on public.seo_pages(status, updated_at desc);
create index if not exists seo_redirects_active_idx on public.seo_redirects(active, source_path);
create index if not exists audit_logs_created_idx on public.audit_logs(created_at desc);
create index if not exists login_logs_user_created_idx on public.login_logs(user_id, created_at desc);
create index if not exists partner_mappings_lab_status_idx on public.partner_test_mappings(partner_lab_id, status, effective_from desc);
create index if not exists partner_mappings_location_idx on public.partner_test_mappings(location_id) where location_id is not null;
create index if not exists partner_samples_lab_location_idx on public.partner_samples(partner_lab_id, location_id, created_at desc);
create index if not exists partner_reports_lab_idx on public.partner_reports(partner_lab_id, created_at desc);
create index if not exists partner_reports_sample_idx on public.partner_reports(sample_id, created_at desc);
create index if not exists partner_payments_invoice_idx on public.partner_invoice_payments(invoice_id, created_at desc);

alter table public.collection_jobs enable row level security;
alter table public.customer_care_interactions enable row level security;
alter table public.partner_labs enable row level security;
alter table public.partner_lab_locations enable row level security;
alter table public.partner_test_mappings enable row level security;
alter table public.partner_samples enable row level security;
alter table public.partner_reports enable row level security;
alter table public.partner_invoices enable row level security;
alter table public.partner_invoice_payments enable row level security;
alter table public.seo_pages enable row level security;
alter table public.seo_redirects enable row level security;
alter table public.admin_role_permissions enable row level security;
alter table public.admin_user_permission_overrides enable row level security;

alter table public.collection_jobs force row level security;
alter table public.customer_care_interactions force row level security;
alter table public.partner_labs force row level security;
alter table public.partner_lab_locations force row level security;
alter table public.partner_test_mappings force row level security;
alter table public.partner_samples force row level security;
alter table public.partner_reports force row level security;
alter table public.partner_invoices force row level security;
alter table public.partner_invoice_payments force row level security;
alter table public.seo_pages force row level security;
alter table public.seo_redirects force row level security;
alter table public.admin_role_permissions force row level security;
alter table public.admin_user_permission_overrides force row level security;

revoke all on public.collection_jobs, public.customer_care_interactions, public.partner_labs,
  public.partner_lab_locations, public.partner_test_mappings, public.partner_samples,
  public.partner_reports, public.partner_invoices, public.partner_invoice_payments,
  public.seo_pages, public.seo_redirects, public.admin_role_permissions,
  public.admin_user_permission_overrides from anon, authenticated;
grant all on public.collection_jobs, public.customer_care_interactions, public.partner_labs,
  public.partner_lab_locations, public.partner_test_mappings, public.partner_samples,
  public.partner_reports, public.partner_invoices, public.partner_invoice_payments,
  public.seo_pages, public.seo_redirects, public.admin_role_permissions,
  public.admin_user_permission_overrides to service_role;

revoke all on public.phlebotomists, public.crm_team_members, public.lead_activities,
  public.audit_logs, public.login_logs from anon, authenticated;
grant all on public.phlebotomists, public.crm_team_members, public.lead_activities,
  public.audit_logs, public.login_logs to service_role;

-- No policies are added to these operational tables: browser roles remain denied.
-- Admin access must pass the server's verified app-JWT role guard before service-role use.
