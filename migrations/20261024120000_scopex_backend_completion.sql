-- ScopeX Diagnostics Backend Completion Migration
-- Additive only. Preserves all existing tables and data.
-- Applies on top of 20260911090000_supabase_booking_foundation.sql and 20261013090000_scopex_prd_v2_marketplace_schema.sql.

create extension if not exists pgcrypto;

-- 1. Admins Table for secure credential storage & role-based dashboard access
create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  role text not null default 'admin' check (role in ('super_admin', 'admin', 'manager', 'booking_manager', 'report_manager', 'finance_manager', 'customer_support')),
  name text,
  phone text,
  is_active boolean not null default true,
  reset_token text,
  reset_expires_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure columns exist if table was partially created earlier
alter table public.admins add column if not exists role text not null default 'admin';
alter table public.admins add column if not exists name text;
alter table public.admins add column if not exists phone text;
alter table public.admins add column if not exists is_active boolean not null default true;
alter table public.admins add column if not exists reset_token text;
alter table public.admins add column if not exists reset_expires_at timestamptz;
alter table public.admins add column if not exists last_login_at timestamptz;
alter table public.admins add column if not exists updated_at timestamptz not null default now();

-- 2. Phlebotomists / Field Operations Table
create table if not exists public.phlebotomists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text unique not null,
  email text,
  city text not null,
  pincodes text[] not null default '{}'::text[],
  active boolean not null default true,
  status text not null default 'available' check (status in ('available', 'on_duty', 'busy', 'offline')),
  current_latitude numeric(10,7),
  current_longitude numeric(10,7),
  max_daily_slots integer not null default 15 check (max_daily_slots > 0),
  assigned_count integer not null default 0 check (assigned_count >= 0),
  rating numeric(3,2) default 4.90,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Lead Activities / CRM Touchpoint Logs
create table if not exists public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  activity_type text not null check (activity_type in ('call', 'whatsapp', 'email', 'note', 'status_change', 'meeting')),
  notes text not null,
  performed_by text default 'system',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 4. General Audit Logs Table
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id text,
  actor_email text,
  role text,
  action text not null,
  entity_type text not null,
  entity_id text,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 5. User & Admin Session Logs
create table if not exists public.login_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  admin_id uuid,
  email text,
  phone text,
  role text not null default 'patient',
  event text not null check (event in ('login', 'logout', 'failed_attempt', 'password_change')),
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

-- 6. Add phlebotomist assignment and patient fields to bookings if not already present
alter table public.bookings add column if not exists assigned_phlebotomist_id uuid references public.phlebotomists(id) on delete set null;
alter table public.bookings add column if not exists phlebotomist_assigned_at timestamptz;
alter table public.bookings add column if not exists sample_collected_at timestamptz;
alter table public.bookings add column if not exists internal_notes text;
alter table public.bookings add column if not exists customer_phone text;
alter table public.bookings add column if not exists customer_name text;
alter table public.bookings add column if not exists cancellation_reason text;
alter table public.bookings add column if not exists cancelled_at timestamptz;

-- 7. Add SEO/AEO/GEO columns to Service Areas & Collection Centres
alter table public.service_areas add column if not exists geo_latitude numeric(10,7);
alter table public.service_areas add column if not exists geo_longitude numeric(10,7);
alter table public.service_areas add column if not exists seo_title text;
alter table public.service_areas add column if not exists seo_description text;
alter table public.service_areas add column if not exists schema_json jsonb not null default '{}'::jsonb;

-- 8. Seed Default Settings if missing
insert into public.app_settings (key, value, description)
values
  (
    'assignment_settings',
    '{"mode":"auto","radius_km":15,"max_daily_collections_per_agent":12,"prioritize_same_pincode":true,"auto_reassign_on_cancel":true}'::jsonb,
    'Phlebotomist home collection assignment configuration'
  ),
  (
    'customer_care_settings',
    '{"support_phone":"+918989273440","support_email":"scopex.lab@gmail.com","working_hours":"6:00 AM - 10:00 PM"}'::jsonb,
    'Customer care contact and operational hours'
  )
on conflict (key) do nothing;

-- 9. Performance Indexes
create index if not exists phlebotomists_city_status_idx on public.phlebotomists(city, status, active);
create index if not exists lead_activities_lead_id_idx on public.lead_activities(lead_id, created_at desc);
create index if not exists audit_logs_entity_idx on public.audit_logs(entity_type, entity_id, created_at desc);
create index if not exists login_logs_created_idx on public.login_logs(created_at desc);
create index if not exists bookings_customer_phone_idx on public.bookings(customer_phone);

-- 10. Enable Row Level Security (RLS)
alter table public.admins enable row level security;
alter table public.phlebotomists enable row level security;
alter table public.lead_activities enable row level security;
alter table public.audit_logs enable row level security;
alter table public.login_logs enable row level security;
