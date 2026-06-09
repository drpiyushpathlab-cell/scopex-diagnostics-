create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  phone text unique,
  mobile text generated always as (phone) stored,
  email text unique,
  role text not null default 'patient' check (role in ('patient', 'admin')),
  patient_id uuid,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table users add column if not exists medical_history jsonb not null default '{}'::jsonb;

create table if not exists patients (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  mobile text not null,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'users_patient_id_fkey'
  ) then
    alter table users
      add constraint users_patient_id_fkey foreign key (patient_id) references patients(id) on delete set null;
  end if;
end $$;

create table if not exists family_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  age integer,
  gender text,
  relation text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table family_members add column if not exists medical_history jsonb not null default '{}'::jsonb;

create table if not exists cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  member_id uuid references family_members(id) on delete set null,
  item_type text not null check (item_type in ('package', 'test')),
  item_ref text not null,
  item_name text not null,
  unit_price numeric(10,2) not null,
  mrp numeric(10,2) not null default 0,
  category text,
  description text,
  quantity integer not null default 1 check (quantity > 0 and quantity <= 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tests (
  id text primary key,
  slug text unique not null,
  name text not null,
  category text not null,
  description text,
  price numeric(10,2) not null,
  mrp numeric(10,2) not null,
  discount integer not null default 0,
  fasting_required boolean not null default false,
  fasting_hours text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists packages (
  id text primary key,
  slug text unique not null,
  name text not null,
  category text,
  description text,
  price numeric(10,2) not null,
  mrp numeric(10,2) not null,
  discount integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists package_tests (
  id uuid primary key default gen_random_uuid(),
  package_id text not null references packages(id) on delete cascade,
  test_id text not null references tests(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(package_id, test_id)
);

create table if not exists offers (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  type text not null check (type in ('FIRST_USER', 'FAMILY', 'COUPON', 'MEMBERSHIP', 'REFERRAL')),
  discount_type text not null check (discount_type in ('PERCENT', 'FLAT')),
  value numeric(10,2) not null,
  conditions jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  patient_id uuid references patients(id) on delete set null,
  member_id uuid references family_members(id) on delete set null,
  contact_name text not null,
  contact_phone text not null,
  contact_email text,
  city text,
  address text,
  preferred_date date,
  preferred_time text,
  scheduled_date timestamptz,
  family_member_count integer not null default 0,
  total_amount numeric(10,2) generated always as (subtotal) stored,
  subtotal numeric(10,2) not null default 0,
  discount numeric(10,2) generated always as (discount_total) stored,
  discount_total numeric(10,2) not null default 0,
  final_amount numeric(10,2) generated always as (payable_amount) stored,
  payable_amount numeric(10,2) not null default 0,
  payment_method text not null default 'online',
  payment_status text not null default 'created',
  status text generated always as (booking_status) stored,
  booking_status text not null default 'pending_confirmation',
  offer_breakdown jsonb not null default '[]'::jsonb,
  referral_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table bookings add column if not exists booking_id text unique;
alter table bookings add column if not exists collection_type text not null default 'home' check (collection_type = 'home');
alter table bookings add column if not exists is_draft boolean not null default false;
alter table bookings add column if not exists locked_at timestamptz;
alter table bookings add column if not exists phlebotomist_id uuid;
alter table bookings add column if not exists eta_minutes integer;
alter table bookings add column if not exists eta_updated_at timestamptz;
alter table bookings add column if not exists advance_amount numeric(10,2) not null default 0;

create table if not exists booking_items (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  item_type text not null check (item_type in ('package', 'test')),
  item_ref text not null,
  item_name text not null,
  unit_price numeric(10,2) not null,
  mrp numeric(10,2) not null,
  category text,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists booking_family_members (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  full_name text not null,
  relationship text not null,
  age integer,
  gender text,
  created_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  provider text not null default 'razorpay',
  provider_order_id text,
  provider_payment_id text,
  provider_signature text,
  payment_id text generated always as (provider_payment_id) stored,
  amount numeric(10,2),
  status text not null default 'created',
  created_at timestamptz not null default now()
);

create table if not exists phlebotomists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  mobile text not null,
  vehicle_number text,
  current_lat numeric(10,7),
  current_lng numeric(10,7),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'bookings_phlebotomist_id_fkey'
  ) then
    alter table bookings
      add constraint bookings_phlebotomist_id_fkey foreign key (phlebotomist_id) references phlebotomists(id) on delete set null;
  end if;
end $$;

create table if not exists booking_status_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  status text not null check (status in ('draft', 'confirmed', 'assigned', 'on_the_way', 'collected', 'processing', 'completed', 'cancelled')),
  note text,
  eta_minutes integer,
  actor_id uuid,
  actor_role text,
  created_at timestamptz not null default now()
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  report_url text,
  status text not null default 'pending',
  generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table reports add column if not exists file_name text;
alter table reports add column if not exists uploaded_by uuid;

create table if not exists report_uploads (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade,
  booking_code text,
  user_id uuid references users(id) on delete set null,
  patient_name text not null,
  mobile_number text not null,
  file_name text not null,
  file_size integer not null,
  mime_type text not null default 'application/pdf',
  file_data text,
  uploaded_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists login_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  admin_id uuid,
  role text,
  event text not null check (event in ('login', 'logout')),
  login_time timestamptz,
  logout_time timestamptz,
  last_active_at timestamptz,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists user_activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  admin_id uuid,
  role text,
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text,
  user_agent text,
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid,
  role text,
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists admins (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  role text not null default 'admin',
  is_active boolean not null default true,
  reset_token text,
  reset_expires_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists admin_roles (
  id uuid primary key default gen_random_uuid(),
  role text unique not null,
  permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

insert into admin_roles (role, permissions)
values
  ('super_admin', '{"reports_delete": true, "admin_manage": true, "audit_export": true}'::jsonb),
  ('admin', '{"reports_delete": false, "admin_manage": false, "audit_export": true}'::jsonb),
  ('manager', '{"reports_delete": false, "admin_manage": false, "audit_export": false}'::jsonb)
on conflict (role) do nothing;

create table if not exists otp_logs (
  id uuid primary key default gen_random_uuid(),
  mobile text not null,
  otp_hash text not null,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  verified_at timestamptz,
  provider_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists otp_verification (
  id uuid primary key default gen_random_uuid(),
  mobile text not null,
  otp_hash text not null,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  verified_at timestamptz,
  provider_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  plan_name text not null default 'ScopeX Plus',
  amount numeric(10,2) not null default 199,
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid references users(id) on delete set null,
  referred_user_id uuid references users(id) on delete set null,
  referral_code text not null,
  reward_status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  lead_type text not null,
  name text not null,
  age integer,
  gender text,
  mobile_number text not null,
  city text,
  address text,
  preferred_time text,
  purpose text,
  source text not null default 'website',
  created_at timestamptz not null default now()
);

alter table leads add column if not exists collection_date text;
alter table leads add column if not exists family_members text;

create index if not exists family_members_user_idx on family_members(user_id);
create index if not exists cart_items_user_idx on cart_items(user_id, created_at desc);
create index if not exists bookings_user_idx on bookings(user_id, created_at desc);
create index if not exists booking_items_booking_idx on booking_items(booking_id);
create index if not exists booking_family_members_booking_idx on booking_family_members(booking_id);
create index if not exists payments_booking_idx on payments(booking_id);
create index if not exists booking_status_events_booking_idx on booking_status_events(booking_id, created_at asc);
create index if not exists phlebotomists_active_idx on phlebotomists(is_active);
create index if not exists otp_logs_mobile_idx on otp_logs(mobile, created_at desc);
create index if not exists otp_verification_mobile_idx on otp_verification(mobile, created_at desc);
create index if not exists leads_mobile_idx on leads(mobile_number, lead_type, created_at desc);
create index if not exists report_uploads_booking_idx on report_uploads(booking_id, created_at desc);
create index if not exists report_uploads_patient_idx on report_uploads(patient_name, mobile_number, created_at desc);
create index if not exists login_logs_user_idx on login_logs(user_id, created_at desc);
create index if not exists login_logs_admin_idx on login_logs(admin_id, created_at desc);
create index if not exists user_activity_logs_action_idx on user_activity_logs(action, created_at desc);
create index if not exists audit_logs_action_idx on audit_logs(action, created_at desc);

insert into offers (code, type, discount_type, value, conditions)
values
  ('FIRST15', 'FIRST_USER', 'PERCENT', 15, '{"auto": true}'::jsonb),
  ('FAMILY10', 'FAMILY', 'PERCENT', 10, '{"min_family_members": 1, "auto": true}'::jsonb),
  ('MEMBER199', 'MEMBERSHIP', 'FLAT', 199, '{"annual": true}'::jsonb)
on conflict (code) do nothing;

-- Patient profile completion and reusable family booking flow
create table if not exists user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  full_name text,
  mobile text not null,
  email text,
  dob date,
  age integer,
  gender text,
  address text,
  city text,
  pincode text,
  preferred_collection_address text,
  is_profile_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table family_members add column if not exists dob date;
alter table family_members add column if not exists mobile text;
alter table family_members add column if not exists health_note text;
alter table family_members add column if not exists is_default boolean not null default false;

alter table bookings add column if not exists patient_type text not null default 'self' check (patient_type in ('self', 'family'));
alter table bookings add column if not exists family_member_id uuid references family_members(id) on delete set null;
alter table bookings add column if not exists package_id text;
alter table bookings add column if not exists address_id uuid;
alter table bookings add column if not exists slot_date date;
alter table bookings add column if not exists slot_time text;
alter table bookings add column if not exists booking_patients jsonb not null default '[]'::jsonb;

alter table booking_items add column if not exists booking_patient_id text;
alter table booking_items add column if not exists family_member_id uuid references family_members(id) on delete set null;
alter table booking_items add column if not exists patient_name text;
alter table booking_items add column if not exists patient_relation text;

create index if not exists user_profiles_user_idx on user_profiles(user_id);
create index if not exists family_members_default_idx on family_members(user_id, is_default);
create index if not exists booking_items_patient_idx on booking_items(booking_id, booking_patient_id);
