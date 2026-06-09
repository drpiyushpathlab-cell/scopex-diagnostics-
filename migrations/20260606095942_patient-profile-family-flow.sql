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
  if not exists (select 1 from pg_constraint where conname = 'users_patient_id_fkey') then
    alter table users add constraint users_patient_id_fkey foreign key (patient_id) references patients(id) on delete set null;
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
alter table family_members add column if not exists dob date;
alter table family_members add column if not exists mobile text;
alter table family_members add column if not exists health_note text;
alter table family_members add column if not exists is_default boolean not null default false;

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
  subtotal numeric(10,2) not null default 0,
  discount_total numeric(10,2) not null default 0,
  payable_amount numeric(10,2) not null default 0,
  payment_method text not null default 'online',
  payment_status text not null default 'created',
  booking_status text not null default 'pending_confirmation',
  offer_breakdown jsonb not null default '[]'::jsonb,
  referral_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table bookings add column if not exists booking_id text unique;
alter table bookings add column if not exists collection_type text not null default 'home';
alter table bookings add column if not exists is_draft boolean not null default false;
alter table bookings add column if not exists locked_at timestamptz;
alter table bookings add column if not exists phlebotomist_id uuid;
alter table bookings add column if not exists eta_minutes integer;
alter table bookings add column if not exists eta_updated_at timestamptz;
alter table bookings add column if not exists advance_amount numeric(10,2) not null default 0;
alter table bookings add column if not exists patient_type text not null default 'self';
alter table bookings add column if not exists family_member_id uuid references family_members(id) on delete set null;
alter table bookings add column if not exists package_id text;
alter table bookings add column if not exists address_id uuid;
alter table bookings add column if not exists slot_date date;
alter table bookings add column if not exists slot_time text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'bookings_collection_type_home_check') then
    alter table bookings add constraint bookings_collection_type_home_check check (collection_type = 'home');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'bookings_patient_type_check') then
    alter table bookings add constraint bookings_patient_type_check check (patient_type in ('self', 'family'));
  end if;
end $$;

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

create index if not exists user_profiles_user_idx on user_profiles(user_id);
create index if not exists family_members_user_idx on family_members(user_id);
create index if not exists family_members_default_idx on family_members(user_id, is_default);
create index if not exists bookings_user_idx on bookings(user_id, created_at desc);
create index if not exists booking_items_booking_idx on booking_items(booking_id);
