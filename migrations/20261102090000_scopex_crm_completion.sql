-- ScopeX Diagnostics CRM Module Completion Migration
-- Additive only. Preserves all existing tables and data.
-- Extends public.leads and public.lead_activities for full CRM workflow support.

create extension if not exists pgcrypto;

-- 1. Ensure required columns on public.leads
alter table public.leads add column if not exists normalized_phone text;
alter table public.leads add column if not exists location text;
alter table public.leads add column if not exists pincode text;
alter table public.leads add column if not exists interested_items jsonb not null default '[]'::jsonb;
alter table public.leads add column if not exists campaign text;
alter table public.leads add column if not exists utm_source text;
alter table public.leads add column if not exists utm_medium text;
alter table public.leads add column if not exists utm_campaign text;
alter table public.leads add column if not exists consent boolean not null default true;
alter table public.leads add column if not exists contact_preferences jsonb not null default '{"phone":true,"whatsapp":true,"email":true}'::jsonb;
alter table public.leads add column if not exists assigned_employee_id text;
alter table public.leads add column if not exists assigned_employee_name text;
alter table public.leads add column if not exists assigned_at timestamptz;
alter table public.leads add column if not exists assignment_mode text not null default 'unassigned' check (assignment_mode in ('auto','manual','unassigned'));
alter table public.leads add column if not exists assignment_reason text;
alter table public.leads add column if not exists priority text not null default 'Medium' check (priority in ('Low','Medium','High','Urgent'));
alter table public.leads add column if not exists notes text;
alter table public.leads add column if not exists follow_up_date timestamptz;
alter table public.leads add column if not exists is_duplicate boolean not null default false;
alter table public.leads add column if not exists duplicate_count integer not null default 0;
alter table public.leads add column if not exists primary_lead_id uuid references public.leads(id) on delete set null;
alter table public.leads add column if not exists patient_id uuid references public.patients(id) on delete set null;
alter table public.leads add column if not exists booking_id uuid references public.bookings(id) on delete set null;
alter table public.leads add column if not exists booking_number text;
alter table public.leads add column if not exists converted_amount numeric(10,2);
alter table public.leads add column if not exists converted_at timestamptz;
alter table public.leads add column if not exists updated_at timestamptz not null default now();

-- 2. CRM Team Members / Customer Care Desk table
create table if not exists public.crm_team_members (
  id text primary key,
  name text not null,
  email text not null,
  phone text not null,
  role text not null default 'customer_support',
  city text not null,
  covered_pincodes text[] not null default '{}'::text[],
  active boolean not null default true,
  status text not null default 'available' check (status in ('available','busy','on_leave','offline')),
  max_daily_workload integer not null default 20 check (max_daily_workload > 0),
  current_workload integer not null default 0 check (current_workload >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Lead Activities extension
alter table public.lead_activities add column if not exists title text;

-- 4. CRM Performance Indexes
create index if not exists leads_phone_normalized_idx on public.leads(normalized_phone);
create index if not exists leads_status_idx on public.leads(status);
create index if not exists leads_assigned_employee_idx on public.leads(assigned_employee_id);
create index if not exists leads_follow_up_date_idx on public.leads(follow_up_date);
create index if not exists leads_city_pincode_idx on public.leads(city, pincode);
create index if not exists crm_team_city_status_idx on public.crm_team_members(city, status, active);

-- 5. Seed default CRM team members
insert into public.crm_team_members (id, name, email, phone, role, city, covered_pincodes, active, status, max_daily_workload)
values
  ('team-ind-01', 'Priya Sharma', 'priya.crm@scopexdiagnostics.in', '9876543201', 'customer_support', 'Indore', array['452001','452010','452011'], true, 'available', 20),
  ('team-ind-02', 'Rohit Verma', 'rohit.crm@scopexdiagnostics.in', '9876543202', 'customer_support', 'Indore', array['452012','452016','452020'], true, 'available', 20),
  ('team-bhp-01', 'Amit Saxena', 'amit.crm@scopexdiagnostics.in', '9876543203', 'customer_support', 'Bhopal', array['462001','462016','462022'], true, 'available', 20),
  ('team-del-01', 'Neha Kapoor', 'neha.crm@scopexdiagnostics.in', '9876543204', 'customer_support', 'Delhi', array['110001','110002','110025'], true, 'available', 20),
  ('team-nat-01', 'Sunil Joshi', 'sunil.crm@scopexdiagnostics.in', '9876543205', 'booking_manager', 'National Desk', array[]::text[], true, 'available', 50)
on conflict (id) do nothing;
