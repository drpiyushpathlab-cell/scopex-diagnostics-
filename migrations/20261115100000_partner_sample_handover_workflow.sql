-- Additive partner handover workflow. Review and apply in a non-production
-- Supabase project first. This migration does not update existing records.

alter table public.phlebotomists
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null,
  add column if not exists verification_status text not null default 'pending_verification'
    check (verification_status in ('pending_verification','active','inactive','suspended','rejected'));

create unique index if not exists phlebotomists_auth_user_id_uidx
  on public.phlebotomists(auth_user_id) where auth_user_id is not null;

do $$ begin
  if not exists (select 1 from pg_catalog.pg_constraint where conname = 'partner_lab_locations_lab_id_id_key'
                 and conrelid = 'public.partner_lab_locations'::regclass) then
    alter table public.partner_lab_locations
      add constraint partner_lab_locations_lab_id_id_key unique (partner_lab_id, id);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_catalog.pg_constraint where conname = 'partner_samples_partner_location_fk'
                 and conrelid = 'public.partner_samples'::regclass) then
    alter table public.partner_samples
      add constraint partner_samples_partner_location_fk
      foreign key (partner_lab_id, location_id)
      references public.partner_lab_locations(partner_lab_id, id)
      on delete restrict not valid;
  end if;
end $$;

alter table public.collection_jobs
  add column if not exists partner_lab_id text references public.partner_labs(id) on delete restrict,
  add column if not exists partner_location_id text,
  add column if not exists scheduled_at timestamptz,
  add column if not exists assignment_status text not null default 'Pending Acceptance'
    check (assignment_status in ('Pending Acceptance','Accepted','Rejected','Expired','Reassigned'));

do $$ begin
  if not exists (select 1 from pg_catalog.pg_constraint where conname = 'collection_jobs_partner_location_fk'
                 and conrelid = 'public.collection_jobs'::regclass) then
    alter table public.collection_jobs
      add constraint collection_jobs_partner_location_fk
        foreign key (partner_lab_id, partner_location_id)
        references public.partner_lab_locations(partner_lab_id, id) on delete restrict;
  end if;
end $$;

alter table public.partner_samples
  add column if not exists test_id uuid references public.tests(id) on delete restrict,
  add column if not exists sample_type text,
  add column if not exists partner_accession_number text,
  add column if not exists handover_status text not null default 'Awaiting Collection'
    check (handover_status in (
      'Awaiting Collection','Sample Collected','Handover Pending','Handover Submitted',
      'Pending Admin Verification','Verified by Admin','Barcode / Accession ID Entered',
      'Received by Partner Lab','Handover Exception'
    )),
  add column if not exists handover_status_history jsonb not null default '[]'::jsonb,
  add column if not exists collection_at timestamptz,
  add column if not exists handover_submitted_at timestamptz,
  add column if not exists handover_submitted_by uuid references auth.users(id) on delete set null,
  add column if not exists handover_remarks text,
  add column if not exists identifier_entered_by uuid references auth.users(id) on delete set null,
  add column if not exists identifier_entered_at timestamptz,
  add column if not exists verification_remarks text;

create sequence if not exists public.scopex_sample_id_seq;

-- Existing rows are intentionally left in their current lifecycle state; the
-- new workflow status defaults to Awaiting Collection and is advanced explicitly.
create table if not exists public.partner_sample_handover_photos (
  id uuid primary key default gen_random_uuid(),
  sample_record_id text not null references public.partner_samples(id) on delete restrict,
  storage_path text not null,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  uploaded_at timestamptz not null default now(),
  unique (sample_record_id, storage_path)
);

insert into storage.buckets(id, name, public)
values ('partner-sample-handover', 'partner-sample-handover', false)
on conflict (id) do nothing;

create table if not exists public.partner_sample_identifier_audit (
  id uuid primary key default gen_random_uuid(),
  sample_record_id text not null references public.partner_samples(id) on delete restrict,
  old_partner_barcode text,
  new_partner_barcode text,
  old_accession_number text,
  new_accession_number text,
  actor_id uuid not null references auth.users(id) on delete restrict,
  remarks text,
  created_at timestamptz not null default now()
);

create table if not exists public.partner_sample_assignment_audit (
  id uuid primary key default gen_random_uuid(),
  sample_record_id text not null references public.partner_samples(id) on delete restrict,
  old_partner_lab_id text not null references public.partner_labs(id) on delete restrict,
  old_location_id text not null references public.partner_lab_locations(id) on delete restrict,
  new_partner_lab_id text not null references public.partner_labs(id) on delete restrict,
  new_location_id text not null references public.partner_lab_locations(id) on delete restrict,
  actor_id uuid not null references auth.users(id) on delete restrict,
  remarks text,
  created_at timestamptz not null default now()
);

create index if not exists partner_samples_handover_queue_idx
  on public.partner_samples(handover_status, partner_lab_id, location_id, created_at desc);
create index if not exists partner_samples_scopex_search_idx
  on public.partner_samples(scopex_sample_id);
create unique index if not exists partner_samples_partner_barcode_scope_uidx
  on public.partner_samples(partner_lab_id, location_id, lower(partner_barcode))
  where partner_barcode is not null;
create unique index if not exists partner_samples_partner_accession_scope_uidx
  on public.partner_samples(partner_lab_id, location_id, lower(partner_accession_number))
  where partner_accession_number is not null;
create index if not exists partner_sample_identifier_audit_history_idx
  on public.partner_sample_identifier_audit(sample_record_id, created_at desc);

-- Atomic booking, phlebotomist, lab and location assignment. Active test/rate
-- mappings are checked for every individually booked test before any write.
create or replace function public.assign_booking_collection_workflow(
  p_booking_id uuid,
  p_phlebotomist_id uuid,
  p_partner_lab_id text,
  p_partner_location_id text,
  p_scheduled_at timestamptz,
  p_actor_id uuid,
  p_remarks text default null
)
returns public.collection_jobs
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings%rowtype;
  v_phleb public.phlebotomists%rowtype;
  v_lab public.partner_labs%rowtype;
  v_loc public.partner_lab_locations%rowtype;
  v_job public.collection_jobs%rowtype;
  v_test record;
  v_mapping public.partner_test_mappings%rowtype;
  v_sample_id text;
  v_sample_record_id text;
  v_test_count integer := 0;
  v_assigned_today integer;
  v_existing_job boolean := false;
  v_existing_sample public.partner_samples%rowtype;
  v_old_phlebotomist_id uuid;
  v_old_assignment_status text;
begin
  select b.* into v_booking from public.bookings b where b.id = p_booking_id for update;
  if not found then raise exception 'booking_not_found' using errcode = 'P0002'; end if;
  if v_booking.booking_status in ('CANCELLED','REFUNDED','COMPLETED') then
    raise exception 'booking_not_assignable' using errcode = '22023';
  end if;
  select p.* into v_phleb from public.phlebotomists p
    where p.id = p_phlebotomist_id for update;
  if not found or not v_phleb.active or v_phleb.verification_status <> 'active'
     or v_phleb.status not in ('available','on_duty') then
    raise exception 'phlebotomist_not_active_and_available' using errcode = '22023';
  end if;
  select count(*) into v_assigned_today from public.collection_jobs cj
   where cj.phlebotomist_id = p_phlebotomist_id and cj.scheduled_at::date = p_scheduled_at::date
     and cj.status not in ('Completed','Exception');
  if v_assigned_today >= v_phleb.max_daily_slots then
    raise exception 'phlebotomist_daily_capacity_reached' using errcode = '22023';
  end if;
  select l.* into v_lab from public.partner_labs l
    where l.id = p_partner_lab_id and l.status = 'active';
  if not found then raise exception 'partner_lab_not_active' using errcode = '22023'; end if;
  select loc.* into v_loc from public.partner_lab_locations loc
    where loc.id = p_partner_location_id and loc.partner_lab_id = p_partner_lab_id and loc.status = 'active';
  if not found then raise exception 'partner_location_not_active_or_mismatched' using errcode = '22023'; end if;

  -- Refuse duplicate active assignment. Existing completed/exception jobs are
  -- historical and are not overwritten by this operation.
  if exists (select 1 from public.collection_jobs cj where cj.booking_id = p_booking_id
             and cj.status not in ('Completed','Exception')) then
    raise exception 'active_booking_assignment_exists' using errcode = '23505';
  end if;
  select cj.* into v_job from public.collection_jobs cj where cj.booking_id = p_booking_id for update;
  v_existing_job := found;
  if v_existing_job then
    v_old_phlebotomist_id := v_job.phlebotomist_id;
    v_old_assignment_status := v_job.assignment_status;
  end if;

  for v_test in
    select distinct t.id as test_id, t.name as test_name, coalesce(t.sample_type, 'Unknown') as sample_type
      from public.booking_items bi join public.tests t on t.id = bi.test_id
     where bi.booking_id = p_booking_id and bi.test_id is not null
    union
    select distinct t.id, t.name, coalesce(t.sample_type, 'Unknown')
      from public.booking_items bi
      join public.packages p on p.id = bi.package_id
      cross join lateral pg_catalog.jsonb_array_elements_text(coalesce(p.schema_json->'testIds','[]'::jsonb)) x(test_id)
      join public.tests t on t.id = x.test_id::uuid
     where bi.booking_id = p_booking_id and bi.package_id is not null
  loop
    v_test_count := v_test_count + 1;
    select m.* into v_mapping
      from public.partner_test_mappings m
     where m.partner_lab_id = p_partner_lab_id
       and m.scopex_test_id = v_test.test_id
       and m.status = 'active'
       and m.effective_from <= current_date
       and (m.effective_to is null or m.effective_to >= current_date)
       and (m.location_id = p_partner_location_id
            or (m.location_id is null and (
              m.applicability = 'pan_india'
              or (m.applicability = 'single_city' and lower(m.city) = lower(v_loc.city))
              or (m.applicability = 'selected_cities' and exists (
                select 1 from unnest(m.applicable_cities) c where lower(c) = lower(v_loc.city)
              ))
            )))
     order by case when m.location_id = p_partner_location_id then 0
                   when m.applicability = 'single_city' then 1
                   when m.applicability = 'selected_cities' then 2 else 3 end,
              m.effective_from desc, m.version desc
     limit 1;
    if not found then
      raise exception 'partner_test_mapping_or_rate_missing:%', v_test.test_id using errcode = '22023';
    end if;
  end loop;
  if v_test_count = 0 then raise exception 'booking_has_no_resolvable_tests' using errcode = '22023'; end if;

  if v_existing_job then
    if exists (select 1 from public.partner_samples ps where ps.booking_id = p_booking_id
               and ps.handover_status <> 'Awaiting Collection') then
      raise exception 'cannot_reassign_after_sample_collection' using errcode = '22023';
    end if;
    update public.collection_jobs set
      phlebotomist_id = p_phlebotomist_id, partner_lab_id = p_partner_lab_id,
      partner_location_id = p_partner_location_id, scheduled_at = p_scheduled_at,
      status = 'Assigned', assignment_status = 'Pending Acceptance', exception_queue = false,
      accepted_at = null, en_route_at = null, arrived_at = null, collected_at = null,
      exception_at = null, exception_reason = null, decline_reason = null,
      updated_by = p_actor_id::text, updated_at = pg_catalog.now(),
      status_history = status_history || pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object(
        'status','Assigned','timestamp',pg_catalog.now(),'performedBy',p_actor_id,
        'notes',nullif(pg_catalog.left(pg_catalog.btrim(coalesce(p_remarks,'')),2000),'')))
    where id = v_job.id returning * into v_job;
  else
    insert into public.collection_jobs(
      booking_id, phlebotomist_id, status, status_history, allocation_mode,
      updated_by, partner_lab_id, partner_location_id, scheduled_at, assignment_status
    ) values (
      p_booking_id, p_phlebotomist_id, 'Assigned',
      pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object(
        'status','Assigned','timestamp',pg_catalog.now(),'performedBy',p_actor_id,
        'notes',nullif(pg_catalog.left(pg_catalog.btrim(coalesce(p_remarks,'')),2000),''))),
      'manual', p_actor_id::text, p_partner_lab_id, p_partner_location_id,
      p_scheduled_at, 'Pending Acceptance'
    ) returning * into v_job;
  end if;

  update public.bookings set phlebotomist_id = p_phlebotomist_id,
    phlebotomist_assigned_at = pg_catalog.now(), booking_status = 'ASSIGNED', updated_at = pg_catalog.now()
   where id = p_booking_id;
  if not v_existing_job or v_old_phlebotomist_id <> p_phlebotomist_id or v_old_assignment_status = 'Rejected' then
    update public.phlebotomists set assigned_count = assigned_count + 1, updated_at = pg_catalog.now()
     where id = p_phlebotomist_id;
  end if;
  if v_existing_job and v_old_assignment_status <> 'Rejected' then
    update public.phlebotomists set assigned_count = greatest(assigned_count - 1, 0), updated_at = pg_catalog.now()
     where id = v_old_phlebotomist_id
       and id <> p_phlebotomist_id;
  end if;

  for v_test in
    select distinct t.id as test_id, t.name as test_name, coalesce(t.sample_type, 'Unknown') as sample_type
      from public.booking_items bi join public.tests t on t.id = bi.test_id
     where bi.booking_id = p_booking_id and bi.test_id is not null
    union
    select distinct t.id, t.name, coalesce(t.sample_type, 'Unknown')
      from public.booking_items bi
      join public.packages p on p.id = bi.package_id
      cross join lateral pg_catalog.jsonb_array_elements_text(coalesce(p.schema_json->'testIds','[]'::jsonb)) x(test_id)
      join public.tests t on t.id = x.test_id::uuid
     where bi.booking_id = p_booking_id and bi.package_id is not null
  loop
    select m.* into v_mapping
      from public.partner_test_mappings m
     where m.partner_lab_id = p_partner_lab_id and m.scopex_test_id = v_test.test_id
       and m.status = 'active' and m.effective_from <= current_date
       and (m.effective_to is null or m.effective_to >= current_date)
       and (m.location_id = p_partner_location_id or (m.location_id is null and (
         m.applicability = 'pan_india'
         or (m.applicability = 'single_city' and lower(m.city) = lower(v_loc.city))
         or (m.applicability = 'selected_cities' and exists (
           select 1 from unnest(m.applicable_cities) c where lower(c) = lower(v_loc.city)
         ))
       )))
     order by case when m.location_id = p_partner_location_id then 0
                   when m.applicability = 'single_city' then 1
                   when m.applicability = 'selected_cities' then 2 else 3 end,
              m.effective_from desc, m.version desc limit 1;
    v_sample_id := 'SMP-' || pg_catalog.to_char(pg_catalog.now() at time zone 'UTC','YYYYMMDD') || '-' ||
                   pg_catalog.lpad(pg_catalog.nextval('public.scopex_sample_id_seq')::text, 8, '0');
    v_sample_record_id := 'PSMP-' || p_booking_id::text || '-' || v_sample_id;
    select ps.* into v_existing_sample from public.partner_samples ps
     where ps.booking_id = p_booking_id and ps.test_id = v_test.test_id limit 1 for update;
    if found then
      insert into public.partner_sample_assignment_audit(
        sample_record_id,old_partner_lab_id,old_location_id,new_partner_lab_id,new_location_id,actor_id,remarks
      ) values (v_existing_sample.id,v_existing_sample.partner_lab_id,v_existing_sample.location_id,
                p_partner_lab_id,p_partner_location_id,p_actor_id,
                nullif(pg_catalog.left(pg_catalog.btrim(coalesce(p_remarks,'')),2000),''));
      update public.partner_samples set partner_lab_id = p_partner_lab_id, location_id = p_partner_location_id,
        sample_type = coalesce(v_mapping.sample_type,v_test.sample_type),
        rate_snapshot = pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object(
          'testId',v_test.test_id,'testName',v_test.test_name,
          'processingRate',v_mapping.partner_processing_rate,'mappingVersion',v_mapping.version)),
        total_processing_cost = v_mapping.partner_processing_rate, updated_at = pg_catalog.now()
       where id = v_existing_sample.id;
    else
      insert into public.partner_samples(
        id, booking_id, scopex_sample_id, partner_lab_id, location_id,
        patient_name, patient_phone, test_id, sample_type, test_ids, test_names,
        rate_snapshot, total_processing_cost, status, handover_status
      ) values (
        v_sample_record_id, p_booking_id, v_sample_id, p_partner_lab_id, p_partner_location_id,
        coalesce((select p.name from public.patients p where p.id = v_booking.patient_id), ''),
        coalesce((select p.mobile from public.patients p where p.id = v_booking.patient_id), ''),
        v_test.test_id, coalesce(v_mapping.sample_type, v_test.sample_type), array[v_test.test_id], array[v_test.test_name],
        pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object(
          'testId',v_test.test_id,'testName',v_test.test_name,
          'processingRate',v_mapping.partner_processing_rate,'mappingVersion',v_mapping.version
        )), v_mapping.partner_processing_rate, 'Assigned to Partner Lab', 'Awaiting Collection'
      );
    end if;
  end loop;
  return v_job;
end;
$$;

create or replace function public.update_phlebotomist_collection_job(
  p_job_id uuid,
  p_actor_id uuid,
  p_action text,
  p_notes text default null,
  p_exception_reason text default null,
  p_temperature_verified boolean default null,
  p_fasting_verified boolean default null,
  p_fasting_hours integer default null
)
returns public.collection_jobs
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job public.collection_jobs%rowtype;
  v_phleb_id uuid;
  v_status text;
  v_assignment_status text;
  v_now timestamptz := pg_catalog.now();
begin
  select p.id into v_phleb_id from public.phlebotomists p
   where p.auth_user_id = p_actor_id and p.active and p.verification_status = 'active';
  if v_phleb_id is null then raise exception 'phlebotomist_identity_not_active' using errcode = '42501'; end if;
  select cj.* into v_job from public.collection_jobs cj where cj.id = p_job_id for update;
  if not found or v_job.phlebotomist_id <> v_phleb_id then
    raise exception 'collection_job_not_assigned_to_actor' using errcode = '42501';
  end if;

  if p_action = 'accept' then
    if v_job.status <> 'Assigned' or v_job.assignment_status <> 'Pending Acceptance' then
      raise exception 'assignment_no_longer_available' using errcode = '22023';
    end if;
    v_status := 'Accepted'; v_assignment_status := 'Accepted';
  elsif p_action = 'decline' then
    if v_job.status <> 'Assigned' or v_job.assignment_status <> 'Pending Acceptance' then
      raise exception 'assignment_no_longer_available' using errcode = '22023';
    end if;
    v_status := 'Exception'; v_assignment_status := 'Rejected';
  elsif p_action = 'en_route' and v_job.status = 'Accepted' then
    v_status := 'En Route'; v_assignment_status := v_job.assignment_status;
  elsif p_action = 'arrived' and v_job.status = 'En Route' then
    v_status := 'Arrived'; v_assignment_status := v_job.assignment_status;
  elsif p_action = 'collected' and v_job.status = 'Arrived' then
    v_status := 'Collected'; v_assignment_status := v_job.assignment_status;
  elsif p_action = 'exception' then
    v_status := 'Exception'; v_assignment_status := v_job.assignment_status;
  else
    raise exception 'invalid_collection_transition' using errcode = '22023';
  end if;

  update public.collection_jobs set
    status = v_status,
    assignment_status = v_assignment_status,
    status_history = status_history || pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object(
      'status',v_status,'timestamp',v_now,'performedBy',p_actor_id,'notes',
      nullif(pg_catalog.left(pg_catalog.btrim(coalesce(p_exception_reason,p_notes,'')),2000),''))),
    accepted_at = case when p_action = 'accept' then v_now else accepted_at end,
    en_route_at = case when p_action = 'en_route' then v_now else en_route_at end,
    arrived_at = case when p_action = 'arrived' then v_now else arrived_at end,
    collected_at = case when p_action = 'collected' then v_now else collected_at end,
    exception_at = case when v_status = 'Exception' then v_now else exception_at end,
    decline_reason = case when p_action = 'decline' then nullif(pg_catalog.left(pg_catalog.btrim(coalesce(p_exception_reason,'')),1000),'') else decline_reason end,
    exception_reason = case when v_status = 'Exception' then nullif(pg_catalog.left(pg_catalog.btrim(coalesce(p_exception_reason,'')),1000),'') else exception_reason end,
    collection_notes = case when p_action = 'collected' then nullif(pg_catalog.left(pg_catalog.btrim(coalesce(p_notes,'')),2000),'') else collection_notes end,
    temperature_verified = case when p_action = 'collected' then p_temperature_verified else temperature_verified end,
    fasting_status_verified = case when p_action = 'collected' then p_fasting_verified else fasting_status_verified end,
    fasting_hours_reported = case when p_action = 'collected' then p_fasting_hours else fasting_hours_reported end,
    exception_queue = v_status = 'Exception', updated_by = p_actor_id::text, updated_at = v_now
  where id = p_job_id returning * into v_job;

  update public.bookings set
    booking_status = case when v_status = 'Collected' then 'SAMPLE_COLLECTED'::public.booking_status
                          when v_status = 'En Route' then 'COLLECTION_STARTED'::public.booking_status
                          when p_action = 'decline' then 'CONFIRMED'::public.booking_status
                          else booking_status end,
    phlebotomist_id = case when p_action = 'decline' then null else phlebotomist_id end,
    sample_collected_at = case when v_status = 'Collected' then v_now else sample_collected_at end,
    updated_at = v_now
  where id = v_job.booking_id;
  if p_action = 'decline' then
    update public.phlebotomists set assigned_count = greatest(assigned_count - 1, 0), updated_at = v_now
     where id = v_phleb_id;
  end if;
  if p_action = 'collected' then
    update public.partner_samples set handover_status = 'Sample Collected',
      collection_at = v_now, updated_at = v_now,
      handover_status_history = handover_status_history || pg_catalog.jsonb_build_array(
        pg_catalog.jsonb_build_object('status','Sample Collected','actorId',p_actor_id,'at',v_now))
    where booking_id = v_job.booking_id;
  end if;
  return v_job;
end;
$$;

alter table public.partner_sample_handover_photos enable row level security;
alter table public.partner_sample_handover_photos force row level security;
alter table public.partner_sample_identifier_audit enable row level security;
alter table public.partner_sample_identifier_audit force row level security;
alter table public.partner_sample_assignment_audit enable row level security;
alter table public.partner_sample_assignment_audit force row level security;

revoke all on public.partner_sample_handover_photos, public.partner_sample_identifier_audit,
  public.partner_sample_assignment_audit
  from anon, authenticated;
grant all on public.partner_sample_handover_photos, public.partner_sample_identifier_audit,
  public.partner_sample_assignment_audit
  to service_role;

-- Workflow writes use server-side service-role RPC calls only after the app JWT
-- role and ownership have been checked in the API route. No browser policies are added.
create or replace function public.submit_partner_sample_handover(
  p_sample_record_id text,
  p_actor_id uuid,
  p_remarks text default null,
  p_photo_paths text[] default '{}'::text[]
)
returns public.partner_samples
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sample public.partner_samples%rowtype;
  v_actor_phleb uuid;
  v_path text;
begin
  select ps.* into v_sample
    from public.partner_samples ps
   where ps.id = p_sample_record_id
   for update;
  if not found then raise exception 'sample_not_found' using errcode = 'P0002'; end if;
  if v_sample.handover_status not in ('Sample Collected','Handover Pending','Handover Exception') then
    raise exception 'handover_already_submitted_or_not_collected' using errcode = '22023';
  end if;
  if coalesce(array_length(p_photo_paths, 1), 0) = 0 then
    raise exception 'handover_photos_required' using errcode = '22023';
  end if;
  select p.id into v_actor_phleb
    from public.phlebotomists p
    join public.collection_jobs cj on cj.phlebotomist_id = p.id
   where p.auth_user_id = p_actor_id
     and p.active and p.verification_status = 'active'
     and cj.booking_id = v_sample.booking_id
     and cj.partner_lab_id = v_sample.partner_lab_id
     and cj.partner_location_id = v_sample.location_id
     and cj.status in ('Collected','Completed')
   limit 1;
  if v_actor_phleb is null then raise exception 'assigned_phlebotomist_required' using errcode = '42501'; end if;

  update public.partner_samples
     set handover_status = 'Pending Admin Verification',
         handover_submitted_by = p_actor_id,
         handover_submitted_at = pg_catalog.now(),
         handover_remarks = nullif(pg_catalog.left(pg_catalog.btrim(coalesce(p_remarks,'')), 2000),''),
         handover_status_history = handover_status_history || pg_catalog.jsonb_build_array(
           pg_catalog.jsonb_build_object('status','Handover Submitted','actorId',p_actor_id,'at',pg_catalog.now()),
           pg_catalog.jsonb_build_object('status','Pending Admin Verification','actorId',p_actor_id,'at',pg_catalog.now())),
         updated_at = pg_catalog.now()
   where id = p_sample_record_id
   returning * into v_sample;

  foreach v_path in array p_photo_paths loop
    insert into public.partner_sample_handover_photos(sample_record_id, storage_path, uploaded_by)
    values (p_sample_record_id, v_path, p_actor_id)
    on conflict (sample_record_id, storage_path) do nothing;
  end loop;
  return v_sample;
end;
$$;

create or replace function public.set_partner_sample_identifiers(
  p_sample_record_id text,
  p_actor_id uuid,
  p_partner_barcode text default null,
  p_accession_number text default null,
  p_verify boolean default false,
  p_remarks text default null
)
returns public.partner_samples
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sample public.partner_samples%rowtype;
  v_barcode text := nullif(pg_catalog.btrim(coalesce(p_partner_barcode,'')), '');
  v_accession text := nullif(pg_catalog.btrim(coalesce(p_accession_number,'')), '');
begin
  select ps.* into v_sample from public.partner_samples ps
   where ps.id = p_sample_record_id for update;
  if not found then raise exception 'sample_not_found' using errcode = 'P0002'; end if;
  if v_sample.handover_status not in ('Pending Admin Verification','Handover Exception','Verified by Admin','Barcode / Accession ID Entered') then
    raise exception 'handover_not_submitted' using errcode = '22023';
  end if;
  if v_barcode is null and v_accession is null then
    if p_verify then raise exception 'partner_identifier_required_for_verification' using errcode = '22023'; end if;
    update public.partner_samples set
      handover_status = case when handover_status = 'Handover Exception' then handover_status else 'Pending Admin Verification' end,
      verification_remarks = nullif(pg_catalog.left(pg_catalog.btrim(coalesce(p_remarks,'')),2000),''),
      updated_at = pg_catalog.now()
    where id = p_sample_record_id returning * into v_sample;
    return v_sample;
  end if;

  insert into public.partner_sample_identifier_audit(
    sample_record_id, old_partner_barcode, new_partner_barcode,
    old_accession_number, new_accession_number, actor_id, remarks
  ) values (
    p_sample_record_id, v_sample.partner_barcode, v_barcode,
    v_sample.partner_accession_number, v_accession, p_actor_id,
    nullif(pg_catalog.left(pg_catalog.btrim(coalesce(p_remarks,'')),2000),'')
  );

  update public.partner_samples set
    partner_barcode = v_barcode,
    partner_accession_number = v_accession,
    identifier_entered_by = p_actor_id,
    identifier_entered_at = pg_catalog.now(),
    admin_verified = p_verify,
    admin_verified_by = case when p_verify then p_actor_id::text else admin_verified_by end,
    admin_verified_at = case when p_verify then pg_catalog.now() else admin_verified_at end,
    handover_status = case when p_verify then 'Received by Partner Lab'
                           else 'Barcode / Accession ID Entered' end,
    handover_status_history = handover_status_history || pg_catalog.jsonb_build_array(
      case when p_verify then pg_catalog.jsonb_build_object('status','Verified by Admin','actorId',p_actor_id,'at',pg_catalog.now()) end,
      case when p_verify then pg_catalog.jsonb_build_object('status','Barcode / Accession ID Entered','actorId',p_actor_id,'at',pg_catalog.now()) end,
      pg_catalog.jsonb_build_object('status',case when p_verify then 'Received by Partner Lab' else 'Barcode / Accession ID Entered' end,'actorId',p_actor_id,'at',pg_catalog.now())),
    verification_remarks = nullif(pg_catalog.left(pg_catalog.btrim(coalesce(p_remarks,'')),2000),''),
    status = case when p_verify then 'Received by Partner Lab' else status end,
    updated_at = pg_catalog.now()
  where id = p_sample_record_id
  returning * into v_sample;
  if p_verify and not exists (
    select 1 from public.partner_samples ps
     where ps.booking_id = v_sample.booking_id and ps.handover_status <> 'Received by Partner Lab'
  ) then
    update public.collection_jobs cj set status = 'Completed', completed_at = pg_catalog.now(), updated_at = pg_catalog.now(),
      status_history = cj.status_history || pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object(
        'status','Completed','timestamp',pg_catalog.now(),'performedBy',p_actor_id,'notes','Admin verified all sample handovers.'))
     where cj.booking_id = v_sample.booking_id;
    update public.bookings set booking_status = 'PROCESSING'::public.booking_status, updated_at = pg_catalog.now()
     where id = v_sample.booking_id;
  end if;
  return v_sample;
end;
$$;

revoke all on function public.submit_partner_sample_handover(text, uuid, text, text[])
  from public, anon, authenticated;
grant execute on function public.submit_partner_sample_handover(text, uuid, text, text[])
  to service_role;
revoke all on function public.set_partner_sample_identifiers(text, uuid, text, text, boolean, text)
  from public, anon, authenticated;
grant execute on function public.set_partner_sample_identifiers(text, uuid, text, text, boolean, text)
  to service_role;
revoke all on function public.assign_booking_collection_workflow(uuid, uuid, text, text, timestamptz, uuid, text)
  from public, anon, authenticated;
grant execute on function public.assign_booking_collection_workflow(uuid, uuid, text, text, timestamptz, uuid, text)
  to service_role;
revoke all on function public.update_phlebotomist_collection_job(uuid, uuid, text, text, text, boolean, boolean, integer)
  from public, anon, authenticated;
grant execute on function public.update_phlebotomist_collection_job(uuid, uuid, text, text, text, boolean, boolean, integer)
  to service_role;
