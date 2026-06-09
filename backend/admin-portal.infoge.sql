-- ScopeX Admin Portal, report uploads, and activity tracking migration.
-- Safe to run multiple times.

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

alter table admins add column if not exists role text not null default 'admin';
alter table admins add column if not exists is_active boolean not null default true;
alter table admins add column if not exists reset_token text;
alter table admins add column if not exists reset_expires_at timestamptz;
alter table admins add column if not exists last_login_at timestamptz;
alter table admins add column if not exists updated_at timestamptz not null default now();

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

create index if not exists report_uploads_booking_idx on report_uploads(booking_id, created_at desc);
create index if not exists report_uploads_patient_idx on report_uploads(patient_name, mobile_number, created_at desc);
create index if not exists login_logs_user_idx on login_logs(user_id, created_at desc);
create index if not exists login_logs_admin_idx on login_logs(admin_id, created_at desc);
create index if not exists user_activity_logs_action_idx on user_activity_logs(action, created_at desc);
create index if not exists audit_logs_action_idx on audit_logs(action, created_at desc);
