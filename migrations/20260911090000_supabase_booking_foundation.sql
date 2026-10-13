-- ScopeX Diagnostics Supabase booking foundation
-- Apply in Supabase SQL editor or with: supabase db push

create extension if not exists pgcrypto;

create type public.collection_type as enum ('HOME_COLLECTION', 'CENTRE_VISIT');
create type public.booking_status as enum ('STARTED','DETAILS_ENTERED','SLOT_SELECTED','PAYMENT_STARTED','PENDING_PAYMENT','PAID','CONFIRMED','ASSIGNED','COLLECTION_STARTED','SAMPLE_COLLECTED','PROCESSING','REPORT_READY','COMPLETED','CANCELLED','REFUNDED','ABANDONED');
create type public.payment_status as enum ('PENDING','PAID','FAILED','REFUNDED');
create type public.slot_hold_status as enum ('ACTIVE','EXPIRED','CONVERTED','CANCELLED');
create type public.notification_channel as enum ('whatsapp','sms','email','meta_capi');

create table if not exists public.admin_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('super_admin','admin','manager','booking_manager','report_manager','finance_manager','customer_support')),
  created_at timestamptz not null default now()
);

create table if not exists public.tests (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  code text unique,
  description text,
  price numeric(10,2) not null check (price >= 0),
  discounted_price numeric(10,2) check (discounted_price >= 0),
  preparation_instructions text,
  fasting_required boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  regular_price numeric(10,2) not null check (regular_price >= 0),
  selling_price numeric(10,2) not null check (selling_price >= 0),
  active boolean not null default true,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.package_tests (
  package_id uuid not null references public.packages(id) on delete cascade,
  test_id uuid not null references public.tests(id) on delete restrict,
  primary key (package_id, test_id)
);

create table if not exists public.service_areas (
  id uuid primary key default gen_random_uuid(),
  pincode text not null unique check (pincode ~ '^[0-9]{6}$'),
  city text not null,
  area text,
  home_collection_enabled boolean not null default true,
  centre_visit_enabled boolean not null default false,
  collection_charge numeric(10,2) not null default 0 check (collection_charge >= 0),
  minimum_order_value numeric(10,2) not null default 0 check (minimum_order_value >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collection_centres (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  city text not null,
  pincode text not null check (pincode ~ '^[0-9]{6}$'),
  latitude numeric(10,7),
  longitude numeric(10,7),
  phone text,
  opening_time time not null,
  closing_time time not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collection_slots (
  id uuid primary key default gen_random_uuid(),
  service_area_id uuid references public.service_areas(id) on delete cascade,
  centre_id uuid references public.collection_centres(id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  capacity integer not null check (capacity >= 0),
  booked_count integer not null default 0 check (booked_count >= 0),
  hold_count integer not null default 0 check (hold_count >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint slot_scope_check check (service_area_id is not null or centre_id is not null),
  constraint slot_capacity_check check (booked_count + hold_count <= capacity),
  unique(service_area_id, centre_id, date, start_time, end_time)
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  name text not null,
  mobile text not null,
  email text,
  date_of_birth date,
  age integer check (age >= 0 and age <= 130),
  gender text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_number text unique,
  patient_id uuid references public.patients(id) on delete restrict,
  collection_type public.collection_type not null,
  service_area_id uuid references public.service_areas(id) on delete restrict,
  centre_id uuid references public.collection_centres(id) on delete restrict,
  slot_id uuid references public.collection_slots(id) on delete restrict,
  address text,
  landmark text,
  subtotal numeric(10,2) not null default 0,
  discount numeric(10,2) not null default 0,
  collection_charge numeric(10,2) not null default 0,
  total_amount numeric(10,2) not null default 0,
  payment_status public.payment_status not null default 'PENDING',
  booking_status public.booking_status not null default 'STARTED',
  notes text,
  utm jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint total_amount_non_negative check (total_amount >= 0)
);

create table if not exists public.booking_items (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  test_id uuid references public.tests(id) on delete restrict,
  package_id uuid references public.packages(id) on delete restrict,
  item_name text not null,
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  total_price numeric(10,2) not null check (total_price >= 0),
  constraint one_item_source check ((test_id is not null)::int + (package_id is not null)::int = 1)
);

create table if not exists public.slot_holds (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.collection_slots(id) on delete cascade,
  session_id text not null,
  booking_id uuid references public.bookings(id) on delete set null,
  expires_at timestamptz not null,
  status public.slot_hold_status not null default 'ACTIVE',
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  provider text not null default 'razorpay',
  provider_order_id text unique,
  provider_payment_id text unique,
  provider_signature text,
  webhook_event_id text unique,
  amount numeric(10,2) not null check (amount >= 0),
  currency text not null default 'INR',
  status public.payment_status not null default 'PENDING',
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collection_executives (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  mobile text not null,
  city text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.booking_assignments (
  booking_id uuid primary key references public.bookings(id) on delete cascade,
  executive_id uuid not null references public.collection_executives(id) on delete restrict,
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now()
);

create table if not exists public.marketing_attribution (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade,
  session_id text not null,
  first_touch_source text,
  first_touch_medium text,
  first_touch_campaign text,
  last_touch_source text,
  last_touch_medium text,
  last_touch_campaign text,
  gclid text,
  fbclid text,
  landing_page text,
  referrer text,
  created_at timestamptz not null default now()
);

create table if not exists public.booking_sessions (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  booking_id uuid references public.bookings(id) on delete set null,
  status text not null default 'STARTED' check (status in ('STARTED','DETAILS_ENTERED','SLOT_SELECTED','PAYMENT_STARTED','PAID','ABANDONED')),
  mobile text,
  email text,
  recovery_count integer not null default 0,
  last_recovery_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade,
  channel public.notification_channel not null,
  template text not null,
  recipient text not null,
  status text not null default 'queued',
  provider_message_id text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  report_url text,
  status text not null default 'PENDING' check (status in ('PENDING','READY','FAILED')),
  uploaded_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists tests_active_idx on public.tests(active, slug);
create index if not exists packages_active_idx on public.packages(active, featured);
create index if not exists service_areas_active_pincode_idx on public.service_areas(pincode) where active;
create index if not exists slots_lookup_idx on public.collection_slots(service_area_id, centre_id, date, active);
create index if not exists slot_holds_active_idx on public.slot_holds(slot_id, expires_at) where status = 'ACTIVE';
create index if not exists bookings_created_idx on public.bookings(created_at desc);
create index if not exists bookings_status_idx on public.bookings(booking_status, payment_status);
create index if not exists booking_items_booking_idx on public.booking_items(booking_id);
create index if not exists attribution_session_idx on public.marketing_attribution(session_id, created_at);
create index if not exists notification_booking_idx on public.notification_logs(booking_id, created_at desc);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_roles where user_id = auth.uid());
$$;

create or replace function public.generate_scopex_booking_number()
returns text
language plpgsql
as $$
declare
  seq_num integer;
  generated text;
begin
  select count(*) + 1 into seq_num from public.bookings where created_at::date = current_date;
  generated := 'SX' || to_char(now(), 'YYMMDD') || lpad(seq_num::text, 3, '0');
  while exists (select 1 from public.bookings where booking_number = generated) loop
    seq_num := seq_num + 1;
    generated := 'SX' || to_char(now(), 'YYMMDD') || lpad(seq_num::text, 3, '0');
  end loop;
  return generated;
end;
$$;

create or replace function public.set_booking_number()
returns trigger
language plpgsql
as $$
begin
  if new.booking_number is null then
    new.booking_number := public.generate_scopex_booking_number();
  end if;
  return new;
end;
$$;

drop trigger if exists bookings_set_booking_number on public.bookings;
create trigger bookings_set_booking_number before insert on public.bookings for each row execute function public.set_booking_number();

create or replace function public.expire_slot_holds()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  expired_count integer;
begin
  update public.slot_holds
     set status = 'EXPIRED'
   where status = 'ACTIVE'
     and expires_at <= now();
  get diagnostics expired_count = row_count;

  update public.collection_slots s
     set hold_count = greatest(0, sub.active_holds)
    from (
      select slot_id, count(*)::integer as active_holds
        from public.slot_holds
       where status = 'ACTIVE' and expires_at > now()
       group by slot_id
    ) sub
   where s.id = sub.slot_id;

  update public.collection_slots s
     set hold_count = 0
   where not exists (
      select 1 from public.slot_holds h
       where h.slot_id = s.id and h.status = 'ACTIVE' and h.expires_at > now()
   );

  return expired_count;
end;
$$;

create or replace function public.hold_collection_slot(p_slot_id uuid, p_session_id text, p_hold_minutes integer default 10)
returns public.slot_holds
language plpgsql
security definer
set search_path = public
as $$
declare
  slot_row public.collection_slots%rowtype;
  hold_row public.slot_holds%rowtype;
begin
  perform public.expire_slot_holds();

  select * into slot_row
    from public.collection_slots
   where id = p_slot_id and active = true and date >= current_date
   for update;

  if not found then
    raise exception 'Slot is unavailable';
  end if;

  if slot_row.booked_count + slot_row.hold_count >= slot_row.capacity then
    raise exception 'Slot is full';
  end if;

  update public.slot_holds
     set status = 'CANCELLED'
   where session_id = p_session_id and status = 'ACTIVE';

  insert into public.slot_holds(slot_id, session_id, expires_at, status)
  values (p_slot_id, p_session_id, now() + make_interval(mins => least(greatest(p_hold_minutes, 5), 10)), 'ACTIVE')
  returning * into hold_row;

  update public.collection_slots
     set hold_count = hold_count + 1
   where id = p_slot_id;

  return hold_row;
end;
$$;

create or replace function public.convert_slot_hold(p_hold_id uuid, p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  hold_row public.slot_holds%rowtype;
begin
  select * into hold_row from public.slot_holds where id = p_hold_id and status = 'ACTIVE' and expires_at > now() for update;
  if not found then
    raise exception 'Slot hold is expired or unavailable';
  end if;

  update public.slot_holds set status = 'CONVERTED', booking_id = p_booking_id where id = p_hold_id;
  update public.collection_slots
     set hold_count = greatest(0, hold_count - 1), booked_count = booked_count + 1
   where id = hold_row.slot_id;
  update public.bookings set slot_id = hold_row.slot_id, booking_status = 'CONFIRMED' where id = p_booking_id;
end;
$$;

alter table public.tests enable row level security;
alter table public.packages enable row level security;
alter table public.package_tests enable row level security;
alter table public.service_areas enable row level security;
alter table public.collection_centres enable row level security;
alter table public.collection_slots enable row level security;
alter table public.slot_holds enable row level security;
alter table public.patients enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_items enable row level security;
alter table public.payments enable row level security;
alter table public.collection_executives enable row level security;
alter table public.booking_assignments enable row level security;
alter table public.marketing_attribution enable row level security;
alter table public.booking_sessions enable row level security;
alter table public.notification_logs enable row level security;
alter table public.reports enable row level security;
alter table public.admin_roles enable row level security;

create policy "Public can read active tests" on public.tests for select using (active = true);
create policy "Public can read active packages" on public.packages for select using (active = true);
create policy "Public can read package relationships" on public.package_tests for select using (true);
create policy "Public can check active service areas" on public.service_areas for select using (active = true);
create policy "Public can read active centres" on public.collection_centres for select using (active = true);
create policy "Public can read active future slots" on public.collection_slots for select using (active = true and date >= current_date);

create policy "Admins manage tests" on public.tests for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage packages" on public.packages for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage package tests" on public.package_tests for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage service areas" on public.service_areas for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage centres" on public.collection_centres for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage slots" on public.collection_slots for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins view patients" on public.patients for select using (public.is_admin());
create policy "Admins manage bookings" on public.bookings for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage booking items" on public.booking_items for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage payments" on public.payments for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage executives" on public.collection_executives for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage assignments" on public.booking_assignments for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins view attribution" on public.marketing_attribution for select using (public.is_admin());
create policy "Admins manage sessions" on public.booking_sessions for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins view notifications" on public.notification_logs for select using (public.is_admin());
create policy "Admins manage reports" on public.reports for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage roles" on public.admin_roles for all using (public.is_admin()) with check (public.is_admin());

create policy "Patients can read own profile" on public.patients for select using (auth.uid() = auth_user_id);
create policy "Patients can read own bookings" on public.bookings for select using (patient_id in (select id from public.patients where auth_user_id = auth.uid()));
create policy "Patients can read own booking items" on public.booking_items for select using (booking_id in (select b.id from public.bookings b join public.patients p on p.id = b.patient_id where p.auth_user_id = auth.uid()));
create policy "Patients can read own reports" on public.reports for select using (booking_id in (select b.id from public.bookings b join public.patients p on p.id = b.patient_id where p.auth_user_id = auth.uid()));

-- Public writes are intentionally restricted. Booking, payment, slot hold conversion,
-- notifications, and marketing CAPI should be performed through server routes or Edge Functions
-- using the service-role key and the transactional functions above.
